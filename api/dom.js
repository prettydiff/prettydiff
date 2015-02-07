/*prettydiff.com api.topcoms: true, api.inchar: " ", api.insize: 4, api.vertical: true */
/*global console, edition, document, localStorage, window, prettydiff, summary, markup_beauty, csspretty, csvbeauty, csvmin, markupmin, jspretty, diffview, XMLHttpRequest, location, ActiveXObject, FileReader, navigator, setTimeout, codeMirror, AudioContext, ArrayBuffer, Uint8Array*/
/***********************************************************************
 This is written by Austin Cheney on 3 Mar 2009. Anybody may use this;
 code without permission so long as this comment exists verbatim in each;
 instance of its use.

 http: //www.travelocity.com/
 http: //mailmarkup.org/
 http: //prettydiff.com/

 CodeMirror
 Copyright (C) 2013 by Marijn Haverbeke <marijnh@gmail.com> and others
 http://codemirror.com/   - MIT License
 ***********************************************************************/
var pd = {};

(function dom__init() {
    "use strict";

    if (typeof prettydiff === "function") {
        pd.application = prettydiff;
    }

    pd.source = "";
    pd.diff   = "";

    //test for web browser features for progressive enhancement
    pd.test   = {
        //get the lowercase useragent string
        agent      : (typeof navigator === "object") ? navigator.userAgent.toLowerCase() : "",

        //test for standard web audio support
        audio      : ((typeof AudioContext === "function" || typeof AudioContext === "object") && AudioContext !== null) ? new AudioContext() : null,

        //delect if CodeMirror is supported
        cm         : (location.href.toLowerCase().indexOf("codemirror=false") < 0 && (typeof codeMirror === "object" || typeof codeMirror === "function")) ? true : false,

        //am I served from the Pretty Diff domain
        domain     : (location.href.indexOf("prettydiff.com") < 15) ? true : false,

        //If the output is too large the report must open and minimize in a single step
        filled     : {
            code: false,
            feed: false,
            stat: false
        },

        //test for support of the file api
        fs         : (typeof FileReader === "function" && typeof new FileReader().readAsText === "function") ? true : false,

        //check for native JSON support
        json       : (JSON === undefined) ? false : true,

        //stores keypress state to avoid execution of pd.recycle from certain key combinations
        keypress   : false,

        keysequence: [],

        //supplement to ensure keypress is returned to false only after other keys other than ctrl are released
        keystore   : [],

        //some operations should not occur as the page is initially loading
        load       : true,

        //test for localStorage and assign the result of the test
        ls         : (typeof localStorage === "object" && localStorage !== null && typeof localStorage.getItem === "function" && typeof localStorage.hasOwnProperty === "function") ? true : false,

        //CodeMirror will only render correctly if the parent container is visible, this test solves for this problem
        render     : {
            beau: false,
            diff: false,
            minn: false
        },

        //supplies alternate keyboard navigation to editable text areas
        tabesc     : [],

        //check of native AJAX support
        xhr        : (typeof XMLHttpRequest === "function" || typeof XMLHttpRequest === "object" || typeof ActiveXObject === "function")
    };

    if (pd.test.agent.indexOf("msie 8.0;") > 0) {
        document.getElementsByTagName("body")[0].innerHTML = "<h1>Pretty Diff</h1> <p>Sorry, but Pretty Diff no longer supports IE8. <a href='http://www.microsoft.com/en-us/download/internet-explorer.aspx'>Please upgrade</a> and try again.</p>";
        return;
    }
    //beacon error messages so that they are reported and fixed
    pd.error = function dom__errorShell() {
        return;
    };
    if (pd.test.xhr === true && pd.test.domain === true) {
        pd.error       = function dom__error(message, url, line, column) {
            var xhr        = (typeof XMLHttpRequest === "function" || typeof XMLHttpRequest === "object") ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"),
                datapack   = {
                    addy    : location.href,
                    agent   : pd.test.agent,
                    column  : column,
                    diff    : pd.diff,
                    line    : line,
                    message : message,
                    mode    : pd.mode,
                    options : pd.commentString,
                    settings: pd.settings,
                    source  : pd.source,
                    stat    : pd.stat,
                    url     : url
                },
                words      = message.toLowerCase(),
                exceptions = [
                    "quota exceeded", "script error", "unexpected number", "quotaexceedederror"
                ],
                a          = 0;
            //this for loop prevents sending errors I have no intention of fixing
            for (a = exceptions.length - 1; a > -1; a -= 1) {
                if (words.indexOf(exceptions[a]) > -1) {
                    console.error("Line " + line + " at column " + column + " of " + url + "\n\n" + message + "\nHelp a guy out and open a bug: https://github.com/austincheney/prettydiff/issues");
                    return true;
                }
            }
            if (message.indexOf("innerHTML") > 0 || url.indexOf("prettydiff.com/pretty") > 0) {
                datapack.source = pd.source;
                if (datapack.mode === "diff") {
                    datapack.diff = pd.diff;
                }
            }
            xhr.withCredentials = true;
            xhr.open("POST", "http://prettydiff.com:8000/error/", true);
            xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
            xhr.send(JSON.stringify(datapack));
            console.error("Line " + line + " at column " + column + " of " + url + "\n\n" + message + "\nHelp a guy out and open a bug: https://github.com/austincheney/prettydiff/issues");
            return true;
        };
        window.onerror = pd.error;
    }

    //global color property so that HTML generated reports know which
    //CSS theme to apply
    pd.color              = "white";

    //stores data for the comment string
    pd.commentString      = [];

    //statistical usage data
    pd.stat               = {
        avday : 1,
        beau  : 0,
        css   : 0,
        csv   : 0,
        diff  : 0,
        fdate : 0,
        js    : 0,
        large : 0,
        markup: 0,
        minn  : 0,
        pdate : "",
        text  : 0,
        usage : 0,
        useday: 0,
        visit : 0
    };

    //shorthand for document.getElementById method
    pd.$$                 = function dom__$$(x) {
        if (document.getElementById === undefined) {
            return;
        }
        return document.getElementById(x);
    };

    //shared DOM nodes
    pd.o                  = {
        announce    : pd.$$("announcement"),
        announcetext: "",
        beau        : pd.$$("Beautify"),
        beauOps     : pd.$$("beauops"),
        codeBeauIn  : pd.$$("beautyinput"),
        codeBeauOut : pd.$$("beautyoutput"),
        codeDiffBase: pd.$$("baseText"),
        codeDiffNew : pd.$$("newText"),
        codeMinnIn  : pd.$$("minifyinput"),
        codeMinnOut : pd.$$("minifyoutput"),
        comment     : pd.$$("option_comment"),
        diffBase    : pd.$$("diffBase"),
        diffNew     : pd.$$("diffNew"),
        diffOps     : pd.$$("diffops"),
        jsscope     : pd.$$("jsscope-yes"),
        lang        : pd.$$("language"),
        langdefault : pd.$$("lang-default"),
        langproper  : "",
        length      : {
            beau    : 0,
            diffBase: 0,
            diffNew : 0,
            minn    : 0
        },
        maxInputs   : pd.$$("hideOptions"),
        minn        : pd.$$("Minify"),
        minnOps     : pd.$$("miniops"),
        modeBeau    : pd.$$("modebeautify"),
        modeDiff    : pd.$$("modediff"),
        modeMinn    : pd.$$("modeminify"),
        page        : document.getElementsByTagName("body")[0],
        report      : {
            code: {
                box: pd.$$("codereport")
            },
            feed: {
                box: pd.$$("feedreport")
            },
            stat: {
                box: pd.$$("statreport")
            }
        },
        save        : pd.$$("diff-save")
    };
    pd.o.report.feed.body = (pd.o.report.feed.box === null) ? null : pd.o.report.feed.box.getElementsByTagName("div")[0];
    pd.o.report.code.body = (pd.o.report.code.box === null) ? null : pd.o.report.code.box.getElementsByTagName("div")[0];
    pd.o.report.stat.body = (pd.o.report.stat.box === null) ? null : pd.o.report.stat.box.getElementsByTagName("div")[0];

    //language detection
    pd.auto               = function dom__auto(a) {
        var b        = [],
            c        = 0,
            d        = 0,
            join     = "",
            flaga    = false,
            flagb    = false,
            defaultt = (pd.o.langdefault === null) ? "javascript" : pd.o.langdefault[pd.o.langdefault.selectedIndex].value;
        if (a === undefined || (/^(\s*#)/).test(a) === true || (/\n\s*(\.|@)mixin\(?\s*/).test(a) === true) {
            pd.langproper = "bobjsort-css";
            return "css";
        }
        b = a.replace(/\[[a-zA-Z][\w\-]*\=("|')?[a-zA-Z][\w\-]*("|')?\]/g, "").split("");
        c = b.length;
        if ((/^([\s\w\-]*<)/).test(a) === false && (/(>[\s\w\-]*)$/).test(a) === false) {
            for (d = 1; d < c; d += 1) {
                if (flaga === false) {
                    if (b[d] === "*" && b[d - 1] === "/") {
                        b[d - 1] = "";
                        flaga    = true;
                    } else if (flagb === false && b[d] === "f" && d < c - 6 && b[d + 1] === "i" && b[d + 2] === "l" && b[d + 3] === "t" && b[d + 4] === "e" && b[d + 5] === "r" && b[d + 6] === ":") {
                        flagb = true;
                    }
                } else if (flaga === true && b[d] === "*" && d !== c - 1 && b[d + 1] === "/") {
                    flaga    = false;
                    b[d]     = "";
                    b[d + 1] = "";
                } else if (flagb === true && b[d] === ";") {
                    flagb = false;
                    b[d]  = "";
                }
                if (flaga === true || flagb === true) {
                    b[d] = "";
                }
            }
            join = b.join("");
            if ((/^(\s*(\{|\[))/).test(a) === true && (/((\]|\})\s*)$/).test(a) && a.indexOf(",") !== -1) {
                pd.langproper = "JavaScript";
                return "javascript";
            }
            if ((/((\}?(\(\))?\)*;?\s*)|([a-z0-9]("|')?\)*);?(\s*\})*)$/i).test(a) === true && ((/(var\s+[a-z]+[a-zA-Z0-9]*)/).test(a) === true || (/((\=|(\$\())\s*function)|(\s*function\s+(\w*\s+)?\()/).test(a) === true || a.indexOf("{") === -1 || (/^(\s*if\s+\()/).test(a) === true)) {
                if (a.indexOf("(") > -1 || a.indexOf("=") > -1 || (a.indexOf(";") > -1 && a.indexOf("{") > -1)) {
                    pd.langproper = "JavaScript";
                    return "javascript";
                }
                pd.langproper = "unknown";
                return defaultt;
            }
            if ((/^(\s*[\$\.#@a-z0-9])|^(\s*\/\*)|^(\s*\*\s*\{)/i).test(a) === true && (/^(\s*if\s*\()/).test(a) === false && a.indexOf("{") !== -1 && (/\=\s*(\{|\[|\()/).test(join) === false && ((/(\+|\-|\=|\*|\?)\=/).test(join) === false || ((/\=+('|")?\)/).test(a) === true && (/;\s*base64/).test(a) === true)) && (/function(\s+\w+)*\s*\(/).test(join) === false) {
                if ((/((public)|(private))\s+(((static)?\s+(v|V)oid)|(class)|(final))/).test(a) === true) {
                    pd.langproper = "Java (not supported yet)";
                    return "text";
                }
                if ((/:\s*(\{|\(|\[)/).test(a) === true || ((/^(\s*return;?\s*\{)/).test(a) === true && (/(\};?\s*)$/).test(a) === true)) {
                    pd.langproper = "JavaScript";
                    return "javascript";
                }
                pd.langproper = "CSS";
                return "css";
            }
            pd.langproper = "unknown";
            return defaultt;
        }
        if (((/(>[\w\s:]*)?<(\/|\!)?[\w\s:\-\[]+/).test(a) === true && ((/^([\s\w]*<)/).test(a) === true || (/(>[\s\w]*)$/).test(a) === true)) || ((/^(\s*<s((cript)|(tyle)))/i).test(a) === true && (/(<\/s((cript)|(tyle))>\s*)$/i).test(a) === true)) {
            if ((/^(\s*<\!doctype html>)/i).test(a) === true || (/^(\s*<html)/i).test(a) === true || ((/^(\s*<\!DOCTYPE\s+((html)|(HTML))\s+PUBLIC\s+)/).test(a) === true && (/XHTML\s+1\.1/).test(a) === false && (/XHTML\s+1\.0\s+(S|s)((trict)|(TRICT))/).test(a) === false)) {
                pd.langproper = "HTML";
                return "html";
            }
            if ((/^(\s*<\?xml)/).test(a) === true) {
                if ((/XHTML\s+1\.1/).test(a) === true || (/XHTML\s+1\.0\s+(S|s)((trict)|(TRICT))/).test(a) === true) {
                    pd.langproper = "XHTML";
                } else {
                    pd.langproper = "XML";
                }
            } else {
                pd.langproper = "markup";
            }
            return "markup";
        }
        pd.langproper = "unknown";
        return defaultt;
    };

    //the various CSS color themes
    pd.css                = {
        core   : "body{font-family:'Arial';font-size:10px;overflow-y:scroll}#announcement.big{color:#00c;font-weight:bold;height:auto;left:14em;margin:0;overflow:hidden;position:absolute;text-overflow:ellipsis;top:4.5em;white-space:nowrap;width:50%;z-index:5}#announcement.big strong.duplicate{display:block}#announcement.big span{display:block}#announcement.normal{color:#000;font-weight:normal;height:2.5em;margin:0 -5em -4.75em;position:static;width:27.5em}#apireturn textarea{font-size:1.2em;height:50em;width:100%}#apitest input,#apitest label,#apitest select,#apitest textarea{float:left}#apitest input,#apitest select,#apitest textarea{width:30em}#apitest label{width:20em}#apitest p{clear:both;padding-top:0.75em}#beau-other-span,#diff-other-span{left:-20em;position:absolute;width:0}#beauops p strong,#options p strong,#diffops p strong,#miniops p strong,#options .label,#diffops .label,#miniops .label,#beauops .label{display:block;float:left;font-size:1.2em;font-weight:bold;margin-bottom:1em;width:17.5em}#beauops span strong,#miniops span strong,#diffops span strong{display:inline;float:none;font-size:1em;width:auto}#feedreport{right:38.8em}#beautyinput,#minifyinput,#baseText,#newText,#beautyoutput,#minifyoutput{font-size:1em}#Beautify,#Minify,#diffBase,#diffNew{border-radius:0.4em;padding:1em 1.25em 0}#Beautify .input,#Minify .input,#Beautify .output,#Minify .output{width:49%}#Beautify .input label,#Beautify .output label,#Minify .input label,#Minify .output label{display:block;font-size:1.05em;font-weight:bold}#Beautify p.file,#Minify p.file{clear:none;float:none}#Beautify textarea,#Minify textarea{margin-bottom:0.75em}#checklist_option li{font-weight:bold}#checklist_option li li{font-weight:normal}#codeInput{margin-bottom:1em;margin-top:-3.5em}#codeInput #diffBase p,#codeInput #diffNew p{clear:both;float:none}#codeInput .input{clear:none;float:left}#codeInput .output{clear:none;float:right;margin-top:-2.4em}#cssreport.doc table{position:absolute}#css-size{left:24em}#css-uri{left:40em}#css-uri td{text-align:left}#csvchar{width:11.8em}#dcolorScheme{float:right;margin:-2em 0 0}#dcolorScheme label{display:inline-block;font-size:1em}#diff .addsource{cursor:pointer;margin-bottom:1em;padding:0}#diff .addsource input{display:block;float:left;margin:0.5em 0.5em -1.5em}#diff .addsource label{cursor:pointer;display:inline-block;font-size:1.2em;padding:0.5em 0.5em 0.5em 2em}#diffBase,#diffNew,#Beautify,#Minify,#doc div,#doc div div,#doc ol,#option_comment,#update,#thirdparties img,#diffoutput #thirdparties,.box h3.heading,.box .body,.options,.diff .replace em,.diff .delete em,.diff .insert em,button,fieldset{border-style:solid;border-width:0.1em}#diffBase,#diffNew{padding:1.25em 1%;width:47%}#diffBase textarea,#diffNew textarea{width:99.5%}#diffBase{float:left;margin-right:1%}#diffNew{float:right}#diffoutput{width:100%}#diffoutput #thirdparties li{display:inline-block;list-style-type:none}#diffoutput li em,#diffoutput p em,.analysis .bad,.analysis .good{font-weight:bold}#diffoutput ul{font-size:1.2em;margin-top:1em}#diffoutput ul li{display:list-item;list-style-type:disc}#displayOps{float:right;font-size:1.5em;font-weight:bold;margin:0 1em 0 0;position:relative;width:22.5em;z-index:10}#displayOps #displayOps-hide{clear:both;float:none;position:absolute;top:-20em}#displayOps.default{position:static}#displayOps.maximized{margin-bottom:-2em;position:relative}#displayOps a{border-style:solid;border-width:0.1em;height:1.2em;line-height:1.4;margin:0.1em 0 0 5em;padding:0.05em 0 0.3em;text-align:center;text-decoration:none}#displayOps button,#displayOps a{font-size:1em}#displayOps li{clear:none;display:block;float:left;list-style:none;margin:0;text-align:right;width:9em}#doc_contents a{text-decoration:none}#doc_contents ol{padding-bottom:1em}#doc_contents ol ol li{font-size:0.75em;list-style:lower-alpha;margin:0.5em 0 1em 3em}#doc #doc_contents ol ol{background-color:inherit;border-style:none;margin:0.25em 0.3em 0 0;padding-bottom:0}#doc div.beautify{border-style:none}#doc #execution h3{background:transparent;border-style:none;font-size:1em;font-weight:bold}#doc code,.doc code{display:block;font-family:'Courier New',Courier,'Lucida Console',monospace;font-size:1.1em}#doc div,.doc div{margin-bottom:2em;padding:0 0.5em 0.5em}#doc div div,.doc div div{clear:both;margin-bottom:1em}#doc em,.doc em,.box .body em{font-style:normal;font-weight:bold}#doc h2,.doc h2{font-size:1.6em;margin:0.5em 0.5em 0.5em 0}#doc h3,.doc h3{margin-top:0.5em}#doc ol,.doc ol{clear:both;padding:0}#doc ol li span,.doc ol li span{display:block;margin-left:2em}#doc ol ol,#doc ul ol,.doc ol ol,.doc ul ol{margin-right:0.5em}#doc td span,.doc td span{display:block}#doc table,.doc table,.box .body table{border-collapse:collapse;border-style:solid;border-width:0.2em;clear:both}#doc table,.doc table{font-size:1.2em}#doc td,#doc th,.doc td,.doc th{border-left-style:solid;border-left-width:0.1em;border-top-style:solid;border-top-width:0.1em;padding:0.5em}#doc th,.doc th{font-weight:bold}#doc ul,.doc ul{margin-top:1em}#doc ul li,.doc ul li{font-size:1.2em}#feedemail{display:block;width:100%}#feedreportbody{text-align:center}#feedreportbody .radiogroup .feedlabel{display:block;margin:0 0 1em;width:auto;font-size:1.4em}#feedreportbody .radiogroup span{margin:0 0 2em;display:inline-block;width:5em}#feedreportbody .radiogroup input{position:absolute;top:-2000em}#feedreportbody .radiogroup label{display:inline-block;border-style:solid;border-width:0.1em;line-height:1.5;text-align:center;height:1.5em;width:1.5em;border-radius:50%;cursor:pointer}#feedreportbody .radiogroup span span{font-size:0.8em;display:block;margin:0;width:auto}#feedsubmit{position:static;width:50%;float:none;text-shadow:none;height:3em;margin:2.5em auto 0;font-family:inherit}#function_properties h4{font-size:1.2em;float:none}#function_properties h4 strong{color:#c00}#function_properties h5{margin:0 0 0 -2.5em;font-size:1em}#function_properties ol{padding-right:1em}#functionGroup.append{border-radius:0.2em;border-style:solid;border-width:0.1em;padding:0.7em 1.2em;position:relative;top:-2.625em}#functionGroup.append input{cursor:pointer}#functionGroup.append label{cursor:pointer;font-size:1em}#functionGroup.append span{display:inline-block;margin-left:2em}#hideOptions{margin-left:5em}#introduction{clear:both;margin:0 0 0 5.6em;position:relative;top:-2.75em}#introduction .information,#webtool #introduction h2{left:-90em;position:absolute;top:0;width:10em}#introduction h2{float:none}#introduction li{clear:none;display:block;float:left;font-size:1.4em;margin:0 4.95em -1em 0}#introduction li li{font-size:1em;margin-left:2em}#introduction ul{clear:both;height:3em;margin:0 0 0 -5.5em;overflow:hidden;width:100em}#modalSave p{background:#eee;color:#333;font-size:3em;padding:1em;position:absolute;text-align:center;top:10em;width:25em;z-index:9001}#modalSave p em{display:block;font-size:0.75em;margin-top:1em}#modalSave p strong{color:#c00;font-weight:bold}#modalSave span{background:#000;display:block;left:0;opacity:0.5;position:absolute;top:0;z-index:9000}#codereport{right:19.8em}#option_comment{font-size:1.2em;height:2.5em;margin-bottom:-1.5em;width:100%}#option_commentClear{float:right;height:2em;margin:-0.5em -0.25em 0 0;padding:0;width:15em}#options{margin:0 0 1em}#options label{width:auto}#options p,#addOptions p{clear:both;font-size:1em;margin:0;padding:1em 0 0}#options p span{height:2em;margin:0 0 0 1em}#pdsamples{list-style-position:inside;margin:0;padding:0;position:relative;z-index:10}#pdsamples li{border-radius:1em;border-style:solid;border-width:0.1em;margin:0 0 3em;padding:1em}#pdsamples li div{border-radius:1em;border-style:solid;border-width:0.1em;margin:0;padding:1em}#pdsamples li p{display:inline-block;font-size:1em;margin:0}#pdsamples li p a{display:block;margin:0 0 1em 2em}#pdsamples li ul{margin:0 0 0 2em}#reports{height:4em}#reports h2{display:none}#samples #dcolorScheme{position:relative;z-index:1000}#samples #pdsamples li li{background:none transparent;border-style:none;display:list-item;list-style:disc outside;margin:0;padding:0.5em}#samples h1{float:none}#samples h2{float:none;font-size:1.5em;border-style:none;margin:1em 0}#showOptionsCallOut{background:#fff;border:0.1em solid #000;box-shadow:0.2em 0.2em 0.4em rgba(0,0,0,.15);left:28.6%;padding:0.5em;position:absolute;top:4.6em;width:20%;z-index:1000}#showOptionsCallOut a{color:#66f;font-weight:bold}#showOptionsCallOut em{color:#c00}#showOptionsCallOut strong{color:#090}#statreport{right:0.8em}#statreport .body p,#statreport .body li,#statreport .body h3{font-size:1.2em}#statreport .body h3{margin-top:0}#statreport .body ul{margin-top:1em}#textareaTabKey{position:absolute;border-width:0.1em;border-style:solid;padding:0.5em;width:24em;right:51%}#textareaTabKey strong{text-decoration:underline}#textreport{width:100%}#thirdparties a{border-style:none;display:block;height:4em;text-decoration:none}#title_text{border-style:solid;border-width:0.05em;display:block;float:left;font-size:1em;margin-left:0.55em;padding:0.1em}#top{left:0;overflow:scroll;position:absolute;top:-200em;width:1em}#top em{font-weight:bold}#update{clear:left;float:right;font-weight:bold;padding:0.5em;position:absolute;right:1.25em;top:4.75em}#webtool .diff h3{border-style:none solid solid;border-width:0 0.1em 0.2em;box-shadow:none;display:block;font-family:Verdana;margin:0 0 0 -.1em;padding:0.2em 2em;text-align:left}#webtool .options input[type=text]{margin-right:1em;width:11.6em}#webtool .options input[type=text],div input,textarea{border-style:inset;border-width:0.1em}.analysis th{text-align:left}.analysis td{text-align:right}.beautify,.diff{border-style:solid;border-width:0.2em;display:inline-block;font-family:'Courier New',Courier,'Lucida Console',monospace;margin:0 1em 1em 0;position:relative}.beautify .count,.diff .count{border-style:solid;border-width:0 0.1em 0 0;font-weight:normal;padding:0;text-align:right}.beautify .count li,.diff .count li{padding-left:2em}.beautify .count li{padding-top:0.5em}.beautify .count li.fold,.diff .count li.fold{color:#900;cursor:pointer;font-weight:bold;padding-left:0.5em}.beautify .data,.diff .data{text-align:left;white-space:pre}.beautify .data em{display:inline-block;font-style:normal;font-weight:bold;padding-top:0.5em}.beautify .data li,.diff .data li{padding-left:0.5em;white-space:pre}.beautify li,.diff li{border-style:none none solid;border-width:0 0 0.1em;display:block;line-height:1.2;list-style-type:none;margin:0;padding-bottom:0;padding-right:0.5em}.beautify ol,.diff ol{display:table-cell;margin:0;padding:0}.box{border-style:solid;border-width:0;left:auto;margin:0;padding:0;position:absolute;z-index:10}.box button{border-radius:0;border-style:solid;border-width:0.1em;display:block;float:right;font-family:'Lucida Console','Trebuchet MS','Arial';height:1.75em;padding:0;position:absolute;right:0;text-align:center;top:0;width:1.75em;z-index:7}.box button.resize{border-width:0.05em;cursor:se-resize;font-size:1.667em;font-weight:normal;height:0.8em;line-height:0.5em;margin:-.85em 0 0;position:absolute;right:0.05em;top:100%;width:0.85em}.box button.minimize{margin:0.35em 4em 0 0}.box button.maximize{margin:0.35em 1.75em 0 0}.box button.save{margin:0.35em 6.25em 0 0}.box .buttons{float:right;margin:0}.box h3.heading{cursor:pointer;float:left;font-size:1em;height:3em;margin:0 0 -3.2em;position:relative;width:17em;z-index:6}.box h3.heading span{display:block;font-size:1.8em;padding:0.25em 0 0 0.5em}.box .body{clear:both;height:20em;margin-top:-.1em;overflow:scroll;padding:4.25em 1em 1em;position:relative;right:0;top:0;width:75em;z-index:5}.button{margin:1em 0;text-align:center}.button button{display:block;font-size:2em;height:1.5em;margin:0 auto;padding:0;width:50%}.clear{clear:both;display:block}.diff .skip{border-style:none none solid;border-width:0 0 0.1em}.diff .diff-left,.diff .diff-right{display:table-cell}.diff .diff-left{border-style:none none none solid;border-width:0 0 0 0.1em}.diff .diff-right{border-style:none none none solid;border-width:0 0 0 0.1em;margin-left:-.1em;min-width:16.5em;right:0;top:0}.diff-right .data ol{min-width:16.5em}.diff-right .data{border-style:none solid none none;border-width:0 0.1em 0 0;width:100%}.diff-right .data li{min-width:16.5em}.diff li,.diff p,.diff h3,.beautify li{font-size:1.1em}.diff li{padding-top:0.5em}.diff li em{font-style:normal;margin:0 -.09em;padding:0.05em 0}.diff p.author{border-style:solid;border-width:0.2em 0.1em 0.1em;margin:0;overflow:hidden;padding:0.4em;text-align:right}.difflabel{display:block;height:0}.file,.labeltext{font-size:0.9em;font-weight:bold;margin-bottom:1em}.file input,.labeltext input{display:inline-block;margin:0 0.7em 0 0;width:16em}.input,.output{margin:0}.options{border-radius:0.4em;clear:both;margin-bottom:1em;padding:1em 1em 3.5em;width:auto}.options input,.options label{border-style:none;display:block;float:left}.output label{text-align:right}.options p span label{font-size:1em}.options p span{display:block;float:left;font-size:1.2em;min-width:14em;padding-bottom:0.5em}.options select,#csvchar{margin:0 0 0 1em}.options span label{margin-left:0.4em}body#doc{font-size:0.8em;margin:0 auto;max-width:80em}body#doc #function_properties ul{margin:0}body#doc #function_properties ul li{font-size:0.9em;margin:0.5em 0 0 4em}body#doc ul li,body#doc ol li{font-size:1.1em}body#doc table{font-size:1em}button,a.button{border-radius:0.15em;display:block;font-weight:bold;padding:0.2em 0;width:100%}div .button{text-align:center}div button,div a.button{display:inline-block;font-weight:bold;margin:1em 0;padding:1em 2em}button:hover,a.button:hover{cursor:pointer}fieldset{border-radius:0.9em;clear:both;margin:3.5em 0 -2em;padding:0 0 0 1em}h1{float:left;font-size:2em;margin:0 0.5em 0.5em 0}h1 svg,h1 img{border-style:solid;border-width:0.05em;float:left;height:1.5em;margin-right:0.5em;width:1.5em}h1 span{font-size:0.5em}h2,h3{background:#fff;border-style:solid;border-width:0.075em;display:inline-block;font-size:1.8em;font-weight:bold;margin:0 0.5em 0.5em 0;padding:0 0.2em}h3{font-size:1.6em}h4{font-size:1.4em}input[type='radio']{margin:0 0.25em}input[type='file']{box-shadow:none}label{display:inline;font-size:1.4em}legend{border-style:solid;border-width:0.1em;font-size:1.2em;font-weight:bold;margin-left:-.25em}li{clear:both;margin:1em 0 1em 3em}li h4{display:inline;float:left;margin:0.4em 0;text-align:left;width:14em}ol li{font-size:1.4em;list-style-type:decimal}ol li li{font-size:1em}p{clear:both;font-size:1.2em;margin:0 0 1em}select{border-style:inset;border-width:0.1em;width:11.85em}strong.new{background:#ff6;font-style:italic}strong label{font-size:1em;width:inherit}textarea{display:inline-block;font-family:'Courier New',Courier,'Lucida Console',monospace;height:10em;margin:0 0 -.1em;width:100%}ul{margin:-1.4em 0 2em;padding:0}ul li{list-style-type:none}@media print{div{width:100%}html td{font-size:0.8em;white-space:normal}p,.options,#Beautify,#Minify,#diff,ul{display:none}}@media screen and (-webkit-min-device-pixel-ratio:0){.beautify .count li{padding-top:0.546em}.beautify .data li{line-height:1.3}}@media (max-width: 640px){#functionGroup{height:4em}#functionGroup.append span{margin-left:0.5em;position:relative;z-index:10}#displayOps{margin-bottom:-2em;padding-right:0.75em;width:auto}#displayOps li{padding-top:2em}#displayOps a{margin-left:1em}#diffBase,#diffNew{width:46%}#reports{display:none}.labeltext input,.file input{width:12em}#update{margin-top:2.75em}#codeInput label{display:none}#doc #dcolorScheme{margin:0 0 1em}}",
        scanvas: "#doc.canvas{color:#444}#webtool.canvas input.unchecked{background:#ccc;color:#333}.canvas *:focus,.canvas .filefocus,.canvas #feedreportbody .focus,.canvas #feedreportbody .active-focus{outline:0.1em dashed #00f}.canvas #Beautify,.canvas #Minify,.canvas #diffBase,.canvas #diffNew{background:#d8d8cf;border-color:#664;box-shadow:0 0.2em 0.4em rgba(128,128,92,0.5);color:#444}.canvas #beautyoutput,.canvas #minifyoutput{background:#ccc}.canvas #diffoutput #thirdparties{background:#c8c8bf;border-color:#664}.canvas #diffoutput #thirdparties a{color:#664}.canvas #diffoutput p em,.canvas #diffoutput li em{color:#050}.canvas #feedreportbody .radiogroup label{background:#f8f8f8}.canvas #feedreportbody .feedradio1:hover,.canvas #feedreportbody .active .feedradio1{background:#f66}.canvas #feedreportbody .feedradio2:hover,.canvas #feedreportbody .active .feedradio2{background:#f96}.canvas #feedreportbody .feedradio3:hover,.canvas #feedreportbody .active .feedradio3{background:#fc9}.canvas #feedreportbody .feedradio4:hover,.canvas #feedreportbody .active .feedradio4{background:#ff9}.canvas #feedreportbody .feedradio5:hover,.canvas #feedreportbody .active .feedradio5{background:#eea}.canvas #feedreportbody .feedradio6:hover,.canvas #feedreportbody .active .feedradio6{background:#cd9}.canvas #feedreportbody .feedradio7:hover,.canvas #feedreportbody .active .feedradio7{background:#8d8}.canvas #functionGroup.append{background:#d8d8cf;border-color:#664;box-shadow:0 0.2em 0.4em rgba(128,128,92,0.5)}.canvas #option_comment{background:#e8e8e8;border-color:#664;color:#444}.canvas #pdsamples li{background:#d8d8cf;border-color:#664}.canvas #pdsamples li div{background:#e8e8e8;border-color:#664}.canvas #pdsamples li div a{color:#664}.canvas #pdsamples li p a{color:#450}.canvas #textareaTabKey{background:#c8c8bf;border-color:#c33;color:#555}.canvas #top em{color:#fcc}.canvas #update,.canvas #title_text{background:#f8f8ee;box-shadow:0 0.1em 0.2em rgba(128,128,92,0.75);color:#464}.canvas .beautify .data em.s0,#doc.canvas .beautify .data em.s0{color:#000}.canvas .beautify .data em.s1,#doc.canvas .beautify .data em.s1{color:#f66}.canvas .beautify .data em.s2,#doc.canvas .beautify .data em.s2{color:#12f}.canvas .beautify .data em.s3,#doc.canvas .beautify .data em.s3{color:#090}.canvas .beautify .data em.s4,#doc.canvas .beautify .data em.s4{color:#d6d}.canvas .beautify .data em.s5,#doc.canvas .beautify .data em.s5{color:#7cc}.canvas .beautify .data em.s6,#doc.canvas .beautify .data em.s6{color:#c85}.canvas .beautify .data em.s7,#doc.canvas .beautify .data em.s7{color:#737}.canvas .beautify .data em.s8,#doc.canvas .beautify .data em.s8{color:#6d0}.canvas .beautify .data em.s9,#doc.canvas .beautify .data em.s9{color:#dd0s}.canvas .beautify .data em.s10,#doc.canvas .beautify .data em.s10{color:#893}.canvas .beautify .data em.s11,#doc.canvas .beautify .data em.s11{color:#b97}.canvas .beautify .data em.s12,#doc.canvas .beautify .data em.s12{color:#bbb}.canvas .beautify .data em.s13,#doc.canvas .beautify .data em.s13{color:#cc3}.canvas .beautify .data em.s14,#doc.canvas .beautify .data em.s14{color:#333}.canvas .beautify .data em.s15,#doc.canvas .beautify .data em.s15{color:#9d9}.canvas .beautify .data em.s16,#doc.canvas .beautify .data em.s16{color:#880}.canvas .beautify .data .l0{background:#f8f8ef}.canvas .beautify .data .l1{background:#fed}.canvas .beautify .data .l2{background:#def}.canvas .beautify .data .l3{background:#efe}.canvas .beautify .data .l4{background:#fef}.canvas .beautify .data .l5{background:#eef}.canvas .beautify .data .l6{background:#fff8cc}.canvas .beautify .data .l7{background:#ede}.canvas .beautify .data .l8{background:#efc}.canvas .beautify .data .l9{background:#ffd}.canvas .beautify .data .l10{background:#edc}.canvas .beautify .data .l11{background:#fdb}.canvas .beautify .data .l12{background:#f8f8f8}.canvas .beautify .data .l13{background:#ffb}.canvas .beautify .data .l14{background:#eec}.canvas .beautify .data .l15{background:#cfc}.canvas .beautify .data .l16{background:#eea}.canvas .beautify .data .c0{background:#ddd}.canvas .beautify .data li{color:#777}.canvas .analysis .bad{background-color:#ecb;color:#744}.canvas .analysis .good{background-color:#cdb;color:#474}.canvas .box{background:#ccc;border-color:#664}.canvas .box .body{background:#e8e8e8;border-color:#664;box-shadow:0 0.2em 0.4em rgba(128,128,92,0.75);color:#666}.canvas .box button{box-shadow:0 0.1em 0.2em rgba(128,128,92,0.75)}.canvas .box button.maximize{background:#cfd8cf;border-color:#464;color:#464}.canvas .box button.maximize:hover{background:#cfc;border-color:#282;color:#282}.canvas .box button.minimize{background:#cfcfd8;border-color:#446;color:#446}.canvas .box button.minimize:hover{background:#bbf;border-color:#228;color:#228}.canvas .box button.resize{background:#cfcfd8;border-color:#446;color:#446}.canvas .box button.resize:hover{background:#bbf;border-color:#228;color:#228}.canvas .box button.save{background:#d8cfcf;border-color:#644;color:#644}.canvas .box button.save:hover{background:#fcc;border-color:#822;color:#822}.canvas .box h3.heading:hover{background:#d8d8cf}.canvas .diff,.canvas .beautify,.canvas ol,.canvas .diff p.author,.canvas .diff h3,.canvas .diff-right,.canvas .diff-left{border-color:#664}.canvas .diff .count,.canvas .beautify .count{background:#c8c8bf}.canvas .diff .count .empty{background:#c8c8bf;border-color:#664;color:#c8c8bf}.canvas .diff .data,.canvas .beautify .data{background:#f8f8ef}.canvas .diff .data .delete em{background-color:#fdc;border-color:#600;color:#933}.canvas .diff .data .insert em{background-color:#efc;border-color:#060;color:#464}.canvas .diff .data .replace em{background-color:#ffd;border-color:#664;color:#880}.canvas .diff .delete{background-color:#da9;border-color:#c87;color:#600}.canvas .diff .equal,.canvas .beautify .data li{background-color:#f8f8ef;border-color:#ddd;color:#666}.canvas .diff .insert{background-color:#bd9;border-color:#9c7;color:#040}.canvas .diff .replace{background-color:#dda;border-color:#cc8;color:#660}.canvas .diff .skip{background-color:#eee;border-color:#ccc}.canvas .diff h3{background:#c8c8bf;color:#664}.canvas .diff p.author{background:#ddc;color:#666}.canvas #doc .analysis thead th,.canvas #doc .analysis th[colspan],.canvas .doc .analysis thead th,.canvas .doc .analysis th[colspan]{background:#c8c8bf}.canvas #doc div,.canvas .doc div,#doc.canvas div{background:#c8c8bf;border-color:#664}.canvas #doc div:hover,.canvas .doc div:hover,#doc.canvas div:hover{background:#d8d8cf}.canvas #doc div div,.canvas .doc div div,#doc.canvas div div{background:#e8e8e8;border-color:#664}.canvas #doc div div:hover,.canvas .doc div div:hover,#doc.canvas div div:hover,#doc.canvas div ol:hover{background:#f8f8ef}.canvas #doc em,.canvas .doc em,.canvas .box .body em,.canvas .box .body .doc em{color:#472}.canvas #doc ol,.canvas .doc ol,#doc.canvas ol{background:#e8e8e8;border-color:#664}.canvas #doc strong,.canvas .doc strong,.canvas .box .body strong{color:#933}.canvas #doc table,.canvas .doc table,#doc.canvas table,.canvas .box .body table{background:#f8f8ef;border-color:#664;color:#666}.canvas #doc td,.canvas .doc td,#doc.canvas td{border-color:#664}.canvas #doc th,.canvas .doc th,#doc.canvas th{background:#c8c8bf;border-left-color:#664;border-top-color:#664}.canvas #doc tr:hover,.canvas .doc tr:hover,#doc.canvas tr:hover{background:#c8c8bf}.canvas .file input,.canvas .labeltext input,.canvas .options input[type=text],.canvas .options select{background:#f8f8f8;border-color:#664}.canvas .options{background:#d8d8cf;border-color:#664;box-shadow:0 0.2em 0.4em rgba(128,128,92,0.5);color:#444}.canvas a{color:#450}.canvas a.button,.canvas button{background:#d8d8cf;border-color:#664;box-shadow:0 0.1em 0.2em rgba(128,128,92,0.75);color:#664}.canvas a.button:hover,.canvas a.button:active,.canvas button:hover,.canvas button:active{background:#ffe}.canvas fieldset{background:#e8e8e8;border-color:#664}.canvas h1 svg{border-color:#664;box-shadow:0 0.1em 0.2em rgba(128,128,92,0.75)}.canvas h2,.canvas h3{background:#f8f8ef;border-color:#664;box-shadow:0 0.1em 0.2em rgba(128,128,92,0.75);text-shadow:none}.canvas input,.canvas select{box-shadow:0.1em 0.1em 0.2em #999}.canvas legend{background:#f8f8ef;border-color:#664}.canvas textarea{background:#f8f8ef;border-color:#664}.canvas textarea:hover{background:#e8e8e8}html .canvas,body.canvas{background:#e8e8e8;color:#666}",
        sshadow: "#doc.shadow{color:#ddd}#doc.shadow h3 a{color:#f90}#webtool.shadow input.unchecked{background:#666;color:#ddd}.shadow *:focus,.shadow .filefocus,.shadow #feedreportbody .focus,.shadow #feedreportbody .active-focus{outline:0.1em dashed #00f}.shadow #beautyoutput,.shadow #minifyoutput{background:#555;color:#eee}.shadow #Beautify,.shadow #Minify,.shadow #diffBase,.shadow #diffNew{background:#666;border-color:#999;color:#ddd}.shadow #Beautify label,.shadow #Minify label,.shadow #diffBase label,.shadow #diffNew label{text-shadow:0.1em 0.1em 0.1em #333}.shadow #diffoutput #thirdparties{background:#666;border-color:#999}.shadow #diffoutput #thirdparties a{box-shadow:0 0.2em 0.4em rgba(0,0,0,1);color:#000}.shadow #doc div,.shadow .doc div,#doc.shadow div{background:#666;border-color:#999}.shadow #doc div:hover,.shadow .doc div:hover,#doc.shadow div:hover{background:#777}.shadow #doc div div,.shadow .doc div div,#doc.shadow div div{background:#333;border-color:#999}.shadow #doc div div:hover,.shadow .doc div div:hover,#doc.shadow div div:hover,#doc.shadow div ol:hover{background:#444}.shadow #doc em,.shadow .doc em,.shadow .box .body em,.shadow .box .body .doc em,.shadow #diffoutput p em,.shadow #diffoutput li em{color:#684}.shadow #doc ol,.shadow .doc ol,#doc.shadow ol{background:#333;border-color:#999}.shadow #doc strong,.shadow .doc strong,.shadow .box .body strong{color:#b33}.shadow #doc table,.shadow .doc table,#doc.shadow table,.shadow .diff,.shadow .beautify,.shadow .box .body table{background:#333;border-color:#999;color:#ddd}.shadow #doc th,.shadow .doc th,#doc.shadow th{background:#bbb;border-left-color:#999;border-top-color:#999;color:#333}.shadow #doc tr:hover,.shadow .doc tr:hover,#doc.shadow tr:hover{background:#555}.shadow #feedreportbody .radiogroup label{background:#000}.shadow #feedreportbody .feedradio1:hover,.shadow #feedreportbody .active .feedradio1{background:#700}.shadow #feedreportbody .feedradio2:hover,.shadow #feedreportbody .active .feedradio2{background:#742}.shadow #feedreportbody .feedradio3:hover,.shadow #feedreportbody .active .feedradio3{background:#763}.shadow #feedreportbody .feedradio4:hover,.shadow #feedreportbody .active .feedradio4{background:#880}.shadow #feedreportbody .feedradio5:hover,.shadow #feedreportbody .active .feedradio5{background:#675}.shadow #feedreportbody .feedradio6:hover,.shadow #feedreportbody .active .feedradio6{background:#452}.shadow #feedreportbody .feedradio7:hover,.shadow #feedreportbody .active .feedradio7{background:#362}.shadow #functionGroup.append{background:#eee;border-color:#ccc;box-shadow:0 0.1em 0.2em rgba(64,64,64,0.15)}.shadow #functionGroup.append{background:#666;border-color:#999}.shadow #option_comment{background:#333;border-color:#999;color:#ddd}.shadow #option_comment,.shadow input,.shadow select{box-shadow:0.1em 0.1em 0.2em #000}.shadow #pdsamples li{background:#666;border-color:#999}.shadow #pdsamples li div{background:#333;border-color:#999}.shadow #pdsamples li p a{color:#f90}.shadow #pdsamples li p a:hover{color:#fc0}.shadow #textreport{background:#222}.shadow #title_text{border-color:#222;color:#eee}.shadow #top em{color:#9c6}.shadow #update{background:#ddd;border-color:#000;color:#222}.shadow .analysis .bad{background-color:#400;color:#c66}.shadow .analysis .good{background-color:#040;color:#6a6}.shadow .beautify .data em.s0,#doc.shadow .beautify .data em.s0{color:#fff}.shadow .beautify .data em.s1,#doc.shadow .beautify .data em.s1{color:#c44}.shadow .beautify .data em.s2,#doc.shadow .beautify .data em.s2{color:#69c}.shadow .beautify .data em.s3,#doc.shadow .beautify .data em.s3{color:#0c0}.shadow .beautify .data em.s4,#doc.shadow .beautify .data em.s4{color:#c0c}.shadow .beautify .data em.s5,#doc.shadow .beautify .data em.s5{color:#0cc}.shadow .beautify .data em.s6,#doc.shadow .beautify .data em.s6{color:#981}.shadow .beautify .data em.s7,#doc.shadow .beautify .data em.s7{color:#a7a}.shadow .beautify .data em.s8,#doc.shadow .beautify .data em.s8{color:#7a7}.shadow .beautify .data em.s9,#doc.shadow .beautify .data em.s9{color:#ff6}.shadow .beautify .data em.s10,#doc.shadow .beautify .data em.s10{color:#33f}.shadow .beautify .data em.s11,#doc.shadow .beautify .data em.s11{color:#933}.shadow .beautify .data em.s12,#doc.shadow .beautify .data em.s12{color:#990}.shadow .beautify .data em.s13,#doc.shadow .beautify .data em.s13{color:#987}.shadow .beautify .data em.s14,#doc.shadow .beautify .data em.s14{color:#fc3}.shadow .beautify .data em.s15,#doc.shadow .beautify .data em.s15{color:#897}.shadow .beautify .data em.s16,#doc.shadow .beautify .data em.s16{color:#f30}.shadow .beautify .data .l0{background:#333}.shadow .beautify .data .l1{background:#633}.shadow .beautify .data .l2{background:#335}.shadow .beautify .data .l3{background:#353}.shadow .beautify .data .l4{background:#636}.shadow .beautify .data .l5{background:#366}.shadow .beautify .data .l6{background:#640}.shadow .beautify .data .l7{background:#303}.shadow .beautify .data .l8{background:#030}.shadow .beautify .data .l9{background:#660}.shadow .beautify .data .l10{background:#003}.shadow .beautify .data .l11{background:#300}.shadow .beautify .data .l12{background:#553}.shadow .beautify .data .l13{background:#432}.shadow .beautify .data .l14{background:#640}.shadow .beautify .data .l15{background:#562}.shadow .beautify .data .l16{background:#600}.shadow .beautify .data .c0{background:#666}.shadow .box{background:#000;border-color:#999;box-shadow:0.6em 0.6em 0.8em rgba(0,0,0,.75)}.shadow .box .body{background:#333;border-color:#999;color:#ddd}.shadow .box button{box-shadow:0 0.1em 0.2em rgba(0,0,0,0.75);text-shadow:0.1em 0.1em 0.1em rgba(0,0,0,.5)}.shadow .box button.maximize{background:#9c9;border-color:#030;color:#030}.shadow .box button.maximize:hover{background:#cfc;border-color:#060;color:#060}.shadow .box button.minimize{background:#bbf;border-color:#006;color:#006}.shadow .box button.minimize:hover{background:#eef;border-color:#228;color:#228}.shadow .box button.resize{background:#bbf;border-color:#446;color:#446}.shadow .box button.resize:hover{background:#ddf;border-color:#228;color:#228}.shadow .box button.save{background:#d99;border-color:#300;color:#300}.shadow .box button.save:hover{background:#fcc;border-color:#822;color:#822}.shadow .box h3{background:#ccc;border-color:#333;box-shadow:0.2em 0.2em 0.8em #000;color:#222}.shadow .box h3.heading:hover{background:#222;border-color:#ddd;color:#ddd}.shadow .diff,.shadow .beautify,.shadow .diff div,.shadow .diff p,.ahadow .diff ol,.shadow .beautify ol,.shadow .diff li,.ahadow .beautify li,.shadow .diff .count li,.shadow .beautify .count li,.shadow .diff-right .data{border-color:#999}.shadow .diff .count,.shadow .beautify .count,#doc.shadow .diff .count,#doc.shadow .beautify .count{background:#bbb;color:#333}.shadow .diff .count .empty{background:#bbb;color:#bbb}.shadow .diff .data,.shadow .beautify .data{background:#333;color:#ddd}.shadow .diff .data .delete em{background-color:#700;border-color:#c66;color:#f99}.shadow .diff .data .insert em{background-color:#363;border-color:#6c0;color:#cfc}.shadow .diff .data .replace em{background-color:#440;border-color:#220;color:#cc9}.shadow .diff .delete{background-color:#300;border-color:#400;color:#c66}.shadow .diff .diff-right{border-color:#999 #999 #999 #333}.shadow .diff .empty{background-color:#999;border-color:#888}.shadow .diff .equal,.shadow .beautify .data li{background-color:#333;border-color:#404040;color:#ddd}.shadow .diff .insert{background-color:#040;border-color:#005000;color:#6c6}.shadow .diff .replace{background-color:#664;border-color:#707050;color:#bb8}.shadow .diff .skip{background-color:#000;border-color:#555}.shadow .diff h3,.shadow #doc .analysis th[colspan],.shadow #doc .analysis thead th,.shadow .doc .analysis th[colspan],.shadow .doc .analysis thead th{background:#555;border-color:#999;color:#ddd}.shadow .diff p.author{background:#555;border-color:#999;color:#ddd}.shadow .file input,.shadow .labeltext input,.shadow .options input[type=text],.shadow .options select{background:#333;border-color:#999;color:#ddd}.shadow .options{background:#666;border-color:#999;color:#ddd;text-shadow:0.1em 0.1em 0.2em #333}.shadow .options fieldset span input[type=text]{background:#222;border-color:#333}.shadow a{color:#f90}.shadow a:hover{color:#c30}.shadow a.button,.shadow button{background:#630;border-color:#600;box-shadow:0 0.2em 0.4em rgba(0,0,0,1);color:#f90;text-shadow:0.1em 0.1em 0.1em #000}.shadow a.button:hover,.shadow a.button:active,.shadow button:hover,.shadow button:active{background:#300;border-color:#c00;color:#fc0;text-shadow:0.1em 0.1em 0.1em rgba(0,0,0,.5)}.shadow h1 svg{border-color:#222;box-shadow:0.2em 0.2em 0.4em #000}.shadow h2,.shadow h3{background-color:#666;border-color:#666;box-shadow:none;color:#ddd;padding-left:0;text-shadow:none}.shadow textarea{background:#333;border-color:#000;color:#ddd}.shadow textarea:hover{background:#000}.shadow fieldset{background:#333;border-color:#999}.shadow input[disabled]{box-shadow:none}.shadow legend{background:#eee;border-color:#333;box-shadow:0 0.1em 0.2em rgba(0,0,0,0.75);color:#222;text-shadow:none}.shadow table td{border-color:#999}html .shadow,body.shadow{background:#222;color:#eee}",
        swhite : "#webtool.white input.unchecked{background:#ccc;color:#666}.white *:focus,.white .filefocus,.white #feedreportbody .focus,.white #feedreportbody .active-focus{outline:0.1em dashed #00f}.white #beautyoutput,.white #minifyoutput{background:#ddd}.white #Beautify,.white #Minify,.white #diffBase,.white #diffNew{background:#eee;border-color:#ccc;box-shadow:0 0.2em 0.4em rgba(64,64,64,0.15)}.white #diffoutput #thirdparties{background:#eee}.white #diffoutput p em,.white #diffoutput li em{color:#c00}.white #doc .analysis thead th,.white #doc .analysis th[colspan],.white .doc .analysis thead th,.white .doc .analysis th[colspan]{background:#eef}.white #doc div,.white .doc div,#doc.white div{background:#ddd;border-color:#999}.white #doc div:hover,.white .doc div:hover,#doc.white div:hover{background:#ccc}.white #doc div div,.white .doc div div,#doc.white div div{background:#eee;border-color:#999}.white #doc div div:hover,.white .doc div div:hover,#doc.white div div:hover,#doc.white div ol:hover{background:#fff}.white #doc em,.white .doc em,#doc.white em{color:#060}.white #doc ol,.white .doc ol,#doc.white ol{background:#f8f8f8;border-color:#999}.white #doc strong,.white .doc strong,.white .box .body strong{color:#c00}#doc.white table,.white #doc table,.white .doc table,.white .box .body table{background:#fff;border-color:#999}.white #doc th,.white .doc th,#doc.white th{background:#ddd;border-left-color:#999;border-top-color:#999}.white #doc tr:hover,.white .doc tr:hover,#doc.white tr:hover{background:#ddd}.white #feedreportbody .radiogroup label{background:#f8f8f8}.white #feedreportbody .feedradio1:hover,.white #feedreportbody .active .feedradio1,.white #feedreportbody .active-focus .feedradio1{background:#f66}.white #feedreportbody .feedradio2:hover,.white #feedreportbody .active .feedradio2,.white #feedreportbody .active-focus .feedradio2{background:#f96}.white #feedreportbody .feedradio3:hover,.white #feedreportbody .active .feedradio3,.white #feedreportbody .active-focus .feedradio3{background:#fc9}.white #feedreportbody .feedradio4:hover,.white #feedreportbody .active .feedradio4,.white #feedreportbody .active-focus .feedradio4{background:#ff9}.white #feedreportbody .feedradio5:hover,.white #feedreportbody .active .feedradio5,.white #feedreportbody .active-focus .feedradio5{background:#eea}.white #feedreportbody .feedradio6:hover,.white #feedreportbody .active .feedradio6,.white #feedreportbody .active-focus .feedradio6{background:#cd9}.white #feedreportbody .feedradio7:hover,.white #feedreportbody .active .feedradio7,.white #feedreportbody .active-focus .feedradio7{background:#8d8}.white #functionGroup.append{background:#eee;border-color:#ccc;box-shadow:0 0.1em 0.2em rgba(64,64,64,0.15)}.white #introduction h2{border-color:#999;color:#333}.white #option_comment{background:#ddd;border-color:#999}.white #pdsamples li{background:#eee;border-color:#999}.white #pdsamples li div{background:#ddd;border-color:#999}.white #pdsamples li div a{color:#47a}.white #pdsamples li p a{color:#009}.white #thirdparties img,.white #diffoutput #thirdparties{border-color:#999}.white #textareaTabKey{background:#fff;border-color:#ccf}.white #thirdparties img{box-shadow:0.2em 0.2em 0.4em #999}.white #title_text{border-color:#fff;color:#333}.white #top em{color:#00f}.white #update{background:#ddd;border-color:#999;box-shadow:0 0.1em 0.2em rgba(64,64,64,0.15)}.white .analysis .bad{background-color:#ebb;color:#400}.white .analysis .good{background-color:#cec;color:#040}.white .beautify .data .l0{background:#fff}.white .beautify .data .l1{background:#fed}.white .beautify .data .l2{background:#def}.white .beautify .data .l3{background:#efe}.white .beautify .data .l4{background:#fef}.white .beautify .data .l5{background:#eef}.white .beautify .data .l6{background:#fff8cc}.white .beautify .data .l7{background:#ede}.white .beautify .data .l8{background:#efc}.white .beautify .data .l9{background:#ffd}.white .beautify .data .l10{background:#edc}.white .beautify .data .l11{background:#fdb}.white .beautify .data .l12{background:#f8f8f8}.white .beautify .data .l13{background:#ffb}.white .beautify .data .l14{background:#eec}.white .beautify .data .l15{background:#cfc}.white .beautify .data .l16{background:#eea}.white .beautify .data .c0{background:#ddd}.white .beautify .data em.s0,#doc.white .beautify .data em.s0{color:#000}.white .beautify .data em.s1,#doc.white .beautify .data em.s1{color:#f66}.white .beautify .data em.s2,#doc.white .beautify .data em.s2{color:#12f}.white .beautify .data em.s3,#doc.white .beautify .data em.s3{color:#090}.white .beautify .data em.s4,#doc.white .beautify .data em.s4{color:#d6d}.white .beautify .data em.s5,#doc.white .beautify .data em.s5{color:#7cc}.white .beautify .data em.s6,#doc.white .beautify .data em.s6{color:#c85}.white .beautify .data em.s7,#doc.white .beautify .data em.s7{color:#737}.white .beautify .data em.s8,#doc.white .beautify .data em.s8{color:#6d0}.white .beautify .data em.s9,#doc.white .beautify .data em.s9{color:#dd0}.white .beautify .data em.s10,#doc.white .beautify .data em.s10{color:#893}.white .beautify .data em.s11,#doc.white .beautify .data em.s11{color:#b97}.white .beautify .data em.s12,#doc.white .beautify .data em.s12{color:#bbb}.white .beautify .data em.s13,#doc.white .beautify .data em.s13{color:#cc3}.white .beautify .data em.s14,#doc.white .beautify .data em.s14{color:#333}.white .beautify .data em.s15,#doc.white .beautify .data em.s15{color:#9d9}.white .beautify .data em.s16,#doc.white .beautify .data em.s16{color:#880}.white .beautify .data li{color:#777}.white .box{background:#666;border-color:#999;box-shadow:0 0.4em 0.8em rgba(64,64,64,0.25)}.white .box .body{background:#eee;border-color:#888;box-shadow:0 0 0.4em rgba(64,64,64,0.75)}.white .box .body em,.white .box .body .doc em{color:#090}.white .box button{box-shadow:0 0.1em 0.2em rgba(0,0,0,0.25);text-shadow:0.1em 0.1em 0.1em rgba(0,0,0,.25)}.white .box button.maximize{background:#9c9;border-color:#030;color:#030}.white .box button.maximize:hover{background:#cfc;border-color:#060;color:#060}.white .box button.minimize{background:#bbf;border-color:#006;color:#006}.white .box button.minimize:hover{background:#eef;border-color:#228;color:#228}.white .box button.resize{background:#bbf;border-color:#446;color:#446}.white .box button.resize:hover{background:#ddf;border-color:#228;color:#228}.white .box button.save{background:#d99;border-color:#300;color:#300}.white .box button.save:hover{background:#fcc;border-color:#822;color:#822}.white .box h3.heading{background:#ddd;border-color:#888;box-shadow:0.2em 0.2em 0.4em #ccc}.white .box h3.heading:hover{background:#333;color:#eee}.white .diff,.white .beautify,.white .diff ol,.white .beautify ol,.white .diff .diff-left,.white .diff .diff-right,.white h3,.white p.author{border-color:#999}.white .diff .count li,.white .beautify .count li{background:#eed;border-color:#bbc;color:#886}.white .diff .data .delete em{background-color:#fdd;border-color:#700;color:#600}.white .diff .data .insert em{background-color:#efc;border-color:#070;color:#050}.white .diff .data .replace em{background-color:#ffd;border-color:#963;color:#630}.white .diff .delete{background-color:#fbb;border-color:#eaa}.white .diff .equal,.white .beautify .data li{background-color:#fff;border-color:#eee}.white .diff .empty{background-color:#ddd;border-color:#ccc}.white .diff .insert{background-color:#bfb;border-color:#aea}.white .diff .replace{background-color:#fea;border-color:#dd8}.white .diff .skip{background-color:#efefef;border-color:#ddd}.white .diff h3{background:#ddd;border-bottom-color:#bbc}.white .diff p.author{background:#efefef;border-top-color:#bbc}.white .file input,.white .labeltext input{border-color:#fff}.white .options{background:#eee;border-color:#ccc;box-shadow:0 0.2em 0.4em rgba(64,64,64,0.15);text-shadow:0.05em 0.05em 0.1em #ddd}.white .options input[type=text],.white .options select{border-color:#999}.white .options h2,.white #Beautify h2,.white #Minify h2,.white #diffBase h2,.white #diffNew h2{background:#eee;border-color:#eee;box-shadow:none;text-shadow:none}.white a{color:#009}.white a.button:hover,.white a.button:active,.white button:hover,.white button:active{background:#fee;border-color:#cbb;color:#966;text-shadow:0.05em 0.05em 0.1em #f8e8e8}.white fieldset{background:#ddd;border-color:#999}.white h1 svg{background:#eee;border-color:#999;box-shadow:0 0.1em 0.2em rgba(150,150,150,0.5)}.white h2,.white h3{background:#fefefe;border-color:#999;box-shadow:none;text-shadow:none}.white legend{background:#fff;border-color:#999;color:#333;text-shadow:none}.white div input{border-color:#999}.white textarea{border-color:#ccc;border-style:solid}.white textarea:hover{background:#eef8ff}body.white button,body.white a.button{background:#f8f8f8;border-color:#bbb;box-shadow:0 0.1em 0.2em rgba(64,64,64,0.15);color:#666;text-shadow:0.05em 0.05em 0.1em #e0e0e0}html .white,body.white{color:#333}#about_license a{display:block}"
    };

    if (pd.test.cm === true) {
        pd.cm          = {};
        pd.cm.diffBase = codeMirror(function (x) {
            var node = pd.$$("diffBase");
            if (pd.o.codeDiffBase === null) {
                if (node === null) {
                    pd.o.page.appendChild(x);
                } else {
                    node.appendChild(x);
                }
            } else {
                pd.o.codeDiffBase.parentNode.replaceChild(x, pd.o.codeDiffBase);
            }
            x.setAttribute("id", "baseText");
            pd.o.codeDiffBase = x;
        }, {
            foldGutter       : true,
            gutters          : [
                "CodeMirror-linenumbers", "CodeMirror-foldgutter"
            ],
            indentUnit       : 4,
            lineNumbers      : true,
            matchBrackets    : true,
            matchTags        : true,
            mode             : "javascript",
            showTrailingSpace: true,
            tabSize          : 4,
            theme            : "white"
        });
        pd.cm.diffNew  = codeMirror(function (x) {
            var node = pd.$$("diffNew");
            if (pd.o.codeDiffNew === null) {
                if (node === null) {
                    pd.o.page.appendChild(x);
                } else {
                    node.appendChild(x);
                }
            } else {
                pd.o.codeDiffNew.parentNode.replaceChild(x, pd.o.codeDiffNew);
            }
            x.setAttribute("id", "newText");
            pd.o.codeDiffNew = x;
        }, {
            foldGutter       : true,
            gutters          : [
                "CodeMirror-linenumbers", "CodeMirror-foldgutter"
            ],
            indentUnit       : 4,
            lineNumbers      : true,
            matchBrackets    : true,
            matchTags        : true,
            mode             : "javascript",
            showTrailingSpace: true,
            tabSize          : 4,
            theme            : "white"
        });
        pd.cm.beauIn   = codeMirror(function (x) {
            var node = pd.$$("Beautify");
            if (pd.o.codeBeauIn === null) {
                if (node === null) {
                    pd.o.page.appendChild(x);
                } else {
                    node.appendChild(x);
                }
            } else {
                pd.o.codeBeauIn.parentNode.replaceChild(x, pd.o.codeBeauIn);
            }
            x.setAttribute("id", "beautyinput");
            pd.o.codeBeauIn = x;
        }, {
            foldGutter       : true,
            gutters          : [
                "CodeMirror-linenumbers", "CodeMirror-foldgutter"
            ],
            indentUnit       : 4,
            lineNumbers      : true,
            matchBrackets    : true,
            matchTags        : true,
            mode             : "javascript",
            showTrailingSpace: true,
            tabSize          : 4,
            theme            : "white"
        });
        pd.cm.beauOut  = codeMirror(function (x) {
            var node = pd.$$("Beautify");
            if (pd.o.codeBeauOut === null) {
                if (node === null) {
                    pd.o.page.appendChild(x);
                } else {
                    node.appendChild(x);
                }
            } else {
                pd.o.codeBeauOut.parentNode.replaceChild(x, pd.o.codeBeauOut);
            }
            x.setAttribute("id", "beautyoutput");
            pd.o.codeBeauOut = x;
        }, {
            foldGutter       : true,
            gutters          : [
                "CodeMirror-linenumbers", "CodeMirror-foldgutter"
            ],
            indentUnit       : 4,
            lineNumbers      : true,
            matchBrackets    : true,
            matchTags        : true,
            mode             : "javascript",
            readOnly         : true,
            showTrailingSpace: true,
            tabSize          : 4,
            theme            : "white"
        });
        pd.cm.minnIn   = codeMirror(function (x) {
            var node = pd.$$("Minify");
            if (pd.o.codeMinnIn === null) {
                if (node === null) {
                    pd.o.page.appendChild(x);
                } else {
                    node.appendChild(x);
                }
            } else {
                pd.o.codeMinnIn.parentNode.replaceChild(x, pd.o.codeMinnIn);
            }
            x.setAttribute("id", "minifyinput");
            pd.o.codeMinnIn = x;
        }, {
            foldGutter       : true,
            gutters          : [
                "CodeMirror-linenumbers", "CodeMirror-foldgutter"
            ],
            indentUnit       : 4,
            lineNumbers      : true,
            matchBrackets    : true,
            matchTags        : true,
            mode             : "javascript",
            showTrailingSpace: true,
            tabSize          : 4,
            theme            : "white"
        });
        pd.cm.minnOut  = codeMirror(function (x) {
            var node = pd.$$("Minify");
            if (pd.o.codeMinnOut === null) {
                if (node === null) {
                    pd.o.page.appendChild(x);
                } else {
                    node.appendChild(x);
                }
            } else {
                pd.o.codeMinnOut.parentNode.replaceChild(x, pd.o.codeMinnOut);
            }
            x.setAttribute("id", "minifyoutput");
            pd.o.codeMinnOut = x;
        }, {
            foldGutter       : true,
            gutters          : [
                "CodeMirror-linenumbers", "CodeMirror-foldgutter"
            ],
            indentUnit       : 4,
            lineNumbers      : true,
            matchBrackets    : true,
            matchTags        : true,
            mode             : "javascript",
            readOnly         : true,
            showTrailingSpace: true,
            tabSize          : 4,
            theme            : "white"
        });
        //execute pd.auto onkeyup for codeBeauIn and codeMinnIn
        pd.langkey     = function dom__langkey(x) {
            var value = x.getValue(),
                lang  = (pd.o.lang === null || pd.o.lang[pd.o.lang.selectedIndex].value === "auto") ? "auto" : pd.o.lang[pd.o.lang.selectedIndex].value;
            if (lang === "auto") {
                lang = pd.auto(value);
            }
            if (x.options.mode !== lang) {
                if (lang === "javascript") {
                    x.setOption("mode", "javascript");
                    x.setOption("mode", "javascript");
                }
                if (lang === "text") {
                    x.setOption("mode", null);
                    x.setOption("mode", null);
                }
                if (lang === "markup") {
                    x.setOption("mode", "xml");
                    x.setOption("mode", "xml");
                }
                if (lang === "html") {
                    x.setOption("mode", "htmlembedded");
                    x.setOption("mode", "htmlembedded");
                }
                if (lang === "css") {
                    x.setOption("mode", "text/x-scss");
                    x.setOption("mode", "text/x-scss");
                }
            }
        };
        //set indentation size in CodeMirror
        pd.insize      = function dom__insize() {
            var that  = this,
                value = Number(that.value);
            if (that === pd.$$("diff-quan")) {
                if (pd.o.codeDiffBase !== null) {
                    pd.cm.diffBase.setOption("indentUnit", value);
                }
                if (pd.o.codeDiffNew !== null) {
                    pd.cm.diffNew.setOption("indentUnit", value);
                }
            }
            if (that === pd.$$("beau-quan")) {
                if (pd.o.codeBeauIn !== null) {
                    pd.cm.beauIn.setOption("indentUnit", value);
                }
                if (pd.o.codeBeauOut !== null) {
                    pd.cm.beauOut.setOption("indentUnit", value);
                }
            }
            if (that === pd.$$("minn-quan")) {
                if (pd.o.codeMinnIn !== null) {
                    pd.cm.minnIn.setOption("indentUnit", value);
                }
                if (pd.o.codeMinnOut !== null) {
                    pd.cm.minnOut.setOption("indentUnit", value);
                }
            }
        };
    }

    //colSlider stuff is used with the horizontal dragging of columns in
    //the diff report
    pd.colSliderProperties = [];
    pd.colSliderGrab       = function dom__colSliderGrab(e) {
        var event       = e || window.event,
            touch       = (e !== null && e.type === "touchstart") ? true : false,
            node        = this,
            diffRight   = node.parentNode,
            diff        = diffRight.parentNode,
            subOffset   = 0,
            counter     = pd.colSliderProperties[0],
            data        = pd.colSliderProperties[1],
            width       = pd.colSliderProperties[2],
            total       = pd.colSliderProperties[3],
            offset      = pd.colSliderProperties[4],
            min         = 0,
            max         = data - 1,
            status      = "ew",
            minAdjust   = min + 15,
            maxAdjust   = max - 15,
            withinRange = false,
            diffLeft    = diffRight.previousSibling,
            drop        = function dom__colSliderGrab_drop(f) {
                f = f || window.event;
                f.preventDefault();
                node.style.cursor = status + "-resize";
                if (touch === true) {
                    document.ontouchmove = null;
                    document.ontouchend  = null;
                } else {
                    document.onmousemove = null;
                    document.onmouseup   = null;
                }
            },
            boxmove     = function dom__colSliderGrab_boxmove(f) {
                f = f || window.event;
                f.preventDefault();
                if (touch === true) {
                    subOffset = offset - f.touches[0].clientX;
                } else {
                    subOffset = offset - f.clientX;
                }
                if (subOffset > minAdjust && subOffset < maxAdjust) {
                    withinRange = true;
                }
                if (withinRange === true && subOffset > maxAdjust) {
                    diffRight.style.width = ((total - counter - 2) / 10) + "em";
                    status                = "e";
                } else if (withinRange === true && subOffset < minAdjust) {
                    diffRight.style.width = (width / 10) + "em";
                    status                = "w";
                } else if (subOffset < max && subOffset > min) {
                    diffRight.style.width = ((width + subOffset) / 10) + "em";
                    status                = "ew";
                }
                if (touch === true) {
                    document.ontouchend = drop;
                } else {
                    document.onmouseup = drop;
                }
            };
        event.preventDefault();
        if (typeof pd.o === "object" && pd.o.report.code.box !== null) {
            offset += pd.o.report.code.box.offsetLeft;
            offset -= pd.o.report.code.body.scrollLeft;
        } else {
            subOffset = (document.body.parentNode.scrollLeft > document.body.scrollLeft) ? document.body.parentNode.scrollLeft : document.body.scrollLeft;
            offset    -= subOffset;
        }
        offset             += node.clientWidth;
        node.style.cursor  = "ew-resize";
        diff.style.width   = (total / 10) + "em";
        diff.style.display = "inline-block";
        if (diffLeft.nodeType !== 1) {
            do {
                diffLeft = diffLeft.previousSibling;
            } while (diffLeft.nodeType !== 1);
        }
        diffLeft.style.display   = "block";
        diffRight.style.width    = (diffRight.clientWidth / 10) + "em";
        diffRight.style.position = "absolute";
        if (touch === true) {
            document.ontouchmove  = boxmove;
            document.ontouchstart = false;
        } else {
            document.onmousemove = boxmove;
            document.onmousedown = null;
        }
    };

    //allows visual folding of function in the JSPretty jsscope HTML
    //output
    pd.beaufold            = function dom__beaufold() {
        var self  = this,
            title = self.getAttribute("title").split("line "),
            min   = Number(title[1].substr(0, title[1].indexOf(" "))),
            max   = Number(title[2]),
            a     = 0,
            b     = "",
            list  = [
                self.parentNode.getElementsByTagName("li"), self.parentNode.nextSibling.getElementsByTagName("li")
            ];
        if (self.innerHTML.charAt(0) === "-") {
            for (a = min; a < max; a += 1) {
                list[0][a].style.display = "none";
                list[1][a].style.display = "none";
            }
            self.innerHTML = "+" + self.innerHTML.substr(1);
        } else {
            for (a = min; a < max; a += 1) {
                list[0][a].style.display = "block";
                list[1][a].style.display = "block";
                if (list[0][a].getAttribute("class") === "fold" && list[0][a].innerHTML.charAt(0) === "+") {
                    b = list[0][a].getAttribute("title");
                    b = b.substring(b.indexOf("to line ") + 1);
                    a = Number(b) - 1;
                }
            }
            self.innerHTML = "-" + self.innerHTML.substr(1);
        }
    };

    //allows visual folding of consecutive equal lines in a diff report
    pd.difffold            = function dom__difffold() {
        var a         = 0,
            b         = 0,
            self      = this,
            title     = self.getAttribute("title").split("line "),
            min       = Number(title[1].substr(0, title[1].indexOf(" "))),
            max       = Number(title[2]),
            inner     = self.innerHTML,
            lists     = [],
            parent    = self.parentNode.parentNode,
            listnodes = (parent.getAttribute("class") === "diff") ? parent.getElementsByTagName("ol") : parent.parentNode.getElementsByTagName("ol"),
            listLen   = listnodes.length;
        for (a = 0; a < listLen; a += 1) {
            lists.push(listnodes[a].getElementsByTagName("li"));
        }
        for (a = 0; a < min; a += 1) {
            if (lists[0][a].getAttribute("class") === "empty") {
                min += 1;
                max += 1;
            }
        }
        max = (max >= lists[0].length) ? lists[0].length : max;
        if (inner.charAt(0) === "-") {
            self.innerHTML = "+" + inner.substr(1);
            for (a = min; a < max; a += 1) {
                for (b = 0; b < listLen; b += 1) {
                    lists[b][a].style.display = "none";
                }
            }
        } else {
            self.innerHTML = "-" + inner.substr(1);
            for (a = min; a < max; a += 1) {
                for (b = 0; b < listLen; b += 1) {
                    lists[b][a].style.display = "block";
                }
            }
        }
    };

    pd.keydown             = function dom__keydown(e) {
        var event = e || window.event;
        if (pd.test.keypress === true && (pd.test.keystore.length === 0 || event.keyCode !== pd.test.keystore[pd.test.keystore.length - 1]) && event.keyCode !== 17) {
            pd.test.keystore.push(event.keyCode);
        }
        if (event.keyCode === 17 || event.ctrlKey === true) {
            pd.test.keypress = true;
        }
    };

    //recycle bundles arguments in preparation for executing prettydiff
    pd.recycle             = function dom__recycle(e) {
        var api        = {},
            output     = [],
            domain     = (/^((https?:\/\/)|(file:\/\/\/))/),
            event      = e || window.event,
            lang       = "",
            node       = {},
            requests   = false,
            requestd   = false,
            completes  = false,
            completed  = false,
            autotest   = false,
            cmlang     = function dom__recycle_cmlang() {
                if (api.lang === "auto") {
                    autotest = true;
                    lang     = pd.auto(api.source);
                    api.lang = lang;
                }
                if (lang === "html") {
                    lang = "htmlembedded";
                } else if (lang === "css") {
                    lang = "text/x-scss";
                } else if (lang === "markup") {
                    lang = "xml";
                }
                if (pd.test.cm === true) {
                    if (pd.mode === "diff") {
                        if (pd.cm.diffBase.options.mode !== lang) {
                            if (lang === "text") {
                                pd.cm.diffBase.setOption("mode", null);
                            } else {
                                pd.cm.diffBase.setOption("mode", lang);
                            }
                        }
                        if (pd.cm.diffNew.options.mode !== lang) {
                            if (lang === "text") {
                                pd.cm.diffNew.setOption("mode", null);
                            } else {
                                pd.cm.diffNew.setOption("mode", lang);
                            }
                        }
                    }
                    if (pd.mode === "beau" && pd.cm.beauIn.options.mode !== lang) {
                        pd.cm.beauIn.setOption("mode", lang);
                        pd.cm.beauOut.setOption("mode", lang);
                    }
                    if (pd.mode === "minn" && pd.cm.minnIn.options.mode !== lang) {
                        pd.cm.minnIn.setOption("mode", lang);
                        pd.cm.minnOut.setOption("mode", lang);
                    }
                }
                if (lang === "text/x-scss") {
                    lang = "css";
                } else if (lang === "htmlembedded") {
                    lang = "html";
                }
            },
            execOutput = function dom__recycle_execOutput() {
                var diffList         = [],
                    button           = {},
                    buttons          = {},
                    presumedLanguage = "",
                    chromeSave       = false;
                node      = pd.$$("showOptionsCallOut");
                pd.zIndex += 1;
                if (autotest === true) {
                    presumedLanguage = pd.langproper;
                    if (pd.langproper === "javascript") {
                        if (output[1] !== undefined && output[1].indexOf("React JSX") > 0 && ((api.jsscope === "report" && (/Code type is presumed to be React JSX/).test(output[1]) === false && (/Presumed language is &lt;em&gt;React JSX/).test(output[1]) === false) || api.jsscope !== "report")) {
                            pd.langproper = "React JSX";
                        }
                    } else if (pd.langproper === "text") {
                        pd.langproper = "plain text";
                    }
                } else {
                    pd.langproper = api.lang;
                }
                if (pd.o.announce !== null) {
                    if (autotest === true) {
                        pd.o.announce.style.color = "#00c";
                        pd.o.announce.innerHTML   = "Code type is set to <strong>auto</strong>. <span>Presumed language is <em>" + pd.langproper + "</em>.</span>";
                    } else {
                        pd.o.announce.innerHTML = "";
                    }
                }
                if (autotest === true) {
                    api.lang = "auto";
                }
                button = pd.o.report.code.box.getElementsByTagName("button")[0];
                if (button.getAttribute("class") === "save" && button.innerHTML === "H") {
                    chromeSave = true;
                    button.innerHTML = "S";
                }
                if (api.mode === "beautify") {
                    if (pd.o.codeBeauOut !== null) {
                        if (pd.test.cm === true) {
                            pd.cm.beauOut.setValue(output[0]);
                        } else {
                            pd.o.codeBeauOut.value = output[0];
                        }
                    }
                    if (pd.o.report.code.box !== null) {
                        if (output[1] !== "") {
                            pd.o.report.code.body.innerHTML = output[1];
                            if (pd.o.announce !== null && pd.$$("jserror") !== null) {
                                pd.o.announce.innerHTML                                     = "<strong>" + pd.$$("jserror").getElementsByTagName("strong")[0].innerHTML + "</strong> <span>See 'Code Report' for details</span>";
                                pd.o.announce.style.color                                   = "inherit";
                                pd.o.announce.getElementsByTagName("strong")[0].style.color = "#c00";
                            }
                            if (autotest === true) {
                                if (pd.o.report.code.body.firstChild.nodeType > 1) {
                                    pd.o.report.code.body.removeChild(pd.o.report.code.body.firstChild);
                                }
                                pd.o.report.code.body.firstChild.innerHTML = "Code type is set to <strong>auto</strong>. <span>Presumed language is <em>" + pd.langproper + "</em>.</span>";
                            }
                            pd.o.report.code.box.style.zIndex  = pd.zIndex;
                            pd.o.report.code.box.style.display = "block";
                        }
                        if (output[1].length > 125000) {
                            pd.test.filled.code = true;
                        } else {
                            pd.test.filled.code = false;
                        }
                        if (pd.o.jsscope.checked === true && (api.lang === "auto" || api.lang === "javascript") && output[0].indexOf("Error:") !== 0) {
                            if (api.lang === "auto" && presumedLanguage === "") {
                                presumedLanguage = output[1].split("Presumed language is <em>")[1];
                                presumedLanguage = presumedLanguage.substring(0, presumedLanguage.indexOf("</em>"));
                            }
                            if (presumedLanguage.toLowerCase() === "javascript" || api.lang === "javascript") {
                                if (pd.o.report.code.body.style.display === "none") {
                                    pd.grab({
                                        type: "onmousedown"
                                    }, pd.o.report.code.box.getElementsByTagName("h3")[0]);
                                }
                                pd.o.report.code.box.style.top   = (pd.settings.codereport.top / 10) + "em";
                                pd.o.report.code.box.style.right = "auto";
                                diffList                         = pd.o.report.code.body.getElementsByTagName("ol");
                                if (diffList.length > 0) {
                                    (function () {
                                        var a    = 0,
                                            list = diffList[0].getElementsByTagName("li"),
                                            b    = list.length;
                                        for (a = 0; a < b; a += 1) {
                                            if (list[a].getAttribute("class") === "fold") {
                                                list[a].onmousedown = pd.beaufold;
                                            }
                                        }
                                    }());
                                }
                            }
                        }
                    }
                    if (pd.o.announce !== null) {
                        if (api.lang === "markup" || presumedLanguage === "markup" || presumedLanguage === "html" || presumedLanguage === "htmlembedded" || presumedLanguage === "xhtml" || presumedLanguage === "xml" || presumedLanguage === "jstl") {
                            lang = (function () {
                                var a      = 0,
                                    p      = output[1].split("<p><strong>"),
                                    length = p.length;
                                for (a = 0; a < length; a += 1) {
                                    if (p[a].indexOf(" more ") > -1 && p[a].indexOf("start tag") > -1 && p[a].indexOf("end tag") > -1) {
                                        return "Notice: " + p[a].substring(0, p[a].indexOf("<"));
                                    }
                                    if (p[a].indexOf("Duplicate id") > -1) {
                                        if (p[a].indexOf("Execution time") > -1) {
                                            return p[a].slice(p[a].indexOf("<strong class='duplicate"), p[a].length - 4);
                                        }
                                        return "<strong>" + p[a].slice(0, p[a].length - 4);
                                    }
                                }
                                return "";
                            }());
                            if (lang.indexOf("end tag") > 0 || lang.indexOf("Duplicate id") > 0) {
                                pd.o.announce.style.color = "#c00";
                                pd.o.announce.innerHTML   = lang;
                            }
                        }
                    }
                    if (pd.test.ls === true) {
                        pd.stat.beau += 1;
                        node         = pd.$$("stbeau");
                        if (node !== null) {
                            node.innerHTML = pd.stat.beau;
                        }
                    }
                }
                if (api.mode === "diff" && pd.o.report.code.box !== null) {
                    if (pd.o.announce !== null && pd.o.announce.innerHTML !== pd.o.announcetext && autotest === false) {
                        pd.o.announce.innerHTML = "";
                    }
                    buttons = pd.o.report.code.box.getElementsByTagName("p")[0].getElementsByTagName("button");
                    if (output[0].length > 125000) {
                        pd.test.filled.code = true;
                    } else {
                        pd.test.filled.code = false;
                    }
                    if ((/^(<p><strong>Error:<\/strong> Please try using the option labeled ((&lt;)|<)em((&gt;)|>)Plain Text \(diff only\)((&lt;)|<)\/em((&gt;)|>)\.)/).test(output[0]) === true) {
                        pd.o.report.code.body.innerHTML = "<p><strong>Error:</strong> Please try using the option labeled <em>Plain Text (diff only)</em>. <span style='display:block'>The input does not appear to be markup, CSS, or JavaScript.</span></p>";
                    } else {
                        pd.o.report.code.body.innerHTML = output[1] + output[0];
                        if (autotest === true && pd.o.report.code.body.firstChild !== null) {
                            if (pd.o.report.code.body.firstChild.nodeType > 1) {
                                pd.o.report.code.body.removeChild(pd.o.report.code.body.firstChild);
                            }
                            pd.o.report.code.body.firstChild.innerHTML = "Code type is set to <strong>auto</strong>. <span>Presumed language is <em>" + pd.langproper + "</em>.</span>";
                        }
                    }
                    if (pd.o.report.code.body.innerHTML.toLowerCase().indexOf("<textarea") === -1) {
                        diffList = pd.o.report.code.body.getElementsByTagName("ol");
                        if (diffList.length > 0) {
                            (function () {
                                var cells = diffList[0].getElementsByTagName("li"),
                                    len   = cells.length,
                                    a     = 0;
                                for (a = 0; a < len; a += 1) {
                                    if (cells[a].getAttribute("class") === "fold") {
                                        cells[a].onmousedown = pd.difffold;
                                    }
                                }
                            }());
                        }
                        if (api.diffview === "sidebyside") {
                            if (diffList.length < 3 || diffList[0] === null || diffList[1] === null || diffList[2] === null) {
                                pd.colSliderProperties = [
                                    0, 0, 0, 0, 0
                                ];
                            } else {
                                pd.colSliderProperties   = [
                                    diffList[0].clientWidth, diffList[1].clientWidth, diffList[2].parentNode.clientWidth, diffList[2].parentNode.parentNode.clientWidth, diffList[2].parentNode.offsetLeft - diffList[2].parentNode.parentNode.offsetLeft
                                ];
                                diffList[2].onmousedown  = pd.colSliderGrab;
                                diffList[2].ontouchstart = pd.colSliderGrab;
                            }
                        }
                    }
                    if (pd.test.ls === true) {
                        pd.stat.diff += 1;
                        node         = pd.$$("stdiff");
                        if (node !== null) {
                            node.innerHTML = pd.stat.diff;
                        }
                    }
                }
                if (api.mode === "minify") {
                    if (pd.o.announce !== null && pd.o.announce.innerHTML !== pd.o.announcetext && autotest === false) {
                        pd.o.announce.innerHTML = "";
                    }
                    if (output[0].length > 125000) {
                        pd.test.filled.code = true;
                    } else {
                        pd.test.filled.code = false;
                    }
                    if (pd.o.codeMinnOut !== null) {
                        if (pd.test.cm === true) {
                            pd.cm.minnOut.setValue(output[0]);
                        } else {
                            pd.o.codeMinnOut.value = output[0];
                        }
                    }
                    if (pd.o.report.code.box !== null) {
                        if (autotest === true) {
                            output[1] = output[1].replace("seconds </em</p>", "seconds </em</p> <p>Language is set to <strong>auto</strong>. Presumed language is <em>" + api.lang + "</em>.</p>");
                            api.lang  = "auto";
                        }
                        pd.o.report.code.body.innerHTML = output[1];
                        if (autotest === true && pd.o.report.code.body.firstChild !== null) {
                            if (pd.o.report.code.body.firstChild.nodeType > 1) {
                                pd.o.report.code.body.removeChild(pd.o.report.code.body.firstChild);
                            }
                            pd.o.report.code.body.firstChild.innerHTML = "Code type is set to <strong>auto</strong>. <span>Presumed language is <em>" + pd.langproper + "</em>.</span>";
                        }
                        pd.o.report.code.box.style.zIndex  = pd.zIndex;
                        pd.o.report.code.box.style.display = "block";
                    }
                    if (pd.test.ls === true) {
                        pd.stat.minn += 1;
                        node         = pd.$$("stminn");
                        if (node !== null) {
                            node.innerHTML = pd.stat.minn;
                        }
                    }
                }
                buttons = pd.o.report.code.box.getElementsByTagName("button");
                if (chromeSave === true) {
                    pd.save(buttons[0]);
                } else if (pd.o.save !== null && pd.o.save.checked === true) {
                    if (buttons[0].parentNode.nodeName.toLowerCase() === "a") {
                        pd.save(buttons[0].parentNode);
                    } else {
                        pd.save(buttons[0]);
                    }
                }
                if (buttons[1].parentNode.style.display === "none") {
                    pd.minimize(buttons[1].onclick, 1, buttons[1]);
                }
                if (pd.test.ls === true) {
                    (function dom__recycle_stats() {
                        var size = 0;
                        lang = lang.toLowerCase();
                        if (lang === "csv") {
                            pd.stat.csv += 1;
                            node        = pd.$$("stcsv");
                            if (node !== null) {
                                node.innerHTML = pd.stat.csv;
                            }
                        } else if (lang === "plain text") {
                            pd.stat.text += 1;
                            node         = pd.$$("sttext");
                            if (node !== null) {
                                node.innerHTML = pd.stat.text;
                            }
                        } else if (lang === "javascript") {
                            pd.stat.js += 1;
                            node       = pd.$$("stjs");
                            if (node !== null) {
                                node.innerHTML = pd.stat.js;
                            }
                        } else if (lang === "markup" || lang === "html" || lang === "xml" || lang === "xhtml") {
                            pd.stat.markup += 1;
                            node           = pd.$$("stmarkup");
                            if (node !== null) {
                                node.innerHTML = pd.stat.markup;
                            }
                        } else if (lang === "css") {
                            pd.stat.css += 1;
                            node        = pd.$$("stcss");
                            if (node !== null) {
                                node.innerHTML = pd.stat.css;
                            }
                        }
                        if (api.mode === "diff" && api.source !== undefined && api.diff !== undefined && api.diff.length > api.source.length) {
                            size = api.diff.length;
                        } else if (api.source !== undefined) {
                            size = api.source.length;
                        }
                        if (size > pd.stat.large) {
                            pd.stat.large = size;
                            node          = pd.$$("stlarge");
                            if (node !== null) {
                                node.innerHTML = size;
                            }
                        }
                        if (pd.test.json === true) {
                            localStorage.setItem("stat", JSON.stringify(pd.stat));
                        }
                    }());
                }
            };

        node = pd.$$("showOptionsCallOut");
        if (node !== null) {
            node.parentNode.removeChild(node);
        }
        if (typeof event === "object" && event !== null && event.type === "keyup") {
            //jsscope does not get the convenience of keypress execution, because its overhead is costly
            //do not execute keypress from alt, home, end, or arrow keys
            if ((pd.o.jsscope !== null && pd.o.jsscope.checked === true && pd.mode === "beau") || event.altKey === true || event.keyCode === 16 || event.keyCode === 18 || event.keyCode === 35 || event.keyCode === 36 || event.keyCode === 37 || event.keyCode === 38 || event.keyCode === 39 || event.keyCode === 40) {
                return false;
            }
            if (pd.test.keypress === true) {
                if (pd.test.keystore.length > 0) {
                    pd.test.keystore.pop();
                    if (pd.test.keystore.length === 0) {
                        pd.test.keypress = false;
                    }
                    return false;
                }
            }
            if ((event.keyCode === 17 || event.ctrlKey === true) && pd.test.keypress === true && pd.test.keystore.length === 0) {
                pd.test.keypress = false;
                return false;
            }
        }

        //gather updated dom nodes
        api.lang        = (pd.o.lang === null) ? "javascript" : (pd.o.lang.nodeName.toLowerCase() === "select") ? pd.o.lang[pd.o.lang.selectedIndex].value.toLowerCase() : pd.o.lang.value.toLowerCase();
        api.langdefault = (pd.o.langdefault !== null) ? pd.o.langdefault[pd.o.langdefault.selectedIndex].value : "javascript";
        node            = pd.$$("csvchar");
        api.csvchar     = (node === null || node.value.length === 0) ? "," : node.value;
        api.api         = "dom";

        //determine options based upon mode of operations
        if (pd.mode === "beau") {
            if (pd.application === undefined) {
                if (api.lang === "markup" || api.lang === "html" || api.lang === "xml" || api.lang === "jstl") {
                    pd.application = function dom__markup_beauty() {
                        var code = markup_beauty(api),
                            sum  = (summary === undefined) ? "" : summary;
                        return [
                            code, sum
                        ];
                    };
                } else if (api.lang === "csv") {
                    pd.application = function csvbeauty() {
                        return [
                            csvbeauty(api), ""
                        ];
                    };
                } else if (api.lang === "css" || api.lang === "scss") {
                    pd.application = function dom__csspretty_beau() {
                        var code = csspretty(api),
                            sum  = (summary === undefined) ? "" : summary;
                        return [
                            code, sum
                        ];
                    };
                } else {
                    pd.application = function dom__jspretty_beau() {
                        var code = jspretty(api),
                            sum  = (summary === undefined) ? "" : summary;
                        return [
                            code, sum
                        ];
                    };
                }
            }
            (function dom__recycle_beautify() {
                var comments     = pd.$$("incomment-no"),
                    chars        = pd.$$("beau-space"),
                    elseline     = {},
                    forceIndent  = {},
                    html         = {},
                    braces       = {},
                    jscorrect    = {},
                    jshtml       = {},
                    jsspace      = {},
                    bracepadding = {},
                    objsorta     = pd.$$("bobjsort-all"),
                    objsortc     = pd.$$("bobjsort-cssonly"),
                    objsortj     = pd.$$("bobjsort-jsonly"),
                    jslinesa     = pd.$$("bjslines-all"),
                    jslinesc     = pd.$$("bjslines-cssonly"),
                    jslinesj     = pd.$$("bjslines-jsonly"),
                    offset       = {},
                    quantity     = pd.$$("beau-quan"),
                    style        = {},
                    verticala    = pd.$$("vertical-all"),
                    verticalc    = pd.$$("vertical-cssonly"),
                    verticalj    = pd.$$("vertical-jsonly"),
                    wrap         = {};
                if (pd.o.codeBeauIn !== null) {
                    if (pd.test.cm === true) {
                        api.source = pd.cm.beauIn.getValue();
                    } else {
                        api.source = pd.o.codeBeauIn.value;
                    }
                }
                if (objsorta !== null && objsorta.checked === true) {
                    api.objsort = "all";
                } else if (objsortc !== null && objsortc.checked === true) {
                    api.objsort = "css";
                } else if (objsortj !== null && objsortj.checked === true) {
                    api.objsort = "js";
                } else {
                    api.objsort = "none";
                }
                if (jslinesa !== null && jslinesa.checked === true) {
                    api.preserve = "all";
                } else if (jslinesc !== null && jslinesc.checked === true) {
                    api.preserve = "css";
                } else if (jslinesj !== null && jslinesj.checked === true) {
                    api.preserve = "js";
                } else {
                    api.preserve = "none";
                }
                if (verticala !== null && verticala.checked === true) {
                    api.vertical = "all";
                } else if (verticalc !== null && verticalc.checked === true) {
                    api.vertical = "css";
                } else if (verticalj !== null && verticalj.checked === true) {
                    api.vertical = "js";
                } else {
                    api.vertical = "none";
                }
                api.comments = (comments === null || comments.checked === false) ? false : true;
                api.insize   = (quantity === null || isNaN(quantity.value) === true) ? 4 : Number(quantity.value);
                if (chars === null || chars.checked === false) {
                    chars = pd.$$("beau-tab");
                    if (chars === null || chars.checked === false) {
                        chars = pd.$$("beau-line");
                        if (chars === null || chars.checked === false) {
                            chars = pd.$$("beau-other");
                            if (chars === null || chars.checked === false) {
                                api.inchar = " ";
                            } else {
                                chars = pd.$$("beau-char");
                                if (chars === null) {
                                    api.inchar = " ";
                                } else {
                                    api.inchar = chars.value;
                                }
                            }
                        } else {
                            api.inchar = "\n";
                        }
                    } else {
                        api.inchar = "\t";
                    }
                } else {
                    api.inchar = " ";
                }
                if (api.lang === "auto" || api.lang === "javascript") {
                    elseline         = pd.$$("jselseline-yes");
                    braces           = pd.$$("jsindent-all");
                    jscorrect        = pd.$$("jscorrect-yes");
                    jshtml           = pd.$$("jsscope-html");
                    jsspace          = pd.$$("jsspace-no");
                    offset           = pd.$$("inlevel");
                    bracepadding     = pd.$$("bracepadding-no");
                    api.correct      = (jscorrect === null || jscorrect.checked === false) ? false : true;
                    api.elseline     = (elseline === null || elseline.checked === false) ? false : true;
                    api.braces       = (braces === null || braces.checked === false) ? "knr" : "allman";
                    api.bracepadding = (bracepadding === null || bracepadding.checked === false) ? true : false;
                    api.inlevel      = (offset === null || isNaN(offset.value) === true) ? 0 : Number(offset.value);
                    api.space        = (jsspace === null || jsspace.checked === false) ? true : false;
                    if (pd.o.jsscope !== null && pd.o.jsscope.checked === true) {
                        api.jsscope = "report";
                    } else if (jshtml !== null && jshtml.checked === true) {
                        api.jsscope = "html";
                    } else {
                        api.jsscope = "none";
                    }
                }
                if (api.lang === "auto" || api.lang === "markup" || api.lang === "html" || api.lang === "xml" || api.lang === "jstl") {
                    forceIndent      = pd.$$("bforce_indent-yes");
                    html             = pd.$$("html-yes");
                    style            = pd.$$("inscript-no");
                    wrap             = pd.$$("beau-wrap");
                    api.force_indent = (forceIndent === null || forceIndent.checked === false) ? false : true;
                    api.html         = (html === null || html.checked === false) ? false : true;
                    api.style        = (style === null || style.checked === false) ? "indent" : "noindent";
                    api.wrap         = (wrap === null || isNaN(wrap.value) === true) ? 72 : Number(wrap.value);
                }
            }());
            api.mode = "beautify";
        }
        if (pd.mode === "minn") {
            if (pd.application === undefined) {
                if (api.lang === "markup" || api.lang === "html" || api.lang === "xml" || api.lang === "jstl") {
                    pd.application = function dom__markupmin() {
                        var code = markupmin(api),
                            sum  = (summary === undefined) ? "" : summary;
                        return [
                            code, sum
                        ];
                    };
                } else if (api.lang === "csv") {
                    pd.application = function csvmin() {
                        return [
                            csvmin(api), ""
                        ];
                    };
                } else if (api.lang === "css" || api.lang === "scss") {
                    pd.application = function dom__csspretty_min() {
                        var code = csspretty(api),
                            sum  = (summary === undefined) ? "" : summary;
                        return [
                            code, sum
                        ];
                    };
                } else {
                    pd.application = function dom__jspretty_min() {
                        var code = jspretty(api),
                            sum  = (summary === undefined) ? "" : summary;
                        return [
                            code, sum
                        ];
                    };
                }
            }
            (function dom__recycle_minify() {
                var conditional = pd.$$("conditionalm-yes"),
                    html        = pd.$$("htmlm-yes"),
                    topcoms     = pd.$$("topcoms-yes"),
                    obfuscate   = pd.$$("obfuscate-yes"),
                    objsorta    = pd.$$("mobjsort-all"),
                    objsortc    = pd.$$("mobjsort-cssonly"),
                    objsortj    = pd.$$("mobjsort-jsonly");
                if (pd.o.codeMinnIn !== null) {
                    pd.o.codeMinnIn = pd.$$("minifyinput");
                    if (pd.test.cm === true) {
                        api.source = pd.cm.minnIn.getValue();
                    } else {
                        api.source = pd.o.codeMinnIn.value;
                    }
                }
                if (objsorta !== null && objsorta.checked === true) {
                    api.objsort = "all";
                } else if (objsortc !== null && objsortc.checked === true) {
                    api.objsort = "css";
                } else if (objsortj !== null && objsortj.checked === true) {
                    api.objsort = "js";
                } else {
                    api.objsort = "none";
                }
                api.conditional = (conditional === null || conditional.checked === false) ? false : true;
                api.html        = (html === null || html.checked === false) ? false : true;
                api.topcoms     = (topcoms === null || topcoms.checked === false) ? false : true;
                api.obfuscate   = (obfuscate === null || obfuscate.checked === false) ? false : true;
            }());
            api.mode = "minify";
        }
        if (pd.mode === "diff") {
            if (typeof prettydiff !== "function" && typeof diffview === "function") {
                pd.application = diffview;
            }
            if (typeof pd.application !== "function") {
                return;
            }
            api.jsscope = false;
            (function dom__recycle_diff() {
                var baseLabel    = pd.$$("baselabel"),
                    bracepadding = {},
                    braces       = {},
                    comments     = pd.$$("diffcommentsy"),
                    chars        = pd.$$("diff-space"),
                    conditional  = {},
                    content      = pd.$$("diffcontentn"),
                    context      = pd.$$("contextSize"),
                    elseline     = {},
                    forceIndent  = {},
                    html         = {},
                    inline       = pd.$$("inline"),
                    newLabel     = pd.$$("newlabel"),
                    objsorta     = pd.$$("dobjsort-all"),
                    objsortc     = pd.$$("dobjsort-cssonly"),
                    objsortj     = pd.$$("dobjsort-jsonly"),
                    jslinesa     = pd.$$("djslines-all"),
                    jslinesc     = pd.$$("djslines-cssonly"),
                    jslinesj     = pd.$$("djslines-jsonly"),
                    quantity     = pd.$$("diff-quan"),
                    quote        = pd.$$("diffquoten"),
                    style        = {},
                    semicolon    = pd.$$("diffscolonn"),
                    space        = {},
                    wrap         = {};
                pd.o.codeDiffBase = pd.$$("baseText");
                pd.o.codeDiffNew  = pd.$$("newText");
                api.content       = (content === null || content.checked === false) ? false : true;
                api.context       = (context !== null && context.value !== "" && isNaN(context.value) === false) ? Number(context.value) : "";
                api.diffcomments  = (comments === null || comments.checked === true) ? true : false;
                api.difflabel     = (newLabel === null) ? "new" : newLabel.value;
                api.diffview      = (inline === null || inline.checked === false) ? "sidebyside" : "inline";
                api.insize        = (quantity === null || isNaN(quantity.value) === true) ? 4 : Number(quantity.value);
                api.quote         = (quote === null || quote.checked === false) ? false : true;
                api.semicolon     = (semicolon === null || semicolon.checked === false) ? false : true;
                api.sourcelabel   = (baseLabel === null) ? "base" : baseLabel.value;
                if (objsorta !== null && objsorta.checked === true) {
                    api.objsort = "all";
                } else if (objsortc !== null && objsortc.checked === true) {
                    api.objsort = "css";
                } else if (objsortj !== null && objsortj.checked === true) {
                    api.objsort = "js";
                } else {
                    api.objsort = "none";
                }
                if (jslinesa !== null && jslinesa.checked === true) {
                    api.preserve = "all";
                } else if (jslinesc !== null && jslinesc.checked === true) {
                    api.preserve = "css";
                } else if (jslinesj !== null && jslinesj.checked === true) {
                    api.preserve = "js";
                } else {
                    api.preserve = "none";
                }
                if (chars === null || chars.checked === false) {
                    chars = pd.$$("diff-tab");
                    if (chars === null || chars.checked === false) {
                        chars = pd.$$("diff-line");
                        if (chars === null || chars.checked === false) {
                            chars = pd.$$("diff-other");
                            if (chars === null || chars.checked === false) {
                                api.inchar = " ";
                            } else {
                                chars = pd.$$("diff-char");
                                if (chars === null) {
                                    api.inchar = " ";
                                } else {
                                    api.inchar = chars.value;
                                }
                            }
                        } else {
                            api.inchar = "\n";
                        }
                    } else {
                        api.inchar = "\t";
                    }
                } else {
                    api.inchar = " ";
                }
                if (api.lang === "auto" || api.lang === "javascript") {
                    elseline         = pd.$$("jselselined-yes");
                    space            = pd.$$("jsspaced-no");
                    braces           = pd.$$("jsindentd-all");
                    bracepadding     = pd.$$("dbracepadding-no");
                    api.elseline     = (elseline === null || elseline.checked === false) ? false : true;
                    api.space        = (space === null || space.checked === false) ? true : false;
                    api.bracepadding = (bracepadding === null || bracepadding.checked === false) ? true : false;
                    api.braces       = (braces === null || braces.checked === false) ? "knr" : "allman";
                }
                if (api.lang === "auto" || api.lang === "markup" || api.lang === "html" || api.lang === "xml" || api.lang === "jstl") {
                    conditional      = pd.$$("conditionald-yes");
                    forceIndent      = pd.$$("dforce_indent-yes");
                    html             = pd.$$("htmld-yes");
                    style            = pd.$$("inscriptd-no");
                    wrap             = pd.$$("diff-wrap");
                    api.conditional  = (conditional === null || conditional.checked === false) ? false : true;
                    api.force_indent = (forceIndent === null || forceIndent.checked === false) ? false : true;
                    api.html         = (html === null || html.checked === false) ? false : true;
                    api.style        = (style === null || style.checked === false) ? "indent" : "noindent";
                    api.wrap         = (wrap === null || isNaN(wrap.value) === true) ? 72 : Number(wrap.value);
                }
                if (api.diffcomments === false) {
                    api.comments = "nocomment";
                }
                if (pd.o.codeDiffBase !== null && (pd.o.codeDiffBase.value === "" || pd.o.codeDiffBase.value === "Error: source code is missing.")) {
                    pd.o.codeDiffBase.value = "Error: source code is missing.";
                    return;
                }
                if (pd.o.codeDiffNew !== null && (pd.o.codeDiffNew.value === "" || pd.o.codeDiffNew.value === "Error: diff code is missing.")) {
                    pd.o.codeDiffNew.value = "Error: diff code is missing.";
                    return;
                }
                if (pd.o.codeDiffBase !== null) {
                    if (pd.test.cm === true) {
                        api.source = pd.cm.diffBase.getValue();
                    } else {
                        api.source = pd.o.codeDiffBase.value;
                    }
                }
                if (pd.o.codeDiffNew !== null) {
                    if (pd.test.cm === true) {
                        api.diff = pd.cm.diffNew.getValue();
                    } else {
                        api.diff = pd.o.codeDiffNew.value;
                    }
                }
                api.mode = "diff";
                if (domain.test(api.diff) === true && pd.test.xhr === true) {
                    (function dom__recycle_xhrDiff() {
                        var filetest       = (api.diff.indexOf("file:///") === 0) ? true : false,
                            protocolRemove = (filetest === true) ? api.diff.split(":///")[1] : api.diff.split("://")[1],
                            slashIndex     = (protocolRemove !== undefined) ? protocolRemove.indexOf("/") : 0,
                            xhr            = (typeof XMLHttpRequest === "function" || typeof XMLHttpRequest === "object") ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
                        if (typeof protocolRemove !== "string" || protocolRemove.length === 0) {
                            return;
                        }
                        requestd = true;
                        if (slashIndex > 0 || api.diff.indexOf("http") === 0) {
                            xhr.onreadystatechange = function dom__recycle_xhrDiff_stateChange() {
                                if (xhr.readyState === 4) {
                                    if (xhr.status === 200 || xhr.status === 0) {
                                        api.diff = xhr.responseText.replace(/\r\n/g, "\n");
                                        if (completes === true) {
                                            if (api.lang === "auto") {
                                                cmlang();
                                            }
                                            pd.source = api.source;
                                            if (pd.mode === "diff") {
                                                pd.diff = api.diff;
                                            } else {
                                                pd.diff = "";
                                            }
                                            output = pd.application(api);
                                            execOutput();
                                            return;
                                        }
                                        completed = true;
                                    } else {
                                        api.diff = "Error: transmission failure receiving diff code from address.";
                                    }
                                }
                            };
                            if (filetest === true) {
                                xhr.open("GET", api.diff.replace(/(\s*)$/, "").replace(/%26/g, "&").replace(/%3F/, "?"), true);
                            } else {
                                xhr.open("GET", "proxy.php?x=" + api.diff.replace(/(\s*)$/, "").replace(/%26/g, "&").replace(/%3F/, "?"), true);
                            }
                            xhr.send();
                        }
                    }());
                }
            }());
        }
        if (pd.test.ls === true) {
            if (pd.o.report.stat.box !== null) {
                pd.stat.usage  += 1;
                pd.stat.useday = Math.round(pd.stat.usage / ((Date.now() - pd.stat.fdate) / 86400000));
                node           = pd.$$("stusage");
                if (node !== null) {
                    node.innerHTML = pd.stat.usage;
                }
                node = pd.$$("stuseday");
                if (node !== null) {
                    node.innerHTML = pd.stat.useday;
                }
            }
            (function () {
                var codesize = 0;
                //this logic attempts to prevent writes to localStorage if they are likely to exceed 5mb of storage
                if (api.mode === "beautify") {
                    codesize = api.source.length + pd.o.length.diffBase + pd.o.length.diffNew + pd.o.length.minn;
                    if (api.source.length < 2096000 && codesize < 4800000) {
                        localStorage.codeBeautify = api.source;
                        pd.o.length.beau          = api.source.length;
                    } else {
                        localStorage.codeBeautify = "";
                        pd.o.length.beau          = 0;
                    }
                } else if (api.mode === "minify") {
                    codesize = api.source.length + pd.o.length.beau + pd.o.length.diffBase + pd.o.length.diffNew;
                    if (api.source.length < 2096000 && codesize < 4800000) {
                        localStorage.codeMinify = api.source;
                        pd.o.length.minn        = api.source.length;
                    } else {
                        localStorage.codeMinify = "";
                        pd.o.length.minn        = 0;
                    }
                } else if (api.mode === "diff") {
                    codesize = pd.o.length.beau + pd.o.length.minn + api.source.length + api.diff.length;
                    if (api.source.length < 2096000 && api.diff.length < 2096000 && codesize < 4800000) {
                        localStorage.codeDiffBase = api.source;
                        localStorage.codeDiffNew  = api.diff;
                        pd.o.length.diffBase      = api.source.length;
                        pd.o.length.diffNew       = api.diff.length;
                    } else {
                        localStorage.codeDiffBase = "";
                        localStorage.codeDiffNew  = "";
                        pd.o.length.diffBase      = 0;
                        pd.o.length.diffNew       = 0;
                    }
                }
            }());
        }
        if (domain.test(api.source) === true && pd.test.xhr === true) {
            (function dom__recycle_xhrSource() {
                var filetest       = (api.source.indexOf("file:///") === 0) ? true : false,
                    protocolRemove = (filetest === true) ? api.source.split(":///")[1] : api.source.split("://")[1],
                    slashIndex     = (protocolRemove !== undefined) ? protocolRemove.indexOf("/") : 0,
                    xhr            = (typeof XMLHttpRequest === "function" || typeof XMLHttpRequest === "object") ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
                if (typeof protocolRemove !== "string" || protocolRemove.length === 0) {
                    return;
                }
                requests = true;
                if (slashIndex > 0 || api.source.indexOf("http") === 0) {
                    xhr.onreadystatechange = function dom__recycle_xhrSource_statechange() {
                        if (xhr.readyState === 4) {
                            if (xhr.status === 200 || xhr.status === 0) {
                                api.source = xhr.responseText.replace(/\r\n/g, "\n");
                                if (pd.mode !== "diff" || (requestd === true && completed === true)) {
                                    if (api.lang === "auto") {
                                        cmlang();
                                    }
                                    pd.source = api.source;
                                    if (pd.mode === "diff") {
                                        pd.diff = api.diff;
                                    } else {
                                        pd.diff = "";
                                    }
                                    output = pd.application(api);
                                    execOutput();
                                    return;
                                }
                                completes = true;
                            } else {
                                api.source = "Error: transmission failure receiving source code from address.";
                            }
                        }
                    };
                    if (filetest === true) {
                        xhr.open("GET", api.source.replace(/(\s*)$/, "").replace(/%26/g, "&").replace(/%3F/, "?"), true);
                    } else {
                        xhr.open("GET", "proxy.php?x=" + api.source.replace(/(\s*)$/, "").replace(/%26/g, "&").replace(/%3F/, "?"), true);
                    }
                    xhr.send();
                }
            }());
        }
        if (requests === false && requestd === false) {
            //sometimes the CodeMirror getValue method fires too early
            //on copy/paste.  I put in a 50ms delay in this case to
            //prevent operations from old input
            if (pd.test.cm === true && api.mode !== "diff") {
                if (api.mode === "beautify") {
                    setTimeout(function () {
                        api.source = pd.cm.beauIn.getValue();
                        if (api.lang === "auto") {
                            cmlang();
                        }
                        pd.source = api.source;
                        pd.diff   = "";
                        output    = pd.application(api);
                        execOutput();
                    }, 50);
                }
                if (api.mode === "minify") {
                    setTimeout(function () {
                        api.source = pd.cm.minnIn.getValue();
                        if (api.lang === "auto") {
                            cmlang();
                        }
                        pd.source = api.source;
                        pd.diff   = "";
                        output    = pd.application(api);
                        execOutput();
                    }, 50);
                }
            } else {
                if (api.lang === "auto") {
                    cmlang();
                }
                pd.source = api.source;
                if (pd.mode === "diff") {
                    pd.diff = api.diff;
                } else {
                    pd.diff = "";
                }
                output = pd.application(api);
                execOutput();
            }
        }
    };

    //this function allows typing of tab characters into textareas
    //without the textarea loosing focus
    pd.fixtabs             = function dom__fixtabs(e, node) {
        var x     = node || this,
            start = "",
            end   = "",
            val   = "",
            sel   = 0,
            event = e || window.event;
        if (typeof event !== "object" || event === null || event.type !== "keydown" || event.keyCode !== 9 || typeof x.selectionStart !== "number" || typeof x.selectionEnd !== "number") {
            return true;
        }
        val              = x.value;
        sel              = x.selectionStart;
        start            = val.substring(0, sel);
        end              = val.substring(sel, val.length);
        x.value          = start + "\t" + end;
        x.selectionStart = sel + 1;
        x.selectionEnd   = sel + 1;
        event.preventDefault();
        return false;
    };

    pd.sequence            = function dom__sequence(e) {
        var seq   = pd.test.keysequence,
            len   = seq.length,
            event = e || window.event,
            key   = event.keyCode;
        if (len === 0 || len === 1) {
            if (key === 38) {
                pd.test.keysequence.push(true);
            } else {
                pd.test.keysequence = [];
            }
        } else if (len === 2 || len === 3) {
            if (key === 40) {
                pd.test.keysequence.push(true);
            } else {
                pd.test.keysequence = [];
            }
        } else if (len === 4 || len === 6) {
            if (key === 37) {
                pd.test.keysequence.push(true);
            } else {
                pd.test.keysequence = [];
            }
        } else if (len === 5 || len === 7) {
            if (key === 39) {
                pd.test.keysequence.push(true);
            } else {
                pd.test.keysequence = [];
            }
        } else if (len === 8) {
            if (key === 66) {
                pd.test.keysequence.push(true);
            } else {
                pd.test.keysequence = [];
            }
        } else if (len === 9) {
            if (key === 65) {
                if (pd.test.audio !== null) {
                    (function () {
                        var source  = pd.test.audio.createBufferSource(),
                            binary  = window.atob("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"),
                            buff    = new ArrayBuffer(binary.length),
                            bytes   = new Uint8Array(buff),
                            z       = 0,
                            bytelen = buff.byteLength;
                        for (z = 0; z < bytelen; z += 1) {
                            bytes[z] = binary.charCodeAt(z);
                        }
                        pd.test.audio.decodeAudioData(buff, function (buffer) {
                            source.buffer = buffer;
                            source.loop   = false;
                            source.connect(pd.test.audio.destination);
                            source.start(0, 0, 1.8);
                        });
                    }());
                }
                /*(function () {
                    var color = pd.$$("colorScheme"),
                        ind = color.selectedIndex,
                        y = 0,
                        z = ind,
                        change = function () {
                            z -= 1;
                            y += 1;
                            if (z < 0) {
                                z = color.getElementsByTagName("option").length - 1;
                            }
                            color.selectedIndex = z;
                            pd.colorScheme(color);
                            if (y < 20) {
                                setTimeout(change, 50);
                            } else {
                                color.selectedIndex = ind;
                                pd.colorScheme(color);
                            }
                        };
                    setTimeout(change, 50);
                }());*/
                (function () {
                    var color  = pd.$$("colorScheme"),
                        ind    = color.selectedIndex,
                        max    = color.getElementsByTagName("option").length - 1,
                        change = function () {
                            color.selectedIndex = ind;
                            pd.colorScheme(color);
                        };
                    ind -= 1;
                    if (ind < 0) {
                        ind = max;
                    }
                    change();
                    ind += 1;
                    if (ind > max) {
                        ind = 0;
                    }
                    setTimeout(change, 1500);
                }());
            }
            pd.test.keysequence = [];
        }
    };

    //testing for two physical tab presses for pd.areaTabOut
    pd.tabtrue             = false;

    //fixing areaTabOut in the case of unintentional back tabs
    pd.areaShiftUp         = function dom__areaShiftUp(e) {
        var event = e || window.event;
        if (event.keyCode === 16 && pd.test.tabesc.length > 0) {
            pd.test.tabesc = [];
        }
        if (event.keyCode === 17) {
            pd.tabtrue = true;
        }
    };

    //provide a means for keyboard users to escape a textarea
    pd.areaTabOut          = function dom__areaTabOut(event, node) {
        var len = pd.test.tabesc.length,
            esc = false;
        node  = node || this;
        event = event || window.event;
        if (event.keyCode === 17) {
            if (pd.tabtrue === false && (pd.test.tabesc[0] === 17 || len > 1)) {
                return;
            }
            pd.tabtrue = false;
        }
        if (node.nodeName.toLowerCase() === "textarea") {
            if (pd.test.cm === true) {
                node = node.parentNode.parentNode;
                if (node === pd.o.codeBeauOut || node === pd.o.codeMinnOut) {
                    esc = true;
                }
            }
            if (node === pd.o.codeDiffBase || node === pd.o.codeDiffNew || node === pd.o.codeBeauIn || node === pd.o.codeMinnIn) {
                esc = true;
            }
        }
        if (esc === true) {
            esc        = false;
            pd.tabtrue = false;
            if (len === 0 && (event.keyCode === 16 || event.keyCode === 17)) {
                return pd.test.tabesc.push(event.keyCode);
            }
            if (len === 1 && event.keyCode === 17) {
                if (pd.test.tabesc[0] === 17) {
                    esc = true;
                } else {
                    return pd.test.tabesc.push(17);
                }
            } else if (len === 2 && event.keyCode === 17) {
                esc = true;
            } else if (len > 0) {
                pd.test.tabesc = [];
            }
            if (esc === true) {
                if (len === 2) {
                    //back tab
                    if (node === pd.o.codeDiffBase) {
                        pd.$$("diffbasefile").focus();
                    } else if (node === pd.o.codeDiffNew) {
                        pd.$$("diffnewfile").focus();
                    } else if (node === pd.o.codeBeauIn) {
                        pd.$$("beautyfile").focus();
                    } else if (node === pd.o.codeBeauOut) {
                        pd.o.codeBeauIn.getElementsByTagName("textarea")[0].focus();
                    } else if (node === pd.o.codeMinnIn) {
                        pd.$$("minifyfile").focus();
                    } else if (node === pd.o.codeMinnOut) {
                        pd.o.codeMinnIn.getElementsByTagName("textarea")[0].focus();
                    }
                } else {
                    //forward tab
                    if (node === pd.o.codeDiffBase) {
                        pd.$$("newlabel").focus();
                    } else if (node === pd.o.codeDiffNew || node === pd.o.codeBeauOut || node === pd.o.codeMinnOut) {
                        pd.$$("button-primary").getElementsByTagName("button")[0].focus();
                    } else if (node === pd.o.codeBeauIn) {
                        if (pd.test.cm === true) {
                            pd.o.codeBeauOut.getElementsByTagName("textarea")[0].focus();
                        } else {
                            pd.o.codeBeauOut.focus();
                        }
                    } else if (node === pd.o.codeMinnIn) {
                        if (pd.test.cm === true) {
                            pd.o.codeMinnOut.getElementsByTagName("textarea")[0].focus();
                        } else {
                            pd.o.codeMinnOut.focus();
                        }
                    }
                }
                pd.test.tabesc = [];
                return;
            }
            pd.sequence(event);
        } else {
            pd.sequence(event);
        }
    };

    //intelligently raise the z-index of the report windows
    pd.top                 = function dom__top(x) {
        var indexListed = pd.zIndex,
            indexes     = [
                (pd.o.report.feed.box === null) ? 0 : Number(pd.o.report.feed.box.style.zIndex), (pd.o.report.code.box === null) ? 0 : Number(pd.o.report.code.box.style.zIndex), (pd.o.report.stat.box === null) ? 0 : Number(pd.o.report.stat.box.style.zIndex)
            ],
            indexMax    = Math.max(indexListed, indexes[0], indexes[1], indexes[2]) + 1;
        if (indexMax < 11) {
            indexMax = 11;
        }
        pd.zIndex = indexMax;
        if (x.nodeType === 1) {
            x.style.zIndex = indexMax;
        }
    };

    //read from files if the W3C File API is supported
    pd.file                = function dom__file() {
        var a         = 0,
            input     = this,
            files     = input.files,
            reader    = {},
            fileStore = [],
            fileCount = 0,
            fileLoad  = function dom__file_init1() {
                return;
            },
            fileError = function dom__file_init2() {
                return;
            };
        if (files === undefined) {
            return;
        }
        if (pd.test.fs === true && files[0] !== null && typeof files[0] === "object") {
            if (input.nodeName === "input") {
                input = input.parentNode.parentNode.getElementsByTagName("textarea")[0];
            }
            fileLoad  = function dom__file_onload(e) {
                var event = e || window.event;
                fileStore.push(event.target.result);
                if (a === fileCount) {
                    input.value = fileStore.join("\n\n");
                    if (pd.mode !== "diff") {
                        pd.recycle();
                    }
                }
            };
            fileError = function dom__file_onerror(e) {
                var event = e || window.event;
                input.value = "Error reading file: " + files[a].name + "\n\nThis is the browser's descriptiong: " + event.target.error.name;
                fileCount   = -1;
            };
            fileCount = files.length;
            for (a = 0; a < fileCount; a += 1) {
                reader         = new FileReader();
                reader.onload  = fileLoad;
                reader.onerror = fileError;
                if (files[a] !== undefined) {
                    reader.readAsText(files[a], "UTF-8");
                }
            }
            pd.recycle();
        }
    };

    pd.filenull            = function dom__filenull(e) {
        var event = e || window.event;
        event.stopPropagation();
        event.preventDefault();
    };

    pd.filedrop            = function dom__filedrop(e) {
        var event = e || window.event;
        event.stopPropagation();
        event.preventDefault();
        pd.file();
    };

    //change the color scheme of the web UI
    pd.colorScheme         = function DOM_colorScheme(node) {
        var x         = (node !== undefined && node.nodeType === 1) ? node : this,
            option    = x.getElementsByTagName("option"),
            optionLen = option.length,
            index     = (function dom__colorScheme_indexLen() {
                if (x.selectedIndex < 0 || x.selectedIndex > optionLen) {
                    x.selectedIndex = optionLen - 1;
                    return optionLen - 1;
                }
                return x.selectedIndex;
            }()),
            color     = option[index].innerHTML.toLowerCase().replace(/\s+/g, ""),
            logoColor = "",
            logo      = pd.$$("pdlogo");
        pd.o.page.setAttribute("class", color);
        if (pd.test.cm === true) {
            pd.cm.diffBase.setOption("theme", color);
            pd.cm.diffNew.setOption("theme", color);
            pd.cm.beauIn.setOption("theme", color);
            pd.cm.beauOut.setOption("theme", color);
            pd.cm.minnIn.setOption("theme", color);
            pd.cm.minnOut.setOption("theme", color);
        }
        pd.color = color;
        if (logo !== null) {
            if (color === "canvas") {
                logoColor = "664";
            } else if (color === "shadow") {
                logoColor = "999";
            } else if (color === "white") {
                logoColor = "666";
            } else {
                logoColor = "000";
            }
            logo.style.borderColor = "#" + logoColor;
            logo.getElementsByTagName("g")[0].setAttribute("fill", "#" + logoColor);
        }
        pd.options(x);
    };

    //minimize report windows to the default size and location
    pd.minimize            = function dom__minimize(e, steps, node) {
        var x         = node || this,
            parent    = (x.parentNode.nodeName.toLowerCase() === "a") ? x.parentNode.parentNode : x.parentNode,
            box       = parent.parentNode,
            finale    = 0,
            id        = box.getAttribute("id"),
            body      = box.getElementsByTagName("div")[0],
            heading   = box.getElementsByTagName("h3")[0],
            buttons   = parent.getElementsByTagName("button"),
            save      = (parent.innerHTML.indexOf("save") > -1) ? true : false,
            buttonMin = (save === true) ? buttons[1] : buttons[0],
            buttonMax = (save === true) ? buttons[2] : buttons[1],
            left      = (box.offsetLeft / 10),
            top       = (box.offsetTop / 10),
            buttonRes = (save === true) ? buttons[3] : buttons[2],
            step      = (typeof steps !== "number") ? 50 : (steps < 1) ? 1 : steps,
            growth    = function dom__minimize_growth() {
                var boxLocal     = box,
                    bodyLocal    = body,
                    headingLocal = heading,
                    leftLocal    = left,
                    topLocal     = (top > 1) ? top : 1,
                    width        = 17,
                    height       = 3,
                    leftTarget   = 0,
                    topTarget    = 0,
                    widthTarget  = 0,
                    heightTarget = 0,
                    incW         = 0,
                    incH         = 0,
                    incL         = 0,
                    incT         = 0,
                    saveSpace    = (save === true) ? 9.45 : 6.45,
                    grow         = function dom__minimize_growth_grow() {
                        width                    += incW;
                        height                   += incH;
                        leftLocal                += incL;
                        topLocal                 += incT;
                        bodyLocal.style.width    = width + "em";
                        bodyLocal.style.height   = height + "em";
                        headingLocal.style.width = (width - saveSpace) + "em";
                        boxLocal.style.left      = leftLocal + "em";
                        boxLocal.style.top       = topLocal + "em";
                        if (width + incW < widthTarget || height + incH < heightTarget) {
                            setTimeout(grow, 1);
                        } else {
                            bodyLocal.style.width    = widthTarget + "em";
                            bodyLocal.style.height   = heightTarget + "em";
                            headingLocal.style.width = (widthTarget - saveSpace) + "em";
                            pd.options(boxLocal);
                            return false;
                        }
                    };
                if (typeof pd.settings[id].left === "number") {
                    leftTarget   = (pd.settings[id].left / 10);
                    topTarget    = (pd.settings[id].top / 10);
                    widthTarget  = (pd.settings[id].width / 10);
                    heightTarget = (pd.settings[id].height / 10);
                } else {
                    topLocal               += 4;
                    pd.settings[id].left   = 200;
                    pd.settings[id].top    = (topLocal * 10);
                    pd.settings[id].width  = 550;
                    pd.settings[id].height = 450;
                    leftTarget             = 10;
                    topTarget              = 2;
                    widthTarget            = 55;
                    heightTarget           = 45;
                }
                widthTarget  = widthTarget - 0.3;
                heightTarget = heightTarget - 3.55;
                if (step === 1) {
                    boxLocal.style.left    = leftTarget + "em";
                    boxLocal.style.top     = ((window.innerHeight / 10) - 30) + "em";
                    bodyLocal.style.width  = widthTarget + "em";
                    bodyLocal.style.height = heightTarget + "em";
                    heading.style.width    = (widthTarget - saveSpace) + "em";
                    pd.options(boxLocal);
                    return false;
                }
                incW                    = (widthTarget > width) ? ((widthTarget - width) / step) : ((width - widthTarget) / step);
                incH                    = (heightTarget > height) ? ((heightTarget - height) / step) : ((height - heightTarget) / step);
                incL                    = (leftTarget - leftLocal) / step;
                incT                    = (topTarget - topLocal) / step;
                boxLocal.style.right    = "auto";
                bodyLocal.style.display = "block";
                grow();
                return false;
            },
            shrinkage = function dom__minimize_shrinkage() {
                var leftLocal    = left,
                    topLocal     = top,
                    boxLocal     = box,
                    bodyLocal    = body,
                    headingLocal = heading,
                    finalLocal   = finale,
                    topmin       = box.parentNode.offsetTop,
                    width        = bodyLocal.clientWidth / 10,
                    height       = bodyLocal.clientHeight / 10,
                    incL         = (((window.innerWidth / 10) - finalLocal - 17) - leftLocal) / step,
                    incT         = (((topmin / 10) - topLocal) / step),
                    incW         = (width === 17) ? 0 : (width > 17) ? ((width - 17) / step) : ((17 - width) / step),
                    incH         = height / step,
                    shrink       = function dom__minimize_shrinkage() {
                        leftLocal                += incL;
                        topLocal                 += incT;
                        width                    -= incW;
                        height                   -= incH;
                        bodyLocal.style.width    = width + "em";
                        headingLocal.style.width = width + "em";
                        bodyLocal.style.height   = height + "em";
                        boxLocal.style.left      = leftLocal + "em";
                        boxLocal.style.top       = topLocal + "em";
                        if (width - incW > 16.8) {
                            setTimeout(shrink, 1);
                        } else {
                            bodyLocal.style.display = "none";
                            boxLocal.style.left     = "auto";
                            boxLocal.style.right    = finalLocal + "em";
                            boxLocal.style.top      = "auto";
                            pd.options(boxLocal);
                            return false;
                        }
                    };
                shrink();
                return false;
            };
        buttonRes.style.display = "block";
        if (box === pd.o.report.feed.box) {
            if (pd.test.filled.feed === true) {
                step = 1;
            }
            finale = 38.8;
        }
        if (box === pd.o.report.code.box) {
            if (pd.test.filled.code === true) {
                step = 1;
            }
            finale = 19.8;
        }
        if (box === pd.o.report.stat.box) {
            if (pd.test.filled.stat === true) {
                step = 1;
            }
            finale = 0.8;
        }
        e = e || window.event;
        if (typeof e.preventDefault === "function") {
            e.preventDefault();
        }
        //shrink
        if (x.innerHTML === "\u035f") {
            if (buttonMax.innerHTML === "\u2191") {
                pd.settings[id].top    = box.offsetTop;
                pd.settings[id].left   = box.offsetLeft;
                pd.settings[id].height = body.clientHeight;
                pd.settings[id].width  = body.clientWidth;
                if (pd.zIndex > 2) {
                    pd.zIndex           -= 3;
                    parent.style.zIndex = pd.zIndex;
                }
            } else {
                buttonMax.innerHTML    = "\u2191";
                pd.settings[id].top    += 1;
                pd.settings[id].left   -= 7;
                pd.settings[id].height += 35.5;
                pd.settings[id].width  += 3;
            }
            pd.settings[id].max           = false;
            buttonMin.innerHTML           = "\u2191";
            box.style.borderWidth         = "0em";
            box.style.top                 = "auto";
            box.style.zIndex              = "2";
            parent.style.display          = "none";
            heading.style.borderLeftStyle = "solid";
            heading.style.borderTopStyle  = "solid";
            heading.style.cursor          = "pointer";
            heading.style.margin          = "0em 0em -3.2em 0.1em";
            shrinkage();
            x.innerHTML = "\u2191";

            //grow
        } else {
            pd.top(box);
            buttonMin.innerHTML           = "\u2191";
            parent.style.display          = "block";
            box.style.borderWidth         = ".1em";
            box.style.right               = "auto";
            body.style.display            = "block";
            heading.style.cursor          = "move";
            heading.style.borderLeftStyle = "none";
            heading.style.borderTopStyle  = "none";
            heading.style.margin          = "0.1em 1.7em -3.2em 0.1em";
            growth();
            x.innerHTML = "\u035f";
        }
        return false;
    };

    //maximize report window to available browser window
    pd.maximize            = function dom__maximize(node) {
        var x       = node || this,
            parent  = {},
            save    = false,
            box     = {},
            id      = "",
            heading = {},
            body    = {},
            top     = (document.body.parentNode.scrollTop > document.body.scrollTop) ? document.body.parentNode.scrollTop : document.body.scrollTop,
            left    = (document.body.parentNode.scrollLeft > document.body.scrollLeft) ? document.body.parentNode.scrollLeft : document.body.scrollLeft,
            buttons = [],
            resize  = {};
        pd.top(box);
        if (x.nodeType !== 1) {
            return;
        }
        buttons = x.parentNode.getElementsByTagName("button");
        resize  = buttons[buttons.length - 1];
        parent  = x.parentNode;
        save    = (parent.innerHTML.indexOf("save") > -1) ? true : false;
        box     = parent.parentNode;
        id      = box.getAttribute("id");
        heading = box.getElementsByTagName("h3")[0];
        body    = box.getElementsByTagName("div")[0];

        //maximize
        if (x.innerHTML === "\u2191") {
            x.innerHTML = "\u2193";
            x.setAttribute("title", "Return this dialogue to its prior size and location.");
            pd.settings[id].max = true;
            pd.settings[id].min = false;
            if (pd.test.ls === true && pd.test.json === true) {
                localStorage.settings = JSON.stringify(pd.settings);
            }
            pd.settings[id].top    = box.offsetTop;
            pd.settings[id].left   = box.offsetLeft;
            pd.settings[id].height = body.clientHeight - 36;
            pd.settings[id].width  = body.clientWidth - 3;
            pd.settings[id].zindex = box.style.zIndex;
            box.style.top          = (top / 10) + "em";
            box.style.left         = (left / 10) + "em";
            if (typeof window.innerHeight === "number") {
                body.style.height = ((window.innerHeight / 10) - 5.5) + "em";
                if (save === true) {
                    heading.style.width = ((window.innerWidth / 10) - 13.76) + "em";
                } else {
                    heading.style.width = ((window.innerWidth / 10) - 10.76) + "em";
                }
                body.style.width = ((window.innerWidth / 10) - 4.1) + "em";
            }
            resize.style.display = "none";

            //return to normal size
        } else {
            pd.settings[id].max = false;
            x.innerHTML         = "\u2191";
            x.setAttribute("title", "Maximize this dialogue to the browser window.");
            box.style.top  = (pd.settings[id].top / 10) + "em";
            box.style.left = (pd.settings[id].left / 10) + "em";
            if (save === true) {
                heading.style.width = ((pd.settings[id].width / 10) - 9.76) + "em";
            } else {
                heading.style.width = ((pd.settings[id].width / 10) - 6.76) + "em";
            }
            body.style.width     = (pd.settings[id].width / 10) + "em";
            body.style.height    = (pd.settings[id].height / 10) + "em";
            box.style.zIndex     = pd.settings[id].zindex;
            resize.style.display = "block";
            pd.options(box);
        }
    };

    //resize report window to custom width and height on drag
    pd.resize              = function dom__resize(e, x) {
        var parent     = x.parentNode,
            save       = (parent.innerHTML.indexOf("save") > -1) ? true : false,
            box        = parent.parentNode,
            body       = box.getElementsByTagName("div")[0],
            heading    = box.getElementsByTagName("h3")[0],
            bodyWidth  = body.clientWidth,
            bodyHeight = body.clientHeight,
            drop       = function dom__resize_drop() {
                document.onmousemove = null;
                bodyWidth            = body.clientWidth;
                bodyHeight           = body.clientHeight;
                pd.options(box);
                document.onmouseup = null;
            },
            boxsize    = function dom__resize_boxsize(f) {
                f                = f || window.event;
                body.style.width = ((bodyWidth + ((f.clientX - 4) - body.mouseX)) / 10) + "em";
                if (save === true) {
                    heading.style.width = (((bodyWidth + (f.clientX - body.mouseX)) / 10) - 10.15) + "em";
                } else {
                    heading.style.width = (((bodyWidth + (f.clientX - body.mouseX)) / 10) - 7.15) + "em";
                }
                body.style.height  = ((bodyHeight + ((f.clientY - 36) - body.mouseY)) / 10) + "em";
                document.onmouseup = drop;
            };
        pd.top(box);
        e                    = e || window.event;
        body.mouseX          = e.clientX;
        body.mouseY          = e.clientY;
        document.onmousemove = boxsize;
        document.onmousedown = null;
    };

    //toggle between parsed html diff report and raw text representation
    pd.save                = function dom__save(x) {
        var top        = (x.parentNode.nodeName.toLowerCase() === "a") ? x.parentNode.parentNode.parentNode : x.parentNode.parentNode,
            body       = top.getElementsByTagName("div")[0],
            bodyInner  = body.innerHTML.replace(/ xmlns\=("|')http:\/\/www\.w3\.org\/1999\/xhtml("|')/g, ""),
            build      = [],
            classQuote = "",
            content    = [],
            lastChild  = {},
            pageHeight = 0,
            diffstring = "var pd={};pd.colSliderProperties=[];(function(){var d=document.getElementsByTagName('ol'),cells=d[0].getElemensByTagName('li'),len=cells.length,a=0;pd.colSliderProperties=[d[0].clientWidth,d[1].clientWidth,d[2].parentNode.clientWidth,d[2].parentNode.parentNode.clientWidth,d[2].parentNode.offsetLeft-d[2].parentNode.parentNode.offsetLeft,];for(a=0;a<len;a+=1){if(cells[a].getAttribute('class')==='fold'){cells[a].onmousedown=pd.difffold;}}if(d.length>3){d[2].onmousedown=pd.colSliderGrab;d[2].ontouchstart=pd.colSliderGrab;}}());pd.difffold=function dom__difffold(){var a=0,b=0,self=this,title=self.getAttribute('title').split('line '),min=Number(title[1].substr(0,title[1].indexOf(' '))),max=Number(title[2]),inner=self.innerHTML,lists=[],parent=self.parentNode.parentNode,listnodes=(parent.getAttribute('class')==='diff')?parent.getElementsByTagName('ol'):parent.parentNode.getElementsByTagName('ol'),listLen=listnodes.length;for(a=0;a<listLen;a+=1){lists.push(listnodes[a].getElementsByTagName('li'));}for(a=0;a<min;a+=1){if(lists[0][a].getAttribute('class')==='empty'){min+=1;max+=1;}}max=(max>=lists[0].length)?lists[0].length:max;if(inner.charAt(0)==='-'){self.innerHTML='+'+inner.substr(1);for(a=min;a<max;a+=1){for(b=0;b<listLen;b+=1){lists[b][a].style.display='none';}}}else{self.innerHTML='-'+inner.substr(1);for(a=min;a<max;a+=1){for(b=0;b<listLen;b+=1){lists[b][a].style.display='block';}}}};pd.colSliderGrab=function dom__colSliderGrab(e){var event=e||window.event,touch=(e!==null&&e.type==='touchstart')?true:false,node=this,diffRight=node.parentNode,diff=diffRight.parentNode,subOffset=0,counter=pd.colSliderProperties[0],data=pd.colSliderProperties[1],width=pd.colSliderProperties[2],total=pd.colSliderProperties[3],offset=pd.colSliderProperties[4],min=0,max=data-1,status='ew',minAdjust=min+15,maxAdjust=max-15,withinRange=false,diffLeft=diffRight.previousSibling,drop=function dom__colSliderGrab_drop(f){f=f||window.event;f.preventDefault();node.style.cursor=status+'-resize';if(touch===true){document.ontouchmove=null;document.ontouchend=null;}else{document.onmousemove=null;document.onmouseup=null;}},boxmove=function dom__colSliderGrab_boxmove(f){f=f||window.event;f.preventDefault();if(touch===true){subOffset=offset-f.touches[0].clientX;}else{subOffset=offset-f.clientX;}if(subOffset>minAdjust&&subOffset<maxAdjust){withinRange=true;}if(withinRange===true&&subOffset>maxAdjust){diffRight.style.width=((total-counter-2)/10)+'em';status='e';}else if(withinRange===true&&subOffset<minAdjust){diffRight.style.width=(width/10)+'em';status='w';}else if(subOffset<max&&subOffset>min){diffRight.style.width=((width+subOffset)/10)+'em';status='ew';}if(touch===true){document.ontouchend=drop;}else{document.onmouseup=drop;}};event.preventDefault();if(typeof pd.o==='object'&&pd.o.report.code.box!==null){offset+=pd.o.report.code.box.offsetLeft;offset-=pd.o.report.code.body.scrollLeft;}else{subOffset=(document.body.parentNode.scrollLeft>document.body.scrollLeft)?document.body.parentNode.scrollLeft:document.body.scrollLeft;offset-=subOffset;}offset+=node.clientWidth;node.style.cursor='ew-resize';diff.style.width=(total/10)+'em';diff.style.display='inline-block';if(diffLeft.nodeType!==1){do{diffLeft=diffLeft.previousSibling;}while(diffLeft.nodeType!==1);}diffLeft.style.display='block';diffRight.style.width=(diffRight.clientWidth/10)+'em';diffRight.style.position='absolute';if(touch===true){document.ontouchmove=boxmove;document.ontouchstart=false;}else{document.onmousemove=boxmove;document.onmousedown=null;}};",
            beaustring = "pd.beaufold=function dom__beaufold(){var self=this,title=self.getAttribute('title').split('line '),min=Number(title[1].substr(0,title[1].indexOf(' '))),max=Number(title[2]),a=0,b='',list=[self.parentNode.getElementsByTagName('li'),self.parentNode.nextSibling.getElementsByTagName('li')];if(self.innerHTML.charAt(0)==='-'){for(a=min;a<max;a+=1){list[0][a].style.display='none';list[1][a].style.display='none';}self.innerHTML='+'+self.innerHTML.substr(1);}else{for(a=min;a<max;a+=1){list[0][a].style.display='block';list[1][a].style.display='block';if(list[0][a].getAttribute('class')==='fold'&&list[0][a].innerHTML.charAt(0)==='+'){b=list[0][a].getAttribute('title');b=b.substring(b.indexOf('to line ')+1);a=Number(b)-1;}}self.innerHTML='-'+self.innerHTML.substr(1);}};",
            span       = pd.$$("inline"),
            inline     = (span === null || span.checked === false) ? false : true,
            type       = "";
        if (bodyInner.innerHTML === "") {
            return;
        }
        if (inline === false) {
            type = document.getElementsByTagName("script")[0].getAttribute("type");
        }

        //added support for Firefox and Opera because they support long
        //URIs.  This extra support allows for local file creation.
        if (x.nodeName.toLowerCase() === "a" && x.getElementsByTagName("button")[0].innerHTML === "S") {
            if (bodyInner === "" || ((/Please try using the option labeled ((&lt;)|<)em((&gt;)|>)Plain Text \(diff only\)((&lt;)|<)\/em((&gt;)|>)\./).test(bodyInner) === true && (/div class\=("|')diff("|')/).test(bodyInner) === false)) {
                return false;
            }
            build.push("<?xml version='1.0' encoding='UTF-8' ?><!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'><html xmlns='http://www.w3.org/1999/xhtml' xml:lang='en'><head><title>Pretty Diff - The difference tool</title><meta name='robots' content='index, follow'/> <meta name='DC.title' content='Pretty Diff - The difference tool'/> <link rel='canonical' href='http://prettydiff.com/' type='application/xhtml+xml'/><meta http-equiv='Content-Type' content='application/xhtml+xml;charset=UTF-8'/><meta http-equiv='Content-Style-Type' content='text/css'/><style type='text/css'>" + pd.css.core + pd.css["s" + pd.color] + "</style></head><body class='" + pd.color + "' id='webtool'><h1><a href='http://prettydiff.com/'>Pretty Diff - The difference tool</a></h1><div id='doc'>");
            if (top === pd.o.report.code.box) {
                if (pd.mode === "diff") {
                    classQuote = (bodyInner.indexOf("<div class='diff'") > -1) ? "<div class='diff'" : "<div class=\"diff\"";
                } else if (pd.mode === "beau") {
                    classQuote = (bodyInner.indexOf("<div class='beautify'") > -1) ? "<div class='beautify'" : "<div class=\"beautify\"";
                }
                content = bodyInner.split(classQuote);
                build.push(content[0]);
                if (content.length === 2) {
                    build.push("<p>Accessibility note. &lt;em&gt; tags in the output represent character differences per lines compared.</p></div>");
                    build.push(classQuote);
                    build.push(content[1]);
                    if (pd.mode === "diff") {
                        build.push("<script type='");
                        build.push(type);
                        build.push("'><![CDATA[");
                        build.push(diffstring);
                        build.push("]]></script>");
                    } else if (pd.mode === "beau") {
                        build.push("<script type='");
                        build.push(type);
                        build.push("'><![CDATA[");
                        build.push(beaustring);
                        build.push("]]></script>");
                    }
                }
            }
            build.push("</body></html>");
            x.setAttribute("href", "data:text/prettydiff;charset=utf-8," + encodeURIComponent(build.join("")));
            x.onclick = function dom__save_rebind() {
                pd.save(this);
            };

            //prompt to save file created above.  below is the creation
            //of the modal with instructions about file extension.
            lastChild = pd.o.page.lastChild;
            if (lastChild.nodeType > 1 || lastChild.nodeName.toLowerCase() === "script") {
                do {
                    lastChild = lastChild.previousSibling;
                } while (lastChild.nodeType > 1 || lastChild.nodeName.toLowerCase() === "script");
            }
            pageHeight = lastChild.offsetTop + lastChild.clientHeight + 20;
            lastChild  = document.createElement("div");
            lastChild.setAttribute("onmousedown", "this.parentNode.removeChild(this)");
            lastChild.setAttribute("id", "modalSave");
            span              = document.createElement("span");
            span.style.width  = (pd.o.page.clientWidth + 10) + "px";
            span.style.height = pageHeight + "px";
            lastChild.appendChild(span);
            span           = document.createElement("p");
            span.innerHTML = "Just rename the file extension from '<strong>.part</strong>' to '<strong>.xhtml</strong>'. <em>Click anywhere to close this reminder.</em>";
            lastChild.appendChild(span);
            pd.o.page.appendChild(lastChild);
            span.style.left = (((pd.o.page.clientWidth + 10) - span.clientWidth) / 2) + "px";
            return;
        }
        //Webkit and IE get the old functionality of a textarea with
        //HTML text content to copy and paste into a text file.
        pd.top(top);
        if ((/Please try using the option labeled ((&lt;)|<)em((&gt;)|>)Plain Text \(diff only\)((&lt;)|<)\/em((&gt;)|>)\./).test(bodyInner) === true && (/div class\=("|')diff("|')/).test(bodyInner) === false) {
            pd.o.report.code.body.innerHTML = "<p><strong>Error:</strong> Please try using the option labeled <em>Plain Text (diff only)</em>. <span style='display:block'>The input does not appear to be markup, CSS, or JavaScript.</span></p>";
            return;
        }
        if (x.innerHTML === "S") {
            if (pd.mode === "diff") {
                pd.o.save.checked = true;
            }
            if (bodyInner !== "") {
                if (top === pd.o.report.code.box) {
                    if (pd.mode === "diff") {
                        classQuote = (bodyInner.indexOf("<div class='diff'") > -1) ? "<div class='diff'" : "<div class=\"diff\"";
                    } else if (pd.mode === "beau") {
                        classQuote = (bodyInner.indexOf("<div class='beautify'") > -1) ? "<div class='beautify'" : "<div class=\"beautify\"";
                    }
                    content    = bodyInner.split(classQuote);
                    classQuote = classQuote + content[1];
                    bodyInner  = content[0];
                    build.push(" <p>This is the generated output. Please copy the text output, paste into a text file, and save as a &quot;.html&quot; file.</p> <textarea rows='40' cols='80' id='textreport'>");
                    build.push("&lt;?xml version='1.0' encoding='UTF-8' ?&gt;&lt;!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'&gt;&lt;html xmlns='http://www.w3.org/1999/xhtml' xml:lang='en'&gt;&lt;head&gt;&lt;title&gt;Pretty Diff - The difference tool&lt;/title&gt;&lt;meta name='robots' content='index, follow'/&gt; &lt;meta name='DC.title' content='Pretty Diff - The difference tool'/&gt; &lt;link rel='canonical' href='http://prettydiff.com/' type='application/xhtml+xml'/&gt;&lt;meta http-equiv='Content-Type' content='application/xhtml+xml;charset=UTF-8'/&gt;&lt;meta http-equiv='Content-Style-Type' content='text/css'/&gt;&lt;style type='text/css'&gt;" + pd.css.core + pd.css["s" + pd.color] + "&lt;/style&gt;&lt;/head&gt;&lt;body class='" + pd.color + "' id='webtool'&gt;&lt;h1&gt;&lt;a href='http://prettydiff.com/'&gt;Pretty Diff - The difference tool&lt;/a&gt;&lt;/h1&gt;");
                    build.push(bodyInner.replace(/\&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;"));
                    if (content.length === 2) {
                        build.push(classQuote.replace(/\&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;"));
                        if (pd.mode === "diff") {
                            build.push("&lt;script type='");
                            build.push(type);
                            build.push("'&gt;&lt;![CDATA[");
                            build.push(diffstring.replace(/\&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;"));
                            build.push("]]&gt;&lt;/script&gt;");
                        } else if (pd.mode === "beau") {
                            build.push("&lt;script type='");
                            build.push(type);
                            build.push("'&gt;&lt;![CDATA[");
                            build.push(beaustring.replace(/\&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;"));
                            build.push("]]&gt;&lt;/script&gt;");
                        }
                    }
                }
                build.push("&lt;/body&gt;&lt;/html&gt;</textarea>");
            }
            x.innerHTML = "H";
            x.setAttribute("title", "Convert output to rendered HTML.");
            body.innerHTML = build.join("");
        } else {
            if (pd.mode === "diff") {
                pd.o.save.checked = false;
            }
            if (bodyInner !== "") {
                if (bodyInner.indexOf("<textarea") > -1) {
                    bodyInner  = bodyInner.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
                }
                if (pd.mode === "diff") {
                    classQuote = (bodyInner.indexOf("<div class='diff'") > -1) ? "<div class='diff'" : "<div class=\"diff\"";
                } else if (pd.mode === "beau") {
                    classQuote = (bodyInner.indexOf("<div class='beautify'") > -1) ? "<div class='beautify'" : "<div class=\"beautify\"";
                }
                content    = bodyInner.split(classQuote);
                if (content[0].indexOf("</h1>") > -1) {
                    build.push(content[0].split("</h1>")[1]);
                } else {
                    build.push(content[0]);
                }
                if (content.length > 1) {
                    if (content[1].indexOf("<script") > -1) {
                        content[1] = classQuote + (content[1].substring(0, content[1].indexOf("<script")));
                    } else if (content[1].indexOf("</body") > -1) {
                        content[1] = classQuote + (content[1].substring(0, content[1].indexOf("</body")));
                    } else {
                        content[1] = classQuote + content[1];
                    }
                    build.push(content[1]);
                }
            }
            x.innerHTML = "S";
            x.setAttribute("title", "Convert report to text that can be saved.");
            body.innerHTML = build.join("");
            content        = body.getElementsByTagName("ol");
            if (content.length > 0) {
                if (pd.mode === "diff") {
                    pd.colSliderProperties   = [
                        content[0].clientWidth, content[1].clientWidth, content[2].parentNode.clientWidth, content[2].parentNode.parentNode.clientWidth, content[2].parentNode.offsetLeft - content[2].parentNode.parentNode.offsetLeft
                    ];
                    content[2].onmousedown  = pd.colSliderGrab;
                    content[2].ontouchstart = pd.colSliderGrab;
                }
                content = content[0].getElementsByTagName("li");
                for (pageHeight = content.length - 1; pageHeight > -1; pageHeight -= 1) {
                    if (content[pageHeight].getAttribute("class") === "fold") {
                        if (pd.mode === "beau") {
                            content[pageHeight].onmousedown = pd.beaufold;
                        } else if (pd.mode === "diff") {
                            content[pageHeight].onmousedown = pd.difffold;
                        }
                    }
                }
            }
        }
        pd.options(x.parentNode);
    };

    //basic drag and drop for the report windows
    pd.grab                = function dom__grab(e, x) {
        var box        = x.parentNode,
            parent     = box.getElementsByTagName("p")[0],
            save       = (parent.innerHTML.indexOf("save") > -1) ? true : false,
            minifyTest = (parent.style.display === "none") ? true : false,
            minButton  = (save === true) ? box.getElementsByTagName("button")[1] : box.getElementsByTagName("button")[0],
            body       = box.getElementsByTagName("div")[0],
            heading    = (box.firstChild.nodeType > 1) ? box.firstChild.nextSibling : box.firstChild,
            boxLeft    = box.offsetLeft,
            boxTop     = box.offsetTop,
            touchXNow  = 0,
            touchYNow  = 0,
            event      = e || window.event,
            touch      = (e !== null && e.type === "touchstart") ? true : false,
            filled     = ((box === pd.o.report.stat.box && pd.test.filled.stat === true) || (box === pd.o.report.feed.box && pd.test.filled.feed === true) || (box === pd.o.report.code.box && pd.test.filled.code === true)) ? true : false,
            max        = document.getElementsByTagName("body")[0].clientHeight,
            drop       = function dom__grab_drop() {
                var headingWidth = box.getElementsByTagName("h3")[0].clientWidth;
                boxLeft = box.offsetLeft;
                boxTop  = box.offsetTop;
                if (touch === true) {
                    document.ontouchmove = null;
                    document.ontouchend  = null;
                } else {
                    document.onmousemove = null;
                    document.onmouseup   = null;
                }
                if (boxTop < 10) {
                    box.style.top = "1em";
                } else if (boxTop > (max - 40)) {
                    box.style.top = ((max / 10) - 4) + "em";
                } else {
                    box.style.top = (boxTop / 10) + "em";
                }
                if (boxLeft < ((headingWidth * -1) + 40)) {
                    box.style.left = (((headingWidth * -1) + 40) / 10) + "em";
                }
                body.style.opacity = "1";
                box.style.height   = "auto";
                heading.style.top  = "100%";
                pd.options(box);
                return false;
            },
            boxmove    = function dom__grab_boxmove(f) {
                f = f || window.event;
                f.preventDefault();
                box.style.right = "auto";
                if (touch === true) {
                    box.style.left      = ((boxLeft + (f.touches[0].clientX - touchXNow)) / 10) + "em";
                    box.style.top       = ((boxTop + (f.touches[0].clientY - touchYNow)) / 10) + "em";
                    document.ontouchend = drop;
                } else {
                    box.style.left     = ((boxLeft + (f.clientX - box.mouseX)) / 10) + "em";
                    box.style.top      = ((boxTop + (f.clientY - box.mouseY)) / 10) + "em";
                    document.onmouseup = drop;
                }
                return false;
            };
        e = e || window.event;
        if (minifyTest === true) {
            if (save === true) {
                minButton = box.getElementsByTagName("button")[1];
            } else {
                minButton = box.getElementsByTagName("button")[0];
            }
            if (filled === true) {
                box.style.right = "auto";
            } else {
                box.style.left = "auto";
            }
            pd.minimize(e, 50, minButton);
            return false;
        }
        pd.top(box);
        if (e.preventDefault !== undefined) {
            e.preventDefault();
        }
        if (body.nodeType !== 1) {
            do {
                body = body.previousSibling;
            } while (body.nodeType !== 1);
        }
        if (heading.nodeType !== 1) {
            do {
                heading = heading.nextSibling;
            } while (heading.nodeType !== 1);
        }
        heading = heading.lastChild;
        if (heading.nodeType !== 1) {
            do {
                heading = heading.previousSibling;
            } while (heading.nodeType !== 1);
        }
        body.style.opacity = ".5";
        heading.style.top  = (box.clientHeight / 20) + "0em";
        box.style.height   = ".1em";
        box.mouseX         = e.clientX;
        box.mouseY         = e.clientY;
        if (touch === true) {
            touchXNow             = e.touches[0].clientX;
            touchYNow             = e.touches[0].clientY;
            document.ontouchmove  = boxmove;
            document.ontouchstart = null;
        } else {
            document.onmousemove = boxmove;
            document.onmousedown = null;
        }
        pd.options(box);
        return false;
    };

    pd.feedsubmit          = function dom__feedsubmit(auto) {
        var datapack  = {},
            namecheck = (localStorage.settings !== undefined) ? JSON.parse(localStorage.settings) : {},
            radios    = [],
            text      = (pd.$$("feedtextarea") === null) ? "" : pd.$$("feedtextarea").value,
            a         = 0,
            email     = (pd.$$("feedemail") === null) ? "" : pd.$$("feedemail").value,
            xhr       = {},
            sendit    = function dom__feedsubmit_sendit() {
                var node = pd.$$("feedintro");
                xhr.withCredentials = true;
                xhr.open("POST", "http://prettydiff.com:8000/feedback/", true);
                xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
                xhr.send(JSON.stringify(datapack));
                pd.o.report.feed.box.getElementsByTagName("button")[0].click();
                if (node !== null) {
                    node.innerHTML = "Please feel free to submit feedback about Pretty Diff at any time by answering the following questions.";
                }
            };
        if (pd.test.xhr === false || pd.test.json === false) {
            return;
        }
        xhr = (typeof XMLHttpRequest === "function" || typeof XMLHttpRequest === "object") ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
        if (auto === true) {
            datapack = {
                name    : pd.settings.knownname,
                settings: pd.settings,
                stats   : pd.stat,
                type    : "auto"
            };
            sendit();
            return;
        }
        if (pd.$$("feedradio1") === null || namecheck.knownname !== pd.settings.knownname) {
            return;
        }
        radios = pd.$$("feedradio1").parentNode.parentNode.getElementsByTagName("input");
        for (a = radios.length - 1; a > -1; a -= 1) {
            if (radios[a].checked === true) {
                break;
            }
        }
        if (a < 0) {
            return;
        }
        datapack = {
            comment : text,
            email   : email,
            name    : pd.settings.knownname,
            rating  : a + 1,
            settings: pd.settings,
            stats   : pd.stat,
            type    : "feedback"
        };
        sendit();
    };

    //toggle between tool modes and vertical/horizontal orientation of
    //textareas
    pd.prettyvis           = function dom__prettyvis(x) {
        var a           = {},
            b           = 0,
            lang        = (pd.o.lang === null) ? "javascript" : ((pd.o.lang.nodeName === "select") ? pd.o.lang[pd.o.lang.selectedIndex].value : pd.o.lang.value),
            langOps     = [],
            node        = {},
            storage     = "",
            langtest    = (pd.o.lang !== null && pd.o.lang.nodeName.toLowerCase() === "select") ? true : false,
            optioncheck = function dom__prettyvis_optioncheck() {
                var c     = 0,
                    langs = [];
                langs = pd.o.lang.getElementsByTagName("option");
                for (c = langs.length - 1; c > -1; c -= 1) {
                    if (langs[c].value === "text") {
                        if (pd.o.lang.selectedIndex === c) {
                            pd.o.lang.selectedIndex = 0;
                        }
                        langs[c].disabled = true;
                    }
                }
            };
        if (x.nodeType === 1) {
            if (x.nodeName.toLowerCase() === "input") {
                a = x;
            } else {
                a = x.getElementsByTagName("input")[0];
            }
        } else if (this.nodeName.toLowerCase() === "input") {
            a = this;
        } else {
            a = this.getElementsByTagName("input")[0];
        }
        node = pd.$$("showOptionsCallOut");
        if (node !== null) {
            node.parentNode.removeChild(node);
        }
        if (a === pd.o.modeBeau) {
            pd.mode = "beau";
            if (langtest === true) {
                optioncheck();
            }
            if (pd.o.codeBeauIn !== null) {
                if (pd.o.codeBeauIn.value === "" && pd.o.codeMinnIn !== null && pd.o.codeMinnIn.value !== "") {
                    pd.o.codeBeauIn.value = pd.o.codeMinnIn.value;
                } else if (pd.o.codeBeauIn.value === "" && pd.o.codeBeauOut !== null && pd.o.codeBeauOut.value !== "") {
                    pd.o.codeBeauIn.value = pd.o.codeBeauOut.value;
                }
            }
            if (pd.o.beau !== null) {
                pd.o.beau.style.display = "block";
            }
            if (pd.o.minn !== null) {
                pd.o.minn.style.display = "none";
            }
            if (pd.o.diffBase !== null) {
                pd.o.diffBase.style.display = "none";
            }
            if (pd.o.diffNew !== null) {
                pd.o.diffNew.style.display = "none";
            }
            if (pd.o.diffOps !== null) {
                pd.o.diffOps.style.display = "none";
            }
            if (pd.o.minnOps !== null) {
                pd.o.minnOps.style.display = "none";
            }
            if (lang === "csv" && pd.o.beauOps !== null) {
                pd.o.beauOps.style.display = "none";
            } else if (pd.o.beauOps !== null) {
                pd.o.beauOps.style.display = "block";
            }
            if (pd.test.render.beau === false) {
                lang = "";
                if (pd.o.codeBeauIn !== null) {
                    if (pd.test.ls === true && localStorage.codeBeautify !== undefined) {
                        storage = localStorage.codeBeautify;
                        if ((/^(\s+)$/).test(storage) === true) {
                            storage = "";
                        }
                        if (pd.test.cm === true) {
                            if (langtest === true && lang === "auto") {
                                lang = pd.auto(storage);
                                if (lang === "html") {
                                    lang = "htmlembedded";
                                } else if (lang === "css") {
                                    lang = "text/x-scss";
                                } else if (lang === "markup") {
                                    lang = "xml";
                                }
                                pd.cm.beauIn.setOption("mode", lang);
                            }
                            pd.cm.beauIn.setValue(storage);
                        } else {
                            pd.o.codeBeauIn.value = storage;
                        }
                    } else if (pd.test.cm === true) {
                        pd.cm.beauIn.setValue(" ");
                    }
                }
                if (pd.test.cm === true && pd.o.codeBeauOut !== null) {
                    if (langtest === true && lang === "auto") {
                        if (lang === "" && pd.test.ls === true && localStorage.codeBeautify !== undefined) {
                            lang = pd.auto(localStorage.codeBeautify);
                            if (lang === "html") {
                                lang = "htmlembedded";
                            } else if (lang === "css") {
                                lang = "text/x-scss";
                            } else if (lang === "markup") {
                                lang = "xml";
                            }
                        }
                        if (lang !== "") {
                            pd.cm.beauOut.setOption("mode", lang);
                        }
                    }
                    pd.cm.beauOut.setValue(" ");
                }
            }
            if (pd.test.load === false && pd.o.jsscope.checked === true) {
                pd.hideBeauOut(pd.o.jsscope);
            }
            pd.test.render.beau = true;
        }
        if (a === pd.o.modeMinn) {
            pd.mode = "minn";
            if (langtest === true) {
                optioncheck();
            }
            if (pd.o.codeMinnIn !== null) {
                if (pd.o.codeMinnIn.value === "" && pd.o.codeBeauIn !== null && pd.o.codeBeauIn.value !== "") {
                    pd.o.codeMinnIn.value = pd.o.codeBeauIn.value;
                } else if (pd.o.codeMinnIn.value === "" && pd.o.codeBeauOut !== null && pd.o.codeBeauOut.value !== "") {
                    pd.o.codeMinnIn.value = pd.o.codeBeauOut.value;
                }
            }
            if (pd.o.minnOps !== null) {
                if (lang === "text" || lang === "csv") {
                    pd.o.minnOps.style.display = "none";
                } else {
                    pd.o.minnOps.style.display = "block";
                }
            }
            if (pd.o.minn !== null) {
                pd.o.minn.style.display = "block";
            }
            if (pd.o.beau !== null) {
                pd.o.beau.style.display = "none";
            }
            if (pd.o.diffBase !== null) {
                pd.o.diffBase.style.display = "none";
            }
            if (pd.o.diffNew !== null) {
                pd.o.diffNew.style.display = "none";
            }
            if (pd.o.diffOps !== null) {
                pd.o.diffOps.style.display = "none";
            }
            if (pd.o.beauOps !== null) {
                pd.o.beauOps.style.display = "none";
            }
            if (pd.test.render.minn === false) {
                lang = "";
                if (pd.o.codeMinnIn !== null) {
                    if (pd.test.ls === true && localStorage.codeMinify !== undefined) {
                        storage = localStorage.codeMinify;
                        if ((/^(\s+)$/).test(storage) === true) {
                            storage = "";
                        }
                        if (pd.test.cm === true) {
                            if (langtest === true && lang === "auto") {
                                lang = pd.auto(storage);
                                if (lang === "html") {
                                    lang = "htmlembedded";
                                } else if (lang === "css") {
                                    lang = "text/x-scss";
                                } else if (lang === "markup") {
                                    lang = "xml";
                                }
                                pd.cm.minnIn.setOption("mode", lang);
                            }
                            pd.cm.minnIn.setValue(storage);
                        } else {
                            pd.o.codeMinnIn.value = storage;
                        }
                    } else if (pd.test.cm === true) {
                        pd.cm.minnIn.setValue(" ");
                    }
                }
                if (pd.test.cm === true && pd.o.codeMinnOut !== null) {
                    if (langtest === true && lang === "auto") {
                        if (lang === "" && pd.test.ls === true && localStorage.codeMinify !== undefined) {
                            lang = pd.auto(localStorage.codeMinify);
                            if (lang === "html") {
                                lang = "htmlembedded";
                            } else if (lang === "css") {
                                lang = "text/x-scss";
                            } else if (lang === "markup") {
                                lang = "xml";
                            }
                        }
                        if (lang !== "") {
                            pd.cm.minnOut.setOption("mode", lang);
                        }
                    }
                    pd.cm.minnOut.setValue(" ");
                }
            }
            pd.test.render.minn = true;
        }
        if (a === pd.o.modeDiff) {
            pd.mode = "diff";
            if (langtest === true) {
                langOps = pd.o.lang.getElementsByTagName("option");
                for (b = langOps.length - 1; b > -1; b -= 1) {
                    langOps[b].disabled = false;
                }
            }
            if (pd.o.codeBeauOut !== null) {
                if (pd.o.codeBeauOut.value === "" && pd.o.codeBeauIn !== null && pd.o.codeBeauIn.value !== "") {
                    pd.o.codeBeauOut.value = pd.o.codeBeauIn.value;
                } else if (pd.o.codeBeauOut.value === "" && pd.o.codeMinnIn !== null && pd.o.codeMinnIn.value !== "") {
                    pd.o.codeBeauOut.value = pd.o.codeMinnIn.value;
                }
            }
            if (pd.o.diffBase !== null) {
                pd.o.diffBase.style.display = "block";
            }
            if (pd.o.diffNew !== null) {
                pd.o.diffNew.style.display = "block";
            }
            if (pd.o.beau !== null) {
                pd.o.beau.style.display = "none";
            }
            if (pd.o.minn !== null) {
                pd.o.minn.style.display = "none";
            }
            if (pd.o.diffOps !== null) {
                pd.o.diffOps.style.display = "block";
            }
            if (pd.o.beauOps !== null) {
                pd.o.beauOps.style.display = "none";
            }
            if (pd.o.minnOps !== null) {
                pd.o.minnOps.style.display = "none";
            }
            if (lang === "csv" || lang === "text") {
                node = pd.$$("diffquanp");
                if (node !== null) {
                    node.style.display = "none";
                }
                node = pd.$$("difftypep");
                if (node !== null) {
                    node.style.display = "none";
                }
                node = pd.$$("diffbeautify");
                if (node !== null) {
                    node.style.display = "none";
                }
            } else {
                node = pd.$$("diffquanp");
                if (node !== null) {
                    node.style.display = "block";
                }
                node = pd.$$("difftypep");
                if (node !== null) {
                    node.style.display = "block";
                }
                node = pd.$$("diffbeautify");
                if (node !== null) {
                    node.style.display = "block";
                }
            }
            if (pd.test.render.diff === false && pd.mode === "diff") {
                if (pd.o.codeDiffBase !== null) {
                    if (pd.test.ls === true && localStorage.codeDiffBase !== undefined) {
                        storage = localStorage.codeDiffBase;
                        if ((/^(\s+)$/).test(storage) === true) {
                            storage = "";
                        }
                        if (pd.test.cm === true) {
                            if (langtest === true && lang === "auto") {
                                lang = pd.auto(storage);
                                if (lang === "htmlembedded") {
                                    lang = "htmlembedded";
                                } else if (lang === "css") {
                                    lang = "text/x-scss";
                                } else if (lang === "markup") {
                                    lang = "xml";
                                }
                                pd.cm.diffBase.setOption("mode", lang);
                            }
                            pd.cm.diffBase.setValue(storage);
                        } else {
                            pd.o.codeDiffBase.value = storage;
                        }
                    } else if (pd.test.cm === true) {
                        pd.cm.diffBase.setValue(" ");
                    }
                }
                if (pd.o.codeDiffNew !== null) {
                    if (pd.test.ls === true && localStorage.codeDiffNew !== undefined) {
                        storage = localStorage.codeDiffNew;
                        if ((/^(\s+)$/).test(storage) === true) {
                            storage = "";
                        }
                        if (pd.test.cm === true) {
                            if (langtest === true && lang === "auto") {
                                lang = pd.auto(storage);
                                if (lang === "html") {
                                    lang = "htmlembedded";
                                } else if (lang === "css") {
                                    lang = "text/x-scss";
                                } else if (lang === "markup") {
                                    lang = "xml";
                                }
                                pd.cm.diffNew.setOption("mode", lang);
                            }
                            pd.cm.diffNew.setValue(storage);
                        } else {
                            pd.o.codeDiffNew.value = storage;
                        }
                    } else if (pd.test.cm === true) {
                        pd.cm.diffNew.setValue(" ");
                    }
                }
                pd.test.render.diff = true;
            }
        }
        if (pd.o.announce !== null && (a === pd.o.modeBeau || a === pd.o.modeMinn || a === pd.o.modeDiff)) {
            pd.o.announce.innerHTML = "";
        }
        if (a.nodeType === undefined) {
            return;
        }
        pd.options(a);
    };

    //alters available options depending upon language selection
    pd.codeOps             = function dom__codeOps(node) {
        var x    = {},
            lang = "",
            xml  = false,
            dqp  = pd.$$("diffquanp"),
            dqt  = pd.$$("difftypep"),
            db   = pd.$$("diffbeautify"),
            csvp = pd.$$("csvcharp"),
            hd   = pd.$$("htmld-yes"),
            he   = pd.$$("htmld-no"),
            hm   = pd.$$("htmlm-yes"),
            hn   = pd.$$("htmlm-no"),
            hy   = pd.$$("html-yes"),
            hz   = pd.$$("html-no");
        if (node.nodeType === 1) {
            if (node.nodeName.toLowerCase() === "input" || node.nodeName.toLowerCase() === "select") {
                x = node;
            } else {
                x = node.getElementsByTagName("input")[0];
            }
        } else if (this.nodeName.toLowerCase() === "input" || this.nodeName.toLowerCase() === "select") {
            x = this;
        } else {
            x = this.getElementsByTagName("input")[0];
        }
        xml  = (x.getElementsByTagName("option")[x.selectedIndex].innerHTML === "XML" || x.getElementsByTagName("option")[x.selectedIndex].innerHTML === "JSTL") ? true : false;
        lang = (pd.o.lang === null) ? "javascript" : (pd.o.lang.nodeName === "select") ? pd.o.lang[pd.o.lang.selectedIndex].value : pd.o.lang.value;
        if (pd.o.modeDiff !== null && pd.o.modeDiff.checked === true) {
            if (pd.o.minnOps !== null) {
                pd.o.minnOps.style.display = "none";
            }
            if (pd.o.beauOps !== null) {
                pd.o.beauOps.style.display = "none";
            }
            if (lang === "text" || lang === "csv") {
                if (dqp !== null) {
                    dqp.style.display = "none";
                }
                if (dqt !== null) {
                    dqt.style.display = "none";
                }
            } else {
                if (dqp !== null) {
                    dqp.style.display = "block";
                }
                if (dqt !== null) {
                    dqt.style.display = "block";
                }
            }
        } else if (pd.o.modeBeau !== null && pd.o.modeBeau.checked === true) {
            if (pd.o.minnOps !== null) {
                pd.o.minnOps.style.display = "none";
            }
            if (pd.o.diffOps !== null) {
                pd.o.diffOps.style.display = "none";
            }
            if (pd.o.beauOps !== null) {
                if (lang === "csv") {
                    pd.o.beauOps.style.display = "none";
                } else {
                    pd.o.beauOps.style.display = "block";
                }
            }
        } else if (pd.o.modeMinn !== null && pd.o.modeMinn.checked === true) {
            if (pd.o.beauOps !== null) {
                pd.o.beauOps.style.display = "none";
            }
            if (pd.o.diffOps !== null) {
                pd.o.diffOps.style.display = "none";
            }
            if (pd.o.minnOps !== null) {
                if (lang === "csv") {
                    pd.o.minnOps.style.display = "none";
                } else {
                    pd.o.minnOps.style.display = "block";
                }
            }
        }
        if (csvp !== null) {
            if (lang === "csv") {
                csvp.style.display = "block";
            } else {
                csvp.style.display = "none";
            }
        }
        if (db !== null) {
            if (lang === "csv" || lang === "text") {
                db.style.display = "none";
            } else {
                db.style.display = "block";
            }
        }
        if (lang === "html") {
            if (hd !== null) {
                hd.checked = true;
            }
            if (hm !== null) {
                hm.checked = true;
            }
            if (hy !== null) {
                hy.checked = true;
            }
        } else if (xml === true) {
            if (he !== null) {
                he.checked = true;
            }
            if (hn !== null) {
                hn.checked = true;
            }
            if (hz !== null) {
                hz.checked = true;
            }
        } else {
            if (pd.settings.presumehtmld === "htmld-no" && he !== null) {
                he.checked = true;
            }
            if (pd.settings.presumehtmlm === "htmlm-no" && hn !== null) {
                hn.checked = true;
            }
            if (pd.settings.presumehtml === "html-no" && hz !== null) {
                hz.checked = true;
            }
            if (pd.settings.presumehtmld === "htmld-yes" && hd !== null) {
                hd.checked = true;
            }
            if (pd.settings.presumehtmlm === "htmlm-yes" && hm !== null) {
                hm.checked = true;
            }
            if (pd.settings.presumehtml === "html-yes" && hy !== null) {
                hy.checked = true;
            }
        }
        if (x === pd.o.lang) {
            if (pd.o.langdefault !== null) {
                if (lang === "auto") {
                    pd.o.langdefault.parentNode.style.display = "block";
                    pd.o.langdefault.disabled                 = false;
                } else {
                    pd.o.langdefault.parentNode.style.display = "none";
                }
            }
            if (pd.test.cm === true) {
                if (lang === "auto") {
                    if (pd.mode === "diff") {
                        lang = pd.auto(pd.cm.diffBase.getValue());
                    }
                    if (pd.mode === "beau") {
                        lang = pd.auto(pd.cm.beauIn.getValue());
                    }
                    if (pd.mode === "minn") {
                        lang = pd.auto(pd.cm.minnIn.getValue());
                    }
                }
                if (lang === "javascript") {
                    pd.cm.diffBase.setOption("mode", "javascript");
                    pd.cm.diffNew.setOption("mode", "javascript");
                    pd.cm.beauIn.setOption("mode", "javascript");
                    pd.cm.beauOut.setOption("mode", "javascript");
                    pd.cm.minnIn.setOption("mode", "javascript");
                    pd.cm.minnOut.setOption("mode", "javascript");
                } else if (lang === "html") {
                    pd.cm.diffBase.setOption("mode", "htmlembedded");
                    pd.cm.diffNew.setOption("mode", "htmlembedded");
                    pd.cm.beauIn.setOption("mode", "htmlembedded");
                    pd.cm.beauOut.setOption("mode", "htmlembedded");
                    pd.cm.minnIn.setOption("mode", "htmlembedded");
                    pd.cm.minnOut.setOption("mode", "htmlembedded");
                } else if (lang === "css") {
                    pd.cm.diffBase.setOption("mode", "text/x-scss");
                    pd.cm.diffNew.setOption("mode", "text/x-scss");
                    pd.cm.beauIn.setOption("mode", "text/x-scss");
                    pd.cm.beauOut.setOption("mode", "text/x-scss");
                    pd.cm.minnIn.setOption("mode", "text/x-scss");
                    pd.cm.minnOut.setOption("mode", "text/x-scss");
                } else if (lang === "markup") {
                    pd.cm.diffBase.setOption("mode", "xml");
                    pd.cm.diffNew.setOption("mode", "xml");
                    pd.cm.beauIn.setOption("mode", "xml");
                    pd.cm.beauOut.setOption("mode", "xml");
                    pd.cm.minnIn.setOption("mode", "xml");
                    pd.cm.minnOut.setOption("mode", "xml");
                } else if (lang === "text") {
                    pd.cm.diffBase.setOption("mode", null);
                    pd.cm.diffNew.setOption("mode", null);
                    pd.cm.beauIn.setOption("mode", null);
                    pd.cm.beauOut.setOption("mode", null);
                    pd.cm.minnIn.setOption("mode", null);
                    pd.cm.minnOut.setOption("mode", null);
                } else {
                    pd.cm.diffBase.setOption("mode", lang);
                    pd.cm.diffNew.setOption("mode", lang);
                    pd.cm.beauIn.setOption("mode", lang);
                    pd.cm.beauOut.setOption("mode", lang);
                    pd.cm.minnIn.setOption("mode", lang);
                    pd.cm.minnOut.setOption("mode", lang);
                }
            }
            if (pd.test.load === false) {
                pd.hideBeauOut(x);
            }
        }
        pd.options(x);
    };

    pd.hideBeauOut         = function dom__hideBeauOut(x) {
        var node    = {},
            state   = false,
            restore = function dom__hideBeauOut_restore() {
                pd.o.codeBeauOut.parentNode.style.display = "block";
                if (pd.o.codeBeauIn !== null) {
                    node                                   = pd.o.codeBeauIn.parentNode;
                    pd.o.codeBeauIn.onkeyup                = pd.recycle;
                    pd.o.codeBeauIn.parentNode.style.width = "49%";
                    pd.o.codeBeauIn.onkeydown              = function dom_hideBeauOut_bindBeauInDown(e) {
                        var event = e || window.event;
                        if (pd.test.cm === false) {
                            pd.fixtabs(event, pd.o.codeBeauIn);
                        }
                        pd.keydown(event);
                    };
                }
                if (x === undefined) {
                    return;
                }
                pd.options(x);
            };
        if (x.nodeType === 1 && x.nodeName.toLowerCase() !== "input") {
            x = x.getElementsByTagName("input")[0];
        }
        state = (x === pd.o.jsscope) ? true : false;
        if (pd.o.codeBeauOut === null) {
            return;
        }
        if (pd.o.lang === null || pd.o.lang.value === "auto" || pd.o.lang.value === "javascript") {
            if (state === true) {
                pd.o.codeBeauOut.parentNode.style.display = "none";
                if (pd.o.codeBeauIn !== null) {
                    node             = pd.o.codeBeauIn.parentNode;
                    node.style.width = "100%";
                    if (pd.test.cm === true) {
                        pd.o.codeBeauIn.onkeyup = function dom__hideBeauOut_langkey() {
                            pd.langkey(pd.cm.beauIn);
                        };
                    }
                }
                pd.options(x);
            } else {
                restore();
            }
        } else {
            restore();
        }
    };

    //provides interaction to simulate a text input into a radio button
    //set with appropriate accessibility response
    pd.indentchar          = function dom__indentchar(x) {
        var node      = {},
            beauChar  = pd.$$("beau-char"),
            diffChar  = pd.$$("diff-char"),
            beauOther = pd.$$("beau-other"),
            diffOther = pd.$$("diff-other");
        if (x.nodeType === 1) {
            if (x.nodeName.toLowerCase() === "input") {
                node = x;
            } else {
                node = x.getElementsByTagName("input")[0];
            }
        } else if (this.nodeName.toLowerCase() === "input") {
            node = this;
        } else {
            node = this.getElementsByTagName("input")[0];
        }
        if (pd.mode === "beau" && beauOther !== null && beauChar !== null) {
            if (node === beauOther || node === beauChar) {
                beauOther.checked = true;
                beauChar.setAttribute("class", "checked");
                if (beauChar.value === "Click me for custom input") {
                    beauChar.value = "";
                }
            } else {
                beauOther.checked = false;
                beauChar.setAttribute("class", "unchecked");
                if (beauChar.value === "") {
                    beauChar.value = "Click me for custom input";
                }
            }
        } else if (pd.mode === "diff" && diffOther !== null && diffChar !== null) {
            if (node === diffOther) {
                diffOther.checked = true;
                diffChar.setAttribute("class", "checked");
                if (diffChar.value === "Click me for custom input") {
                    diffChar.value = "";
                }
            } else {
                diffOther.checked = false;
                diffChar.setAttribute("class", "unchecked");
                if (diffChar.value === "") {
                    diffChar.value = "Click me for custom input";
                }
            }
        }
        if (pd.test.cm === true) {
            if (pd.mode === "diff") {
                if (node === pd.$$("diff-tab")) {
                    pd.cm.diffBase.setOption("indentWithTabs", true);
                    pd.cm.diffNew.setOption("indentWithTabs", true);
                } else {
                    pd.cm.diffBase.setOption("indentWithTabs", false);
                    pd.cm.diffNew.setOption("indentWithTabs", false);
                }
            }
            if (pd.mode === "beau") {
                if (node === pd.$$("beau-tab")) {
                    pd.cm.beauIn.setOption("indentWithTabs", true);
                    pd.cm.beauOut.setOption("indentWithTabs", true);
                } else {
                    pd.cm.beauIn.setOption("indentWithTabs", false);
                    pd.cm.beauOut.setOption("indentWithTabs", false);
                }
            }
            if (pd.mode === "minn") {
                if (node === pd.$$("minn-tab")) {
                    pd.cm.beauIn.setOption("indentWithTabs", true);
                    pd.cm.beauOut.setOption("indentWithTabs", true);
                } else {
                    pd.cm.beauIn.setOption("indentWithTabs", false);
                    pd.cm.beauOut.setOption("indentWithTabs", false);
                }
            }
        }
        if (node === beauChar && beauOther !== null) {
            pd.options(beauOther);
        } else if (node === diffChar && diffOther !== null) {
            pd.options(diffOther);
        } else {
            pd.options(node);
        }
    };

    //store tool changes into localStorage to maintain state
    pd.options             = function dom__options(x) {
        var item   = {},
            node   = "",
            name   = "",
            type   = "",
            id     = "",
            classy = "",
            h3     = {},
            body   = {};
        if (x !== undefined && x.nodeType === 1) {
            if (x.nodeName.toLowerCase() === "input" || x.nodeName.toLowerCase() === "select" || x.nodeName.toLowerCase() === "div") {
                item = x;
            } else {
                item = x.getElementsByTagName("input")[0];
                if (item === undefined) {
                    return;
                }
            }
        } else if (this.nodeName.toLowerCase() === "input" || this.nodeName.toLowerCase() === "select" || this.nodeName.toLowerCase() === "div") {
            item = this;
        } else {
            item = this.getElementsByTagName("input")[0];
        }
        if (item.nodeType !== 1) {
            return;
        }
        if (item.nodeName.toLowerCase() !== "div" && pd.test.load === false) {
            item.focus();
        }
        node   = item.nodeName.toLowerCase();
        name   = item.getAttribute("name");
        type   = item.getAttribute("type");
        id     = item.getAttribute("id");
        classy = item.getAttribute("class");
        if (pd.test.load === true) {
            return;
        }
        if (node === "input") {
            if (type === "radio") {
                pd.settings[name] = id;
            } else if (type === "text") {
                pd.settings[id] = item.value;
            }
        } else if (node === "select") {
            pd.settings[id] = item.selectedIndex;
        } else if (node === "div" && classy === "box") {
            h3   = item.getElementsByTagName("h3")[0];
            body = item.getElementsByTagName("div")[0];
            if (body.style.display === "none" && h3.clientWidth < 175) {
                pd.settings[id].min = true;
                pd.settings[id].max = false;
            } else if (pd.settings[id].max === false || pd.settings[id].max === undefined) {
                pd.settings[id].min    = false;
                pd.settings[id].left   = item.offsetLeft;
                pd.settings[id].top    = item.offsetTop;
                pd.settings[id].width  = (body.clientWidth - 3);
                pd.settings[id].height = (body.clientHeight - 35.5);
            }
        } else if (node === "button" && id !== null) {
            pd.settings[id] = item.innerHTML.replace(/\s+/g, " ");
        }
        if (pd.test.json === true && pd.test.ls === true) {
            localStorage.settings = JSON.stringify(pd.settings);
        }

        //pd.comment additions
        if (pd.o.comment !== null && id !== null) {
            (function dom__options_comment() {
                var a    = 0,
                    data = [];
                if (id === "baselabel") {
                    data = [
                        "api.sourcelabel", "\"" + item.value + "\""
                    ];
                }
                if (id === "bobjsort-all" || id === "dobjsort-all" || id === "mobjsort-all") {
                    data = [
                        "api.objsort", "all"
                    ];
                }
                if (id === "bobjsort-css" || id === "dobjsort-css" || id === "mobjsort-css") {
                    data = [
                        "api.objsort", "css"
                    ];
                }
                if (id === "bobjsort-js" || id === "dobjsort-js" || id === "mobjsort-js") {
                    data = [
                        "api.objsort", "js"
                    ];
                }
                if (id === "bobjsort-none" || id === "dobjsort-none" || id === "mobjsort-none") {
                    data = [
                        "api.objsort", "none"
                    ];
                }
                if (id === "bjslines-all" || id === "djslines-all") {
                    data = [
                        "api.preserve", "all"
                    ];
                }
                if (id === "bjslines-css" || id === "djslines-css") {
                    data = [
                        "api.preserve", "css"
                    ];
                }
                if (id === "bjslines-js" || id === "djslines-js") {
                    data = [
                        "api.preserve", "js"
                    ];
                }
                if (id === "bjslines-none" || id === "djslines-none") {
                    data = [
                        "api.preserve", "none"
                    ];
                }
                if (id === "conditionald-no" || id === "conditionalm-no") {
                    data = [
                        "api.conditional", "false"
                    ];
                }
                if (id === "conditionald-yes" || id === "conditionalm-yes") {
                    data = [
                        "api.conditional", "true"
                    ];
                }
                if (id === "contextSize") {
                    data = [
                        "api.context", "\"" + item.value + "\""
                    ];
                }
                if (id === "csvchar") {
                    data = [
                        "api.csvchar", "\"" + item.value + "\""
                    ];
                }
                if (id === "diff-char" || id === "beau-char") {
                    data = [
                        "api.inchar", "\"" + item.value + "\""
                    ];
                }
                if (id === "diff-line" || id === "beau-line") {
                    data = [
                        "api.inchar", "\"\\n\""
                    ];
                }
                if (id === "diff-quan" || id === "beau-quan") {
                    data = [
                        "api.insize", "\"" + item.value + "\""
                    ];
                }
                if (id === "diff-space" || id === "beau-space") {
                    data = [
                        "api.inchar", "\" \""
                    ];
                }
                if (id === "diff-tab" || id === "beau-tab") {
                    data = [
                        "api.inchar", "\"\\t\""
                    ];
                }
                if (id === "diff-wrap" || id === "beau-wrap") {
                    data = [
                        "api.wrap", "\"" + item.value + "\""
                    ];
                }
                if (id === "diffcontent") {
                    data = [
                        "api.content", "true"
                    ];
                }
                if (id === "diffcontenty") {
                    data = [
                        "api.content", "false"
                    ];
                }
                if (id === "dforce_indent" || id === "bforce_indent") {
                    data = [
                        "api.force_indent", "true"
                    ];
                }
                if (id === "dforce_indent-no" || id === "bforce_indent-no") {
                    data = [
                        "api.force_indent", "false"
                    ];
                }
                if (id === "diffcommentsn") {
                    data = [
                        "api.diffcomments", "false"
                    ];
                }
                if (id === "diffcommentsy") {
                    data = [
                        "api.diffcomments", "true"
                    ];
                }
                if (id === "difflabel") {
                    data = [
                        "api.difflabel", "\"" + item.value + "\""
                    ];
                }
                if (id === "diffquote") {
                    data = [
                        "api.quote", "true"
                    ];
                }
                if (id === "diffquotey") {
                    data = [
                        "api.quote", "false"
                    ];
                }
                if (id === "diffscolon") {
                    data = [
                        "api.semicolon", "true"
                    ];
                }
                if (id === "diffscolony") {
                    data = [
                        "api.semicolon", "false"
                    ];
                }
                if (id === "htmld-no" || id === "html-no" || id === "htmlm-no") {
                    data = [
                        "api.html", "false"
                    ];
                }
                if (id === "htmld-yes" || id === "html-yes" || id === "htmlm-yes") {
                    data = [
                        "api.html", "true"
                    ];
                }
                if (id === "incomment-no") {
                    data = [
                        "api.comments", "noindent"
                    ];
                }
                if (id === "incomment-yes") {
                    data = [
                        "api.comments", "indent"
                    ];
                }
                if (id === "inline") {
                    data = [
                        "api.diffview", "inline"
                    ];
                }
                if (id === "inlevel") {
                    data = [
                        "api.inlevel", "\"" + item.value + "\""
                    ];
                }
                if (id === "inscriptd-no" || id === "inscript-no") {
                    data = [
                        "api.style", "noindent"
                    ];
                }
                if (id === "inscriptd-yes" || id === "inscript-yes") {
                    data = [
                        "api.style", "indent"
                    ];
                }
                if (id === "jscorrect-no") {
                    data = [
                        "api.correct", "false"
                    ];
                }
                if (id === "jscorrect-yes") {
                    data = [
                        "api.correct", "true"
                    ];
                }
                if (id === "jselseline-no") {
                    data = [
                        "api.elseline", "false"
                    ];
                }
                if (id === "jselseline-yes") {
                    data = [
                        "api.elseline", "true"
                    ];
                }
                if (id === "jsindentd-all" || id === "jsindent-all") {
                    data = [
                        "api.indent", "allman"
                    ];
                }
                if (id === "jsindentd-knr" || id === "jsindent-knr") {
                    data = [
                        "api.indent", "knr"
                    ];
                }
                if (id === "jsscope-html") {
                    data = [
                        "api.jsscope", "true"
                    ];
                }
                if (id === "jsscope-no") {
                    data = [
                        "api.jsscope", "false"
                    ];
                }
                if (id === "jsscope-yes") {
                    data = [
                        "api.jsscope", "true"
                    ];
                }
                if (id === "jsspaced-no" || id === "jsspace-no") {
                    data = [
                        "api.jsspace", "false"
                    ];
                }
                if (id === "jsspaced-yes" || id === "jsspace-yes") {
                    data = [
                        "api.jsspace", "true"
                    ];
                }
                if (id === "lang-default") {
                    data = [
                        "api.langdefault", item[item.selectedIndex].value
                    ];
                }
                if (id === "langauge") {
                    data = [
                        "api.lang", "\"" + item.value + "\""
                    ];
                }
                if (id === "modebeautify") {
                    data = [
                        "api.mode", "beautify"
                    ];
                }
                if (id === "modediff") {
                    data = [
                        "api.mode", "diff"
                    ];
                }
                if (id === "modeminify") {
                    data = [
                        "api.mode", "minify"
                    ];
                }
                if (id === "obfuscate-no") {
                    data = [
                        "api.obfuscate", "false"
                    ];
                }
                if (id === "obfuscate-yes") {
                    data = [
                        "api.obfuscate", "true"
                    ];
                }
                if (id === "sidebyside") {
                    data = [
                        "api.diffview", "sidebyside"
                    ];
                }
                if (id === "topcoms-yes") {
                    data = [
                        "api.topcoms", "true"
                    ];
                }
                if (id === "topcoms-no") {
                    data = [
                        "api.topcoms", "false"
                    ];
                }
                if (id === "vertical-all") {
                    data = [
                        "api.vertical", "all"
                    ];
                }
                if (id === "vertical-cssonly") {
                    data = [
                        "api.vertical", "css"
                    ];
                }
                if (id === "vertical-jsonly") {
                    data = [
                        "api.vertical", "js"
                    ];
                }
                if (id === "vertical-none") {
                    data = [
                        "api.vertical", "none"
                    ];
                }
                if (data.length === 0) {
                    return;
                }
                for (a = pd.commentString.length - 1; a > -1; a -= 1) {
                    if (pd.commentString[a].indexOf(data[0]) > -1) {
                        pd.commentString[a] = data.join(": ");
                        break;
                    }
                }
                if (a < 0) {
                    pd.commentString.push(data.join(": "));
                    pd.commentString.sort();
                }
                if (pd.commentString.length === 0) {
                    pd.o.comment.innerHTML = "/*prettydiff.com */";
                } else if (pd.commentString.length === 1) {
                    pd.o.comment.innerHTML = "/*prettydiff.com " + pd.commentString[0].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + " */";
                } else {
                    pd.o.comment.innerHTML = "/*prettydiff.com " + pd.commentString.join(", ").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + " */";
                }
                if (pd.test.ls === true && pd.test.json === true) {
                    localStorage.commentString = JSON.stringify(pd.commentString);
                }
            }());
        }
    };

    pd.clearComment        = function dom__clearComment() {
        delete localStorage.commentString;
        pd.commentString       = [];
        pd.o.comment.innerHTML = "/*prettydiff.com */";
    };

    //maximize textareas and hide options
    pd.hideOptions         = function dom__hideOptions() {
        var node   = {},
            text   = "",
            height = 0,
            button = pd.$$("hideOptions");
        if (button === null) {
            return;
        }
        text = button.innerHTML.replace(/\s+/g, " ");
        if (text === "Default Display" || text === "Maximize Inputs") {
            if (pd.o.displayTall !== null && pd.o.displayTall.checked === false) {
                pd.prettyvis(pd.o.displayTall);
            }
            node = pd.$$("top");
            if (node !== null) {
                node.style.display = "none";
            }
            if (pd.o.report.feed.box !== null) {
                pd.o.report.feed.box.style.top = "-1000em";
            }
            if (pd.o.report.code.box !== null) {
                pd.o.report.code.box.style.top = "-1000em";
            }
            if (pd.o.report.stat.box !== null) {
                pd.o.report.stat.box.style.top = "-1000em";
            }
            node = pd.$$("diffoutput");
            if (node !== null) {
                node.style.display = "none";
            }
            node = pd.$$("codeInput");
            if (node !== null) {
                node.style.marginLeft = "0em";
            }
            node = pd.$$("displayOps");
            if (node !== null) {
                height = height - node.clientHeight;
                height = height - 9;
            }
            node = pd.$$("button-primary");
            if (node !== null) {
                height = height - node.clientHeight;
                height = height - 24;
            }
            height = height - 62;
            if (pd.mode === "diff") {
                height = height - 10;
            }
            if (pd.o.codeDiffBase !== null) {
                pd.o.codeDiffBase.style.height       = ((height / 12) - 4.55) + "em";
                pd.o.codeDiffBase.style.marginBottom = "1em";
            }
            if (pd.o.codeDiffNew !== null) {
                pd.o.codeDiffNew.style.height       = ((height / 12) - 4.55) + "em";
                pd.o.codeDiffNew.style.marginBottom = "1em";
            }
            node = button.parentNode;
            if (node.nodeName.toLowerCase() === "li") {
                node = node.parentNode;
            }
            node.style.position     = "relative";
            node.style.marginBottom = "0em";
            pd.options(button);
            if (pd.o.announce !== null) {
                pd.o.announce.setAttribute("class", "big");
                pd.o.announce.parentNode.removeChild(pd.o.announce);
                pd.o.announce.innerHTML   = "";
                pd.o.announce.style.color = "#000";
                if (pd.$$("codeInput") !== null) {
                    pd.$$("codeInput").insertBefore(pd.o.announce, pd.$$("codeInput").firstChild);
                }
            }
            return false;
        }
        if (pd.o.announce !== null) {
            pd.o.announce.parentNode.removeChild(pd.o.announce);
            if (pd.$$("introduction") !== null) {
                if (pd.$$("update") === null) {
                    pd.$$("introduction").appendChild(pd.o.announce);
                } else {
                    pd.$$("introduction").insertBefore(pd.o.announce, pd.$$("update"));
                }
            }
            pd.o.announce.style.color = "#000";
            pd.o.announce.setAttribute("class", "normal");
            pd.o.announce.innerHTML = pd.o.announcetext;
        }
        node = pd.$$("top");
        if (node !== null) {
            node.style.display = "block";
        }
        if (pd.o.report.feed.box !== null && pd.o.report.feed.box.offsetTop < 0) {
            pd.o.report.feed.box.style.top = "auto";
        }
        if (pd.o.report.code.box !== null && pd.o.report.code.box.offsetTop < 0) {
            pd.o.report.code.box.style.top = "auto";
        }
        if (pd.o.report.stat.box !== null && pd.o.report.stat.box.offsetTop < 0) {
            pd.o.report.stat.box.style.top = "auto";
        }
        node = pd.$$("diffoutput");
        if (node !== null) {
            node.style.display = "block";
        }
        node = pd.$$("codeInput");
        if (node !== null) {
            node.style.marginLeft = "22.5em";
        }
        if (pd.o.codeDiffBase !== null) {
            pd.o.codeDiffBase.style.height       = "30.6em";
            pd.o.codeDiffBase.style.marginBottom = "0.5em";
        }
        node = pd.$$("diffBase");
        if (node !== null) {
            node.style.marginTop = "0em";
        }
        if (pd.o.codeDiffNew !== null) {
            pd.o.codeDiffNew.style.height       = "30.6em";
            pd.o.codeDiffNew.style.marginBottom = "0.5em";
        }
        node = pd.$$("diffNew");
        if (node !== null) {
            node.style.marginTop = "0em";
        }
        node = pd.$$("Beautify");
        if (node !== null) {
            node.style.marginTop = "0em";
        }
        if (pd.o.codeBeauIn !== null) {
            pd.o.codeBeauIn.style.height       = "31.7em";
            pd.o.codeBeauIn.style.marginBottom = "-0.1em";
        }
        if (pd.o.codeBeauOut !== null) {
            pd.o.codeBeauOut.style.height       = "34em";
            pd.o.codeBeauOut.style.marginBottom = "-0.1em";
        }
        node = pd.$$("Minify");
        if (node !== null) {
            node.style.marginTop = "0em";
        }
        if (pd.o.codeMinnIn !== null) {
            pd.o.codeMinnIn.style.height       = "31.7em";
            pd.o.codeMinnIn.style.marginBottom = "-0.1em";
        }
        if (pd.o.codeMinnOut !== null) {
            pd.o.codeMinnOut.style.height       = "34em";
            pd.o.codeMinnOut.style.marginBottom = "-0.1em";
        }
        button.innerHTML = "Maximize Inputs";
        node             = button.parentNode;
        if (node.nodeName.toLowerCase() === "li") {
            node = node.parentNode;
        }
        node.style.position     = "static";
        node.style.marginBottom = "2em";
        button.setAttribute("title", "Clicking this button will visually hide everything except for textarea elements and one 'Execute' button.");
        pd.options(button);
        return false;
    };

    //reset tool to default configuration
    pd.reset               = function dom__reset() {
        var nametry = {},
            name    = "";
        delete localStorage.codeBeautify;
        delete localStorage.codeDiffBase;
        delete localStorage.codeDiffNew;
        delete localStorage.codeMinify;
        delete localStorage.commentString;
        if (pd.settings === undefined || pd.settings.knownname === undefined) {
            if (localStorage.settings !== undefined) {
                nametry = JSON.stringify(localStorage.settings);
            }
            if (localStorage.settings === undefined || nametry.knownname === undefined) {
                name = "\"" + Math.random().toString().slice(2) + Math.random().toString().slice(2) + "\"";
            }
            pd.settings.knownname = name;
        }
        localStorage.settings  = "{\"feedreport\":{\"newb\":" + pd.settings.feedreport.newb + ",\"veteran\":" + pd.settings.feedreport.veteran + "},\"codereport\":{},\"statreport\":{},\"knownname\":" + pd.settings.knownname + "}";
        pd.commentString       = [];
        pd.o.comment.innerHTML = "/*prettydiff.com */";
        pd.o.modeDiff.checked  = true;
        location.reload();
    };

    pd.fixHeight           = function dom__fixHeight() {
        var baseText = pd.$$("baseText"),
            newText  = pd.$$("newText"),
            height   = window.innerHeight || document.getElementsByTagName("body")[0].clientHeight;
        if (pd.test.cm === true) {
            if (baseText !== null && newText !== null) {
                baseText.style.height       = ((height / 12) - 18.2) + "em";
                newText.style.height        = ((height / 12) - 18.2) + "em";
                baseText.style.marginBottom = "0";
                newText.style.marginBottom  = "0";
            }
            if (pd.o.codeBeauIn !== null) {
                pd.o.codeBeauIn.style.marginBottom = "1em";
            }
            if (pd.o.codeBeauOut !== null) {
                pd.o.codeBeauOut.style.marginBottom = "1em";
            }
            if (pd.o.codeMinnIn !== null) {
                pd.o.codeMinnIn.style.marginBottom = "1em";
            }
            if (pd.o.codeMinnOut !== null) {
                pd.o.codeMinnOut.style.marginBottom = "1em";
            }
        } else {
            if (baseText !== null && newText !== null) {
                baseText.style.height = ((height / 12) - 18.35) + "em";
                newText.style.height  = ((height / 12) - 18.35) + "em";
            }
        }
        if (pd.o.codeBeauIn !== null) {
            pd.o.codeBeauIn.style.height = ((height / 12) - 16.85) + "em";
        }
        if (pd.o.codeBeauOut !== null) {
            pd.o.codeBeauOut.style.height = ((height / 12) - 14.5) + "em";
        }
        if (pd.o.codeMinnIn !== null) {
            pd.o.codeMinnIn.style.height = ((height / 12) - 16.85) + "em";
        }
        if (pd.o.codeMinnOut !== null) {
            pd.o.codeMinnOut.style.height = ((height / 12) - 14.5) + "em";
        }
    };

    //alter tool on page load in reflection to saved state
    (function dom__load() {
        var a             = 0,
            inputs        = [],
            inputsLen     = 0,
            id            = "",
            name          = "",
            type          = "",
            node          = {},
            buttons       = {},
            title         = {},
            statdump      = [],
            langtest      = (pd.o.lang !== null && pd.o.lang.nodeName.toLowerCase() === "select") ? true : false,
            lang          = (pd.o.lang !== null) ? "auto" : ((langtest === true) ? pd.o.lang[pd.o.lang.selectedIndex].value : ((pd.o.lang === null) ? "text" : pd.o.lang.value)),
            thirdparty    = function dom__load_thirdparty() {
                var that = this,
                    href = that.getAttribute("href");
                window.open(href, 'thirdparty');
                return false;
            },
            resize        = function dom__load_resize(e) {
                var that = this;
                pd.resize(e, that);
            },
            save          = function dom__load_save() {
                var that = this;
                pd.save(that);
            },
            grab          = function dom__load_grab(e) {
                var that = this;
                pd.grab(e, that);
            },
            top           = function dom__load_top() {
                var that = this;
                pd.top(that.parentNode);
            },
            page          = (pd.o.page === null) ? "" : pd.o.page.getAttribute("id"),
            backspace     = function dom__load_backspace(event) {
                var aa = event || window.event,
                    bb = aa.srcElement || aa.target;
                if (aa.keyCode === 8) {
                    if (bb.nodeName === "textarea" || (bb.nodeName === "input" && (bb.getAttribute("type") === "text" || bb.getAttribute("type") === "password"))) {
                        return true;
                    }
                    return false;
                }
            },
            cmdisable     = function dom__load_cmdisable(x) {
                var el     = (typeof x === "object" && x.nodeType === 1) ? x : this,
                    elId   = el.getAttribute("id"),
                    loc    = location.href.indexOf("codemirror=false"),
                    place  = [],
                    symbol = "?";
                pd.options(el);
                if (elId.indexOf("-yes") > 0 && loc > 0) {
                    place = location.href.split("codemirror=false");
                    if (place[1].indexOf("&") < 0 && place[1].indexOf("%26") < 0) {
                        place[0]      = place[0].slice(0, place[0].length - 1);
                        location.href = place.join("");
                    }
                } else if (elId.indexOf("-no") > 0 && loc < 0) {
                    if (location.href.indexOf("?") < location.href.length - 1 && location.href.indexOf("?") > 0) {
                        symbol = "&";
                    }
                    location.href = location.href + symbol + "codemirror=false";
                }
            },
            hideBeauOut   = function dom__load_hideBeauOut() {
                pd.hideBeauOut(this);
            },
            feedradio     = function dom__load_feedradio(e) {
                var event  = e || window.event,
                    item   = this.parentNode,
                    radio  = item.getElementsByTagName("input")[0],
                    radios = item.parentNode.getElementsByTagName("input"),
                    aa     = 0;
                for (aa = radios.length - 1; aa > -1; aa -= 1) {
                    radios[aa].parentNode.removeAttribute("class");
                    radios[aa].checked = false;
                }
                radio.checked = true;
                radio.focus();
                item.setAttribute("class", "active-focus");
                event.preventDefault();
                return false;
            },
            feedblur      = function dom__load_feedblur() {
                var label = this.parentNode;
                label.setAttribute("class", "active");
            },
            textareafocus = function dom__load_textareafocus() {
                var tabkey = pd.$$("textareaTabKey");
                tabkey.style.zIndex         = pd.zIndex + 10;
                pd.$$("arialive").innerHTML = tabkey.innerHTML;
                if (pd.mode === "diff") {
                    tabkey.style.right = "51%";
                    tabkey.style.left  = "auto";
                } else {
                    tabkey.style.left  = "51%";
                    tabkey.style.right = "auto";
                }
                tabkey.style.display = "block";
                if (pd.test.cm === true) {
                    this.parentNode.parentNode.setAttribute("class", this.parentNode.parentNode.getAttribute("class") + " filefocus");
                }
            },
            textareablur  = function dom__load_textareablur() {
                pd.$$("textareaTabKey").style.display = "none";
                if (pd.test.cm === true) {
                    this.parentNode.parentNode.setAttribute("class", this.parentNode.parentNode.getAttribute("class").replace(" filefocus", ""));
                }
            },
            filefocus     = function dom__load_filefocus() {
                this.setAttribute("class", "filefocus");
            },
            fileblur      = function dom__load_fileblur() {
                this.removeAttribute("class");
            },
            savecheck     = function dom__load_savecheck() {
                var button = {};
                if (pd.o.report.code.box === null) {
                    return;
                }
                button = pd.o.report.code.box.getElementsByTagName("button")[0];
                if (button.getAttribute("class") !== "save") {
                    return;
                }
                if (this.checked === true) {
                    button.innerHTML = "H";
                } else {
                    button.innerHTML = "S";
                }
            };
        pd.fixHeight();
        window.onresize = pd.fixHeight;
        window.onkeyup  = pd.areaShiftUp;
        if (page === "webtool") {
            if (pd.o.announce !== null) {
                pd.o.announcetext = pd.o.announce.innerHTML;
            }
            node = pd.$$("hideOptions");
            if (node !== null && node.innerHTML.replace(/\s+/, " ") === "Default Display") {
                if (pd.test.ls === false || localStorage.settings === undefined) {
                    pd.hideOptions();
                    node           = document.createElement("p");
                    id             = (location.href.indexOf("prettydiff.com/") > -1) ? "php" : "xhtml";
                    node.innerHTML = "<strong>New to Pretty Diff?</strong> Click on the <em>Show Options</em> button in the top right corner to see more options or read the <a href='documentation." + id + "'>documentation</a>.";
                    node.setAttribute("id", "showOptionsCallOut");
                    node.onclick = function () {
                        var self = document.getElementById("showOptionsCallOut");
                        self.parentNode.removeChild(self);
                    };
                    pd.o.page.appendChild(node);
                } else {
                    node.innerHTML = "Maximize Inputs";
                }
            }
            if (pd.$$("option_commentClear") !== null) {
                pd.$$("option_commentClear").onclick = pd.clearComment;
            }
            document.onkeypress    = backspace;
            document.onkeydown     = backspace;
            pd.zIndex              = 10;
            pd.mode                = "diff";
            pd.settings            = {};
            pd.settings.feedreport = {};
            pd.settings.codereport = {};
            pd.settings.statreport = {};
            pd.settings.feedreport.newb = false;
            pd.settings.feedreport.veteran = false;
            pd.keypress            = {
                date    : {},
                keys    : [],
                state   : false,
                throttle: 0
            };
            if (pd.test.fs === false) {
                node = pd.$$("diffbasefile");
                if (node !== null) {
                    node.disabled = true;
                }
                node = pd.$$("diffnewfile");
                if (node !== null) {
                    node.disabled = true;
                }
                node = pd.$$("beautyfile");
                if (node !== null) {
                    node.disabled = true;
                }
                node = pd.$$("minifyfile");
                if (node !== null) {
                    node.disabled = true;
                }
            }
            if (pd.test.ls === true) {
                if (localStorage.webtool !== undefined) {
                    delete localStorage.webtool;
                    delete localStorage.optionString;
                }
                if (localStorage.bl !== undefined) {
                    delete localStorage.bl;
                }
                if (localStorage.nl !== undefined) {
                    delete localStorage.nl;
                }
                if (localStorage.bo !== undefined) {
                    name = localStorage.bo;
                    delete localStorage.bo;
                    localStorage.codeDiffBase = name;
                }
                if (localStorage.nx !== undefined) {
                    name = localStorage.nx;
                    delete localStorage.nx;
                    localStorage.codeDiffNew = name;
                }
                if (localStorage.bi !== undefined) {
                    name = localStorage.bi;
                    delete localStorage.bi;
                    localStorage.codeBeautify = name;
                }
                if (localStorage.mi !== undefined) {
                    name = localStorage.mi;
                    delete localStorage.mi;
                    localStorage.codeMinify = name;
                }
                if (localStorage.statdata !== undefined) {
                    delete localStorage.statdata;
                }
                if (pd.stat.fdate === 0) {
                    pd.stat.fdate = Date.now();
                }
                if (pd.test.json === true) {
                    if (localStorage.commentString !== undefined) {
                        pd.commentString = JSON.parse(localStorage.commentString);
                    }
                    if (localStorage.settings !== undefined) {
                        if (localStorage.settings.indexOf(":undefined") > 0) {
                            localStorage.settings = localStorage.settings.replace(/:undefined/g, ":false");
                        }
                        pd.settings = JSON.parse(localStorage.settings);
                        if (pd.settings.knownname === undefined) {
                            pd.settings.knownname = "\"" + Math.random().toString().slice(2) + Math.random().toString().slice(2) + "\"";
                            localStorage.settings = JSON.stringify(pd.settings);
                        } else if (typeof pd.settings.knownname === "number") {
                            pd.settings.knownname = "\"" + pd.settings.knownname + "\"";
                        }
                        if (pd.settings.diffreport !== undefined) {
                            delete pd.settings.diffreport;
                            delete pd.settings.beaureport;
                            delete pd.settings.minnreport;
                            pd.settings.feedreport = {};
                            pd.settings.codereport = {};
                        }
                    }
                    if (localStorage.stat !== undefined) {
                        if (statdump.length === 0) {
                            pd.stat       = JSON.parse(localStorage.stat);
                            pd.stat.visit = Number(pd.stat.visit) + 1;
                            if (typeof pd.stat.fdate === "string") {
                                pd.stat.fdate = Date.parse(pd.stat.fdate);
                            }
                            if (pd.stat.fdate === 0 || pd.stat.fdate === null || isNaN(pd.stat.fdate) === true) {
                                pd.stat.fdate = Date.now();
                            }
                            pd.stat.avday  = Math.round(pd.stat.visit / ((Date.now() - pd.stat.fdate) / 86400000));
                            pd.stat.useday = Math.round(pd.stat.usage / ((Date.now() - pd.stat.fdate) / 86400000));
                        }
                        node = pd.$$("stvisit");
                        if (node !== null) {
                            node.innerHTML = pd.stat.visit;
                        }
                        node = pd.$$("stusage");
                        if (node !== null) {
                            node.innerHTML = pd.stat.usage;
                        }
                        node = pd.$$("stuseday");
                        if (node !== null) {
                            node.innerHTML = pd.stat.useday;
                        }
                        node = pd.$$("stfdate");
                        if (node !== null) {
                            node.innerHTML = new Date(pd.stat.fdate).toLocaleDateString();
                        }
                        node = pd.$$("stavday");
                        if (node !== null) {
                            node.innerHTML = pd.stat.avday;
                        }
                        node = pd.$$("stlarge");
                        if (node !== null) {
                            node.innerHTML = pd.stat.large;
                        }
                        node = pd.$$("stdiff");
                        if (node !== null) {
                            node.innerHTML = pd.stat.diff;
                        }
                        node = pd.$$("stbeau");
                        if (node !== null) {
                            node.innerHTML = pd.stat.beau;
                        }
                        node = pd.$$("stminn");
                        if (node !== null) {
                            node.innerHTML = pd.stat.minn;
                        }
                        node = pd.$$("stmarkup");
                        if (node !== null) {
                            node.innerHTML = pd.stat.markup;
                        }
                        node = pd.$$("stjs");
                        if (node !== null) {
                            node.innerHTML = pd.stat.js;
                        }
                        node = pd.$$("stcss");
                        if (node !== null) {
                            node.innerHTML = pd.stat.css;
                        }
                        node = pd.$$("stcsv");
                        if (node !== null) {
                            node.innerHTML = pd.stat.csv;
                        }
                        node = pd.$$("sttext");
                        if (node !== null) {
                            node.innerHTML = pd.stat.text;
                        }
                    }
                    localStorage.stat = JSON.stringify(pd.stat);
                }
                if (statdump.length > 0) {
                    delete localStorage.statdata;
                }
            }
            if (pd.test.agent.indexOf("webkit") > 0 || pd.test.agent.indexOf("blink") > 0) {
                inputs    = document.getElementsByTagName("textarea");
                inputsLen = inputs.length;
                for (a = 0; a < inputsLen; a += 1) {
                    inputs[a].removeAttribute("wrap");
                }
            }
            if (pd.o.codeBeauIn !== null) {
                pd.o.codeBeauIn.onkeyup = function dom__load_bindBeauInUp(e) {
                    var event = e || window.event;
                    pd.recycle(event);
                };
                if (pd.test.cm === true) {
                    pd.o.codeBeauIn.getElementsByTagName("textarea")[0].onfocus   = textareafocus;
                    pd.o.codeBeauIn.getElementsByTagName("textarea")[0].onblur    = textareablur;
                    pd.o.codeBeauIn.getElementsByTagName("textarea")[0].onkeydown = function dom__load_bindBeauInDownCM(e) {
                        var event = e || window.event;
                        pd.areaTabOut(event, this);
                        pd.keydown(event);
                    };
                } else {
                    pd.o.codeBeauIn.onfocus   = textareafocus;
                    pd.o.codeBeauIn.onblur    = textareablur;
                    pd.o.codeBeauIn.onkeydown = function dom__load_bindBeauInDown(e) {
                        var event = e || window.event;
                        pd.fixtabs(event, pd.o.codeBeauIn);
                        pd.areaTabOut(event, this);
                        pd.keydown(event);
                    };
                }
            }
            if (pd.o.codeBeauOut !== null && pd.test.cm === true) {
                pd.o.codeBeauOut.getElementsByTagName("textarea")[0].onfocus   = textareafocus;
                pd.o.codeBeauOut.getElementsByTagName("textarea")[0].onblur    = textareablur;
                pd.o.codeBeauOut.getElementsByTagName("textarea")[0].onkeydown = pd.areaTabOut;
            }
            if (pd.o.codeMinnIn !== null) {
                pd.o.codeMinnIn.onkeyup = function dom__load_bindMinnInUp(e) {
                    var event = e || window.event;
                    pd.recycle(event);
                };
                if (pd.test.cm === true) {
                    pd.o.codeMinnIn.getElementsByTagName("textarea")[0].onfocus   = textareafocus;
                    pd.o.codeMinnIn.getElementsByTagName("textarea")[0].onblur    = textareablur;
                    pd.o.codeMinnIn.getElementsByTagName("textarea")[0].onkeydown = function dom__load_bindMinnInDownCM(e) {
                        var event = e || window.event;
                        pd.areaTabOut(event, this);
                        pd.keydown(event);
                    };
                } else {
                    pd.o.codeMinnIn.onfocus   = textareafocus;
                    pd.o.codeMinnIn.onblur    = textareablur;
                    pd.o.codeMinnIn.onkeydown = function dom__load_bindMinnInDown(e) {
                        var event = e || window.event;
                        pd.fixtabs(event, this);
                        pd.areaTabOut(event, this);
                        pd.keydown(event);
                    };
                }
            }
            if (pd.o.codeMinnOut !== null && pd.test.cm === true) {
                pd.o.codeMinnOut.getElementsByTagName("textarea")[0].onfocus   = textareafocus;
                pd.o.codeMinnOut.getElementsByTagName("textarea")[0].onblur    = textareablur;
                pd.o.codeMinnOut.getElementsByTagName("textarea")[0].onkeydown = pd.areaTabOut;
            }
            if (pd.o.codeDiffBase !== null) {
                if (pd.test.cm === true) {
                    pd.o.codeDiffBase.onkeyup                                       = function dom__load_bindAutoDiffBase() {
                        pd.langkey(pd.cm.diffBase);
                    };
                    pd.o.codeDiffBase.getElementsByTagName("textarea")[0].onfocus   = textareafocus;
                    pd.o.codeDiffBase.getElementsByTagName("textarea")[0].onblur    = textareablur;
                    pd.o.codeDiffBase.getElementsByTagName("textarea")[0].onkeydown = pd.areaTabOut;
                } else {
                    pd.o.codeDiffBase.onfocus   = textareafocus;
                    pd.o.codeDiffBase.onblur    = textareablur;
                    pd.o.codeDiffBase.onkeydown = function dom__load_bindDiffBaseDown(e) {
                        var event = e || window.event;
                        pd.fixtabs(event, this);
                        pd.areaTabOut(event, this);
                    };
                }
            }
            if (pd.o.codeDiffNew !== null) {
                if (pd.test.cm === true) {
                    pd.o.codeDiffNew.onkeyup                                       = function dom__load_bindAutoDiffNew() {
                        pd.langkey(pd.cm.diffNew);
                    };
                    pd.o.codeDiffNew.getElementsByTagName("textarea")[0].onfocus   = textareafocus;
                    pd.o.codeDiffNew.getElementsByTagName("textarea")[0].onblur    = textareablur;
                    pd.o.codeDiffNew.getElementsByTagName("textarea")[0].onkeydown = pd.areaTabOut;
                } else {
                    pd.o.codeDiffNew.onfocus   = textareafocus;
                    pd.o.codeDiffNew.onblur    = textareablur;
                    pd.o.codeDiffNew.onkeydown = function dom__load_bindDiffNewDown(e) {
                        var event = e || window.event;
                        pd.fixtabs(event, this);
                        pd.areaTabOut(event, this);
                    };
                }
            }
            if (pd.test.domain === false) {
                pd.o.report.feed.box.style.display = "none";
            } else if (pd.o.report.feed.box !== null) {
                if (pd.test.fs === true) {
                    pd.o.report.feed.box.ondragover  = pd.filenull;
                    pd.o.report.feed.box.ondragleave = pd.filenull;
                    pd.o.report.feed.box.ondrop      = pd.filedrop;
                }
                pd.o.report.feed.body.onmousedown = top;
                title                             = pd.o.report.feed.box.getElementsByTagName("h3")[0];
                title.onmousedown                 = grab;
                title.ontouchstart                = grab;
                if (pd.settings.feedreport.min === false) {
                    buttons               = pd.o.report.feed.box.getElementsByTagName("p")[0];
                    buttons.style.display = "block";
                    title.style.cursor    = "move";
                    if (buttons.innerHTML.indexOf("save") > 0) {
                        buttons.getElementsByTagName("button")[1].innerHTML = "\u035f";
                        title.style.width                                   = ((pd.settings.feedreport.width / 10) - 9.75) + "em";
                    } else {
                        buttons.getElementsByTagName("button")[0].innerHTML = "\u035f";
                        title.style.width                                   = ((pd.settings.feedreport.width / 10) - 6.75) + "em";
                    }
                    if (pd.settings.feedreport.top < 15) {
                        pd.settings.feedreport.top = 15;
                    }
                    pd.o.report.feed.box.style.right    = "auto";
                    pd.o.report.feed.box.style.left     = (pd.settings.feedreport.left / 10) + "em";
                    pd.o.report.feed.box.style.top      = (pd.settings.feedreport.top / 10) + "em";
                    pd.o.report.feed.body.style.width   = (pd.settings.feedreport.width / 10) + "em";
                    pd.o.report.feed.body.style.height  = (pd.settings.feedreport.height / 10) + "em";
                    pd.o.report.feed.body.style.display = "block";
                }
                pd.$$("feedsubmit").onclick = pd.feedsubmit;
            }
            if (pd.o.report.code.box !== null) {
                if (pd.test.fs === true) {
                    pd.o.report.code.box.ondragover  = pd.filenull;
                    pd.o.report.code.box.ondragleave = pd.filenull;
                    pd.o.report.code.box.ondrop      = pd.filedrop;
                }
                pd.o.report.code.body.onmousedown = top;
                title                             = pd.o.report.code.box.getElementsByTagName("h3")[0];
                title.onmousedown                 = grab;
                title.ontouchstart                = grab;
                buttons                           = pd.o.report.code.box.getElementsByTagName("p")[0];
                node                              = pd.$$("jsscope-yes");
                if (node !== null && node.checked === true && buttons.innerHTML.indexOf("save") < 0) {
                    if (pd.test.agent.indexOf("firefox") > 0 || pd.test.agent.indexOf("presto") > 0) {
                        node = document.createElement("a");
                        node.setAttribute("href", "#");
                        node.onclick   = save;
                        node.innerHTML = "<button class='save' title='Convert report to text that can be saved.'>S</button>";
                        buttons.insertBefore(node, buttons.firstChild);
                    } else {
                        node = document.createElement("button");
                        node.setAttribute("class", "save");
                        node.setAttribute("title", "Convert report to text that can be saved.");
                        node.innerHTML = "S";
                        buttons.insertBefore(node, buttons.firstChild);
                    }
                }
                if (pd.settings.codereport.min === false) {
                    buttons.style.display = "block";
                    title.style.cursor    = "move";
                    if (buttons.innerHTML.indexOf("save") > 0) {
                        buttons.getElementsByTagName("button")[1].innerHTML = "\u035f";
                        title.style.width                                   = ((pd.settings.codereport.width / 10) - 9.75) + "em";
                    } else {
                        buttons.getElementsByTagName("button")[0].innerHTML = "\u035f";
                        title.style.width                                   = ((pd.settings.codereport.width / 10) - 6.75) + "em";
                    }
                    if (pd.settings.codereport.top < 15) {
                        pd.settings.codereport.top = 15;
                    }
                    pd.o.report.code.box.style.right    = "auto";
                    pd.o.report.code.box.style.left     = (pd.settings.codereport.left / 10) + "em";
                    pd.o.report.code.box.style.top      = (pd.settings.codereport.top / 10) + "em";
                    pd.o.report.code.body.style.width   = (pd.settings.codereport.width / 10) + "em";
                    pd.o.report.code.body.style.height  = (pd.settings.codereport.height / 10) + "em";
                    pd.o.report.code.body.style.display = "block";
                }
            }
            if (pd.o.report.stat.box !== null) {
                if (pd.test.fs === true) {
                    pd.o.report.stat.box.ondragover  = pd.filenull;
                    pd.o.report.stat.box.ondragleave = pd.filenull;
                    pd.o.report.stat.box.ondrop      = pd.filedrop;
                }
                pd.o.report.stat.body.onmousedown = top;
                title                             = pd.o.report.stat.box.getElementsByTagName("h3")[0];
                title.onmousedown                 = grab;
                title.ontouchstart                = grab;
                if (pd.settings.statreport.min === false) {
                    buttons               = pd.o.report.stat.box.getElementsByTagName("p")[0];
                    buttons.style.display = "block";
                    title.style.cursor    = "move";
                    if (buttons.innerHTML.indexOf("save") > 0) {
                        buttons.getElementsByTagName("button")[1].innerHTML = "\u035f";
                        title.style.width                                   = ((pd.settings.statreport.width / 10) - 9.75) + "em";
                    } else {
                        buttons.getElementsByTagName("button")[0].innerHTML = "\u035f";
                        title.style.width                                   = ((pd.settings.statreport.width / 10) - 6.75) + "em";
                    }
                    if (pd.settings.statreport.top < 15) {
                        pd.settings.statreport.top = 15;
                    }
                    pd.o.report.stat.box.style.right    = "auto";
                    pd.o.report.stat.box.style.left     = (pd.settings.statreport.left / 10) + "em";
                    pd.o.report.stat.box.style.top      = (pd.settings.statreport.top / 10) + "em";
                    pd.o.report.stat.body.style.width   = (pd.settings.statreport.width / 10) + "em";
                    pd.o.report.stat.body.style.height  = (pd.settings.statreport.height / 10) + "em";
                    pd.o.report.stat.body.style.display = "block";
                }
            }
            inputs    = document.getElementsByTagName("input");
            inputsLen = inputs.length;
            for (a = 0; a < inputsLen; a += 1) {
                type = inputs[a].getAttribute("type");
                id   = inputs[a].getAttribute("id");
                if (type === "radio") {
                    name = inputs[a].getAttribute("name");
                    if (id === pd.settings[name]) {
                        inputs[a].checked = true;
                        if (name === "beauchar" || name === "diffchar") {
                            pd.indentchar(inputs[a]);
                        }
                    }
                    if (id.indexOf("feedradio") === 0) {
                        inputs[a].onfocus                                             = feedradio;
                        inputs[a].onblur                                              = feedblur;
                        inputs[a].onclick                                             = feedradio;
                        inputs[a].parentNode.getElementsByTagName("label")[0].onclick = feedradio;
                    }
                    if (name === "mode") {
                        inputs[a].onclick = pd.prettyvis;
                        if (pd.settings[name] === id) {
                            pd.prettyvis(inputs[a]);
                        }
                    } else if (name === "diffchar" || name === "beauchar" || name === "minnchar") {
                        inputs[a].onclick = pd.indentchar;
                    } else if (name === "jsscope") {
                        inputs[a].onclick = hideBeauOut;
                        if (id === "jsscope-yes" && inputs[a].checked === true) {
                            pd.hideBeauOut(inputs[a]);
                        }
                    } else if (name === "codemirror-radio") {
                        if (id === "codemirror-no" && inputs[a].checked === true && pd.test.cm === true) {
                            cmdisable(inputs[a]);
                        }
                        inputs[a].onclick = cmdisable;
                    } else {
                        inputs[a].onclick = pd.options;
                    }
                } else if (type === "text") {
                    if (pd.test.cm === true && (id === "diff-quan" || id === "beau-quan" || id === "minn-quan")) {
                        inputs[a].onkeyup = pd.insize;
                        if (pd.settings[id] !== undefined && pd.settings[id] !== "4" && isNaN(pd.settings[id]) === false) {
                            if (id === "diff-quan") {
                                if (pd.o.codeDiffBase !== null) {
                                    pd.cm.diffBase.setOption("indentUnit", Number(pd.settings[id]));
                                }
                                if (pd.o.codeDiffNew !== null) {
                                    pd.cm.diffNew.setOption("indentUnit", Number(pd.settings[id]));
                                }
                            } else if (id === "beau-quan") {
                                if (pd.o.codeBeauIn !== null) {
                                    pd.cm.beauIn.setOption("indentUnit", Number(pd.settings[id]));
                                }
                                if (pd.o.codeBeauOut !== null) {
                                    pd.cm.beauOut.setOption("indentUnit", Number(pd.settings[id]));
                                }
                            } else if (id === "minn-quan") {
                                if (pd.o.codeMinnIn !== null) {
                                    pd.cm.minnIn.setOption("indentUnit", Number(pd.settings[id]));
                                }
                                if (pd.o.codeMinnOut !== null) {
                                    pd.cm.minnOut.setOption("indentUnit", Number(pd.settings[id]));
                                }
                            }
                        }
                    } else {
                        inputs[a].onkeyup = pd.options;
                    }
                    if (pd.settings[id] !== undefined) {
                        inputs[a].value = pd.settings[id];
                    }
                    if (id === "diff-char" || id === "beau-char") {
                        inputs[a].onclick = pd.indentchar;
                    }
                } else if (type === "file") {
                    inputs[a].onchange = pd.file;
                    inputs[a].onfocus  = filefocus;
                    inputs[a].onblur   = fileblur;
                }
            }
            node = pd.$$("codemirror-no");
            if (pd.test.cm === false && node !== null && node.checked === false) {
                node.checked = true;
            }
            inputs    = document.getElementsByTagName("select");
            inputsLen = inputs.length;
            for (a = 0; a < inputsLen; a += 1) {
                id = inputs[a].getAttribute("id");
                if (id === "colorScheme") {
                    inputs[a].onchange = pd.colorScheme;
                    if (pd.settings.colorScheme !== undefined) {
                        inputs[a].selectedIndex = Number(pd.settings.colorScheme);
                        pd.colorScheme(inputs[a]);
                    }
                } else if (id === "language") {
                    inputs[a].onchange = pd.codeOps;
                    if (pd.settings.language !== undefined) {
                        inputs[a].selectedIndex = Number(pd.settings.language);
                        if (pd.o.lang[pd.o.lang.selectedIndex].value === "text" && pd.mode !== "diff") {
                            inputs[a].selectedIndex = 0;
                        }
                        pd.codeOps(inputs[a]);
                    }
                } else {
                    inputs[a].onchange = pd.options;
                }
            }
            inputs    = document.getElementsByTagName("button");
            inputsLen = inputs.length;
            for (a = 0; a < inputsLen; a += 1) {
                name = inputs[a].getAttribute("class");
                id   = inputs[a].getAttribute("id");
                if (name === null) {
                    if (inputs[a].value === "Execute") {
                        inputs[a].onclick = pd.recycle;
                    } else if (id === "resetOptions") {
                        inputs[a].onclick = pd.reset;
                    } else if (id === "hideOptions") {
                        inputs[a].onclick = pd.hideOptions;
                    }
                } else if (name === "minimize") {
                    inputs[a].onclick = pd.minimize;
                } else if (name === "maximize") {
                    inputs[a].onclick = pd.maximize;
                    if (pd.settings[inputs[a].parentNode.parentNode.getAttribute("id")] !== undefined && pd.settings[inputs[a].parentNode.parentNode.getAttribute("id")].max === true) {
                        inputs[a].click();
                    }
                } else if (name === "resize") {
                    inputs[a].onmousedown = resize;
                } else if (name === "save") {
                    node  = inputs[a];
                    title = inputs[a].parentNode;
                    if (title.nodeName.toLowerCase() === "a") {
                        if (pd.test.agent.indexOf("firefox") < 0 && pd.test.agent.indexOf("presto") < 0) {
                            buttons      = title.parentNode;
                            node.onclick = save;
                            title.removeChild(node);
                            buttons.removeChild(title);
                            buttons.insertBefore(node, buttons.firstChild);
                        } else {
                            title.onclick = save;
                        }
                    } else {
                        node.onclick = save;
                    }
                }
            }
            if (pd.o.save !== null) {
                pd.o.save.onclick = savecheck;
            }
            node = pd.$$("thirdparties");
            if (node !== null) {
                inputs    = node.getElementsByTagName("a");
                inputsLen = inputs.length;
                for (a = 0; a < inputsLen; a += 1) {
                    inputs[a].onclick = thirdparty;
                }
            }
            //webkit users get sucky textareas, because they refuse to
            //accept bugs related to long scrolling errors
            node = pd.$$("update");
            if (node !== null && typeof edition === "object") {
                node.innerHTML = (function dom__load_doc_conversion() {
                    var str   = String(edition.latest),
                        list  = [
                            str.charAt(0) + str.charAt(1), Number(str.charAt(2) + str.charAt(3)), str.charAt(4) + str.charAt(5)
                        ],
                        month = [
                            "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
                        ];
                    list[1] -= 1;
                    if (list[2].charAt(0) === "0") {
                        list[2] = list[2].substr(1);
                    }
                    return "Updated: " + list[2] + " " + month[list[1]] + " 20" + list[0] + "<span>Version: <span>" + edition.version + "</span></span>";
                }());
            }
            if (pd.o.comment !== null) {
                if (pd.commentString.length === 0) {
                    pd.o.comment.innerHTML = "/*prettydiff.com */";
                } else if (pd.commentString.length === 1) {
                    pd.o.comment.innerHTML = "/*prettydiff.com " + pd.commentString[0] + " */";
                } else {
                    pd.o.comment.innerHTML = "/*prettydiff.com " + pd.commentString.join(", ") + " */";
                }
            }
            node = pd.$$("button-primary");
            if (node !== null) {
                node.onmouseover = pd.comment;
            }
            node = pd.$$("feedsubmit");
            if (node !== null) {
                node.onclick = pd.feedsubmit;
            }
            if (typeof location === "object" && typeof location.href === "string" && location.href.indexOf("?") > -1) {
                (function dom__load_queryString() {
                    var b        = 0,
                        c        = 0,
                        color    = pd.$$("colorScheme"),
                        colors   = (color !== null) ? color.getElementsByTagName("option") : [],
                        options  = (pd.o.lang !== null) ? pd.o.lang.getElementsByTagName("option") : [],
                        params   = location.href.split("?")[1].split("&"),
                        paramLen = params.length,
                        value    = "",
                        source   = "",
                        diff     = "";
                    for (b = 0; b < paramLen; b += 1) {
                        if (params[b].indexOf("m=") === 0) {
                            value = params[b].toLowerCase().substr(2);
                            if (value === "beautify" && pd.o.modeBeau !== null) {
                                pd.prettyvis(pd.o.modeBeau);
                            } else if (value === "minify" && pd.o.modeMinn !== null) {
                                pd.prettyvis(pd.o.modeMinn);
                            } else if (value === "diff" && pd.o.modeDiff !== null) {
                                pd.prettyvis(pd.o.modeDiff);
                            }
                        } else if (params[b].indexOf("s=") === 0) {
                            source = params[b].substr(2);
                        } else if (params[b].indexOf("d=") === 0 && pd.o.codeDiffNew !== null) {
                            diff = params[b].substr(2);
                            if (pd.o.codeDiffNew !== null) {
                                if (pd.test.cm === true) {
                                    pd.cm.diffNew.setValue(diff);
                                } else {
                                    pd.o.codeDiffNew.value = diff;
                                }
                            }
                        } else if (params[b].toLowerCase() === "html" && pd.o.lang !== null) {
                            for (c = options.length - 1; c > -1; c -= 1) {
                                if (options[c].value === "html") {
                                    pd.o.lang.selectedIndex = c;
                                    pd.codeOps(pd.o.lang);
                                    break;
                                }
                            }
                        } else if (params[b].indexOf("l=") === 0 && pd.o.lang !== null) {
                            value = params[b].toLowerCase().substr(2);
                            for (c = options.length - 1; c > -1; c -= 1) {
                                if (value === "text") {
                                    pd.prettyvis(pd.o.modeDiff);
                                }
                                if (options[c].value === value || (options[c].value === "javascript" && (value === "js" || value === "json")) || (options[c].value === "css" && value === "scss") || (options[c].value === "markup" && (value === "xml" || value === "sgml" || value === "jstl"))) {
                                    pd.o.lang.selectedIndex = c;
                                    pd.codeOps(pd.o.lang);
                                    break;
                                }
                            }
                        } else if (params[b].indexOf("c=") === 0) {
                            value = params[b].toLowerCase().substr(2);
                            for (c = colors.length - 1; c > -1; c -= 1) {
                                if (colors[c].innerHTML.toLowerCase() === value) {
                                    color.selectedIndex = c;
                                    pd.colorScheme(color);
                                    break;
                                }
                            }
                            if (pd.test.cm === true) {
                                if (value === "javascript") {
                                    pd.cm.diffBase.setOption("mode", "javascript");
                                    pd.cm.diffNew.setOption("mode", "javascript");
                                    pd.cm.beauIn.setOption("mode", "javascript");
                                    pd.cm.beauOut.setOption("mode", "javascript");
                                    pd.cm.minnIn.setOption("mode", "javascript");
                                    pd.cm.minnOut.setOption("mode", "javascript");
                                } else if (value === "html") {
                                    pd.cm.diffBase.setOption("mode", "htmlembedded");
                                    pd.cm.diffNew.setOption("mode", "htmlembedded");
                                    pd.cm.beauIn.setOption("mode", "htmlembedded");
                                    pd.cm.beauOut.setOption("mode", "htmlembedded");
                                    pd.cm.minnIn.setOption("mode", "htmlembedded");
                                    pd.cm.minnOut.setOption("mode", "htmlembedded");
                                } else if (id === "css") {
                                    pd.cm.diffBase.setOption("mode", "text/x-scss");
                                    pd.cm.diffNew.setOption("mode", "text/x-scss");
                                    pd.cm.beauIn.setOption("mode", "text/x-scss");
                                    pd.cm.beauOut.setOption("mode", "text/x-scss");
                                    pd.cm.minnIn.setOption("mode", "text/x-scss");
                                    pd.cm.minnOut.setOption("mode", "text/x-scss");
                                } else if (id === "markup") {
                                    pd.cm.diffBase.setOption("mode", "xml");
                                    pd.cm.diffNew.setOption("mode", "xml");
                                    pd.cm.beauIn.setOption("mode", "xml");
                                    pd.cm.beauOut.setOption("mode", "xml");
                                    pd.cm.minnIn.setOption("mode", "xml");
                                    pd.cm.minnOut.setOption("mode", "xml");
                                } else if (id === "text") {
                                    pd.cm.diffBase.setOption("mode", null);
                                    pd.cm.diffNew.setOption("mode", null);
                                    pd.cm.beauIn.setOption("mode", null);
                                    pd.cm.beauOut.setOption("mode", null);
                                    pd.cm.minnIn.setOption("mode", null);
                                    pd.cm.minnOut.setOption("mode", null);
                                } else {
                                    pd.cm.diffBase.setOption("mode", value);
                                    pd.cm.diffNew.setOption("mode", value);
                                    pd.cm.beauIn.setOption("mode", value);
                                    pd.cm.beauOut.setOption("mode", value);
                                    pd.cm.minnIn.setOption("mode", value);
                                    pd.cm.minnOut.setOption("mode", value);
                                }
                            }
                        } else if (params[b].indexOf("jsscope") === 0) {
                            if (pd.o.jsscope !== null) {
                                pd.o.jsscope.checked = true;
                            }
                            pd.hideBeauOut(pd.o.jsscope);
                        } else if (params[b].indexOf("jscorrect") === 0) {
                            node = pd.$$("jscorrect-yes");
                            if (node !== null) {
                                node.checked = true;
                            }
                        } else if (params[b].indexOf("html") === 0) {
                            node = pd.$$("html-yes");
                            if (node !== null) {
                                pd.options(node);
                            }
                            node = pd.$$("htmld-yes");
                            if (node !== null) {
                                pd.options(node);
                            }
                            value = params[b].toLowerCase().substr(2);
                            for (c = options.length - 1; c > -1; c -= 1) {
                                if (options[c].value === "html") {
                                    pd.o.lang.selectedIndex = c;
                                    pd.codeOps(pd.o.lang);
                                    break;
                                }
                            }
                            if (pd.test.cm === true) {
                                pd.cm.diffBase.setOption("mode", "htmlembedded");
                                pd.cm.diffNew.setOption("mode", "htmlembedded");
                                pd.cm.beauIn.setOption("mode", "htmlembedded");
                                pd.cm.beauOut.setOption("mode", "htmlembedded");
                                pd.cm.minnIn.setOption("mode", "htmlembedded");
                                pd.cm.minnOut.setOption("mode", "htmlembedded");
                            }
                        }
                    }
                    if (source !== "") {
                        if (pd.o.codeBeauIn !== null && pd.mode === "beau") {
                            if (pd.test.cm === true) {
                                pd.cm.beauIn.setValue(source);
                            } else {
                                pd.o.codeBeauIn.value = source;
                            }
                            pd.recycle();
                        } else if (pd.o.codeMinnIn !== null && pd.mode === "minn") {
                            if (pd.test.cm === true) {
                                pd.cm.minnIn.setValue(source);
                            } else {
                                pd.o.codeMinnIn.value = source;
                            }
                            pd.recycle();
                        } else if (pd.o.codeDiffBase !== null && pd.mode === "diff") {
                            if (pd.test.cm === true) {
                                pd.cm.diffBase.setValue(source);
                            } else {
                                pd.o.codeDiffBase.value = source;
                            }
                            if (diff !== "") {
                                pd.recycle();
                            }
                        }
                    }
                }());
            }
            if (pd.mode === "diff") {
                if (pd.o.codeDiffBase !== null) {
                    if (pd.test.cm === true) {
                        pd.o.codeDiffBase.onkeyup = function dom__load_langkeyBase() {
                            pd.langkey(pd.cm.diffBase);
                        };
                    }
                    if (pd.test.ls === true && localStorage.codeDiffBase !== undefined) {
                        name = localStorage.codeDiffBase;
                        if ((/^(\s+)$/).test(name) === true) {
                            name = "";
                        }
                        if (pd.test.cm === true) {
                            if (langtest === true && lang === "auto") {
                                id = pd.auto(name);
                                if (id === "html") {
                                    id = "htmlembedded";
                                } else if (id === "css") {
                                    id = "text/x-scss";
                                } else if (id === "markup") {
                                    id = "xml";
                                }
                                if (id === "text") {
                                    pd.cm.diffBase.setOption("mode", null);
                                } else {
                                    pd.cm.diffBase.setOption("mode", id);
                                }
                            }
                            pd.cm.diffBase.setValue(name);
                        } else {
                            pd.o.codeDiffBase.value = name;
                        }
                    } else if (pd.test.cm === true) {
                        pd.cm.diffBase.setValue(" ");
                    }
                }
                if (pd.o.codeDiffNew !== null) {
                    if (pd.test.cm === true) {
                        pd.o.codeDiffNew.onkeyup = function dom__load_langkeyBase() {
                            pd.langkey(pd.cm.diffNew);
                        };
                    }
                    if (pd.test.ls === true && localStorage.codeDiffNew !== undefined) {
                        name = localStorage.codeDiffNew;
                        if ((/^(\s+)$/).test(name) === true) {
                            name = "";
                        }
                        if (pd.test.cm === true) {
                            if (langtest === true && lang === "auto") {
                                id = pd.auto(name);
                                if (id === "html") {
                                    id = "htmlembedded";
                                } else if (id === "css") {
                                    id = "text/x-scss";
                                } else if (id === "markup") {
                                    id = "xml";
                                }
                                if (id === "text") {
                                    pd.cm.diffNew.setOption("mode", null);
                                } else {
                                    pd.cm.diffNew.setOption("mode", id);
                                }
                            }
                            pd.cm.diffNew.setValue(name);
                        } else {
                            pd.o.codeDiffNew.value = name;
                        }
                    } else if (pd.test.cm === true) {
                        pd.cm.diffNew.setValue(" ");
                    }
                }
                pd.test.render.diff = true;
            }
            if (pd.test.cm === true) {
                node = pd.$$("minn-quan");
                if (node !== null) {
                    node.parentNode.parentNode.style.display = "block";
                }
                node = pd.$$("minn-space");
                if (node !== null) {
                    node.parentNode.parentNode.style.display = "block";
                }
            }
            if (pd.settings.feedback === undefined) {
                pd.settings.feedback = {
                    newb   : false,
                    veteran: false
                };
            }
            if (pd.settings.feedback.newb === false && pd.stat.usage > 2 && pd.stat.visit < 5 && pd.test.domain === true && pd.o.report.feed.box !== null) {
                pd.settings.feedback.newb = true;
                node                      = pd.$$("feedintro");
                if (node !== null) {
                    node.innerHTML = "Thank you for trying Pretty Diff. Please let me know what you think of this tool.";
                }
                if (pd.test.json === true && pd.test.ls === true) {
                    localStorage.settings = JSON.stringify(pd.settings);
                }
                pd.o.report.feed.box.getElementsByTagName("button")[0].click();
            }
            if (pd.settings.feedback.veteran === false && pd.stat.usage > 2500 && pd.test.domain === true && pd.o.report.feed.box !== null) {
                pd.settings.feedback.veteran = true;
                if (node !== null) {
                    node.innerHTML = "Thank you for the loyal and frequent use of this tool. Would you mind sparing a few seconds on a brief survey?";
                }
                if (pd.test.json === true && pd.test.ls === true) {
                    localStorage.settings = JSON.stringify(pd.settings);
                }
                pd.o.report.feed.box.getElementsByTagName("button")[0].click();
            }
        }
        if (page === "doc") {
            (function dom__load_doc() {
                var b             = 0,
                    componentArea = {},
                    row           = [],
                    dateCell      = {},
                    dateList      = [],
                    output        = [],
                    rowLen        = 0,
                    date          = 0,
                    lib           = "",
                    colorParam    = (location && location.href && location.href.indexOf("?") > -1) ? location.href.toLowerCase().split("?")[1] : "",
                    conversion    = function dom__load_doc_conversion(dateInstance) {
                        var str   = String(dateInstance),
                            list  = [
                                str.charAt(0) + str.charAt(1), Number(str.charAt(2) + str.charAt(3)), str.charAt(4) + str.charAt(5)
                            ],
                            month = [
                                "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                            ];
                        list[1] -= 1;
                        return list[2] + " " + month[list[1]] + " 20" + list[0];
                    };
                node = pd.$$("colorScheme");
                if (node !== null) {
                    if (localStorage.settings !== undefined && localStorage.settings.indexOf(":undefined") > 0) {
                        localStorage.settings = localStorage.settings.replace(/:undefined/g, ":false");
                    }
                    pd.settings = (pd.test.ls === true && pd.test.json === true && localStorage.settings !== undefined) ? JSON.parse(localStorage.settings) : {};
                    if (colorParam.indexOf("c=") === 0 || colorParam.indexOf("&c=") > -1) {
                        if (colorParam.indexOf("&c=") > -1) {
                            colorParam.substr(colorParam.indexOf("&c=") + 1);
                        }
                        colorParam = colorParam.split("&")[0];
                        colorParam = colorParam.substr(colorParam.indexOf("=") + 1);
                        row        = node.getElementsByTagName("option");
                        rowLen     = row.length;
                        for (b = 0; b < rowLen; b += 1) {
                            if (row[b].value.toLowerCase() === colorParam) {
                                node.selectedIndex = b;
                                break;
                            }
                        }
                    }
                    if (((rowLen > 0 && b !== rowLen) || rowLen === 0) && pd.settings.colorScheme !== undefined) {
                        node.selectedIndex = pd.settings.colorScheme;
                    }
                    pd.colorScheme(node);
                    node.onchange = pd.colorScheme;
                }
                componentArea = pd.$$("components");
                if (componentArea !== null && typeof edition === "object") {
                    componentArea = componentArea.getElementsByTagName("tbody")[0];
                    row           = componentArea.getElementsByTagName("tr");
                    rowLen        = row.length;
                    for (b = 0; b < rowLen; b += 1) {
                        dateCell = row[b].getElementsByTagName("td")[3];
                        lib      = row[b].getElementsByTagName("a")[0].innerHTML;
                        if (lib === "charDecoder.js") {
                            date               = edition.charDecoder;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                        } else if (lib === "csspretty.js") {
                            date               = edition.csspretty;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                        } else if (lib === "csvbeauty.js") {
                            date               = edition.csvbeauty;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                        } else if (lib === "csvmin.js") {
                            date               = edition.csvmin;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                        } else if (lib === "diffview.css") {
                            date               = edition.css;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                        } else if (lib === "diffview.js") {
                            date               = edition.diffview;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                        } else if (lib === "documentation.xhtml") {
                            date               = edition.documentation;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                        } else if (lib === "dom.js") {
                            date               = edition.api.dom;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                        } else if (lib === "jspretty.js") {
                            date               = edition.jspretty;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                        } else if (lib === "markup_beauty.js") {
                            date               = edition.markup_beauty;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                        } else if (lib === "markupmin.js") {
                            date               = edition.markupmin;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                        } else if (lib === "node-local.js") {
                            date               = edition.api.nodeLocal;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                        } else if (lib === "prettydiff.com.xhtml") {
                            date               = edition.webtool;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                        } else if (lib === "prettydiff.js") {
                            date               = edition.prettydiff;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                        } else if (lib === "prettydiff.wsf") {
                            date               = edition.api.wsh;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                        } else if (lib === "codemirror.css") {
                            date               = edition.addon.cmcss;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                        } else if (lib === "codemirror.js") {
                            date               = edition.addon.cmjs;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                        }
                    }
                    rowLen   = dateList.length;
                    dateList = dateList.sort(function dom__load_sort_forward(componentArea, row) {
                        return componentArea[1] === row[1];
                    }).reverse().sort(function dom__load_sort_reverse(componentArea, row) {
                        return componentArea[0] - row[0];
                    });
                    for (b = dateList.length - 1; b > -1; b -= 1) {
                        output.push("<tr>");
                        output.push(dateList[b][1]);
                        output.push("</tr>");
                    }
                    componentArea.innerHTML = output.join("");
                }
                (function dom__foldSearch() {
                    var div   = document.getElementsByTagName("div"),
                        len   = div.length,
                        inca  = 0,
                        incb  = 0,
                        ol    = [],
                        li    = [],
                        lilen = 0;
                    for (inca = 0; inca < len; inca += 1) {
                        if (div[inca].getAttribute("class") === "beautify") {
                            ol = div[inca].getElementsByTagName("ol");
                            if (ol[0].getAttribute("class") === "count") {
                                li    = ol[0].getElementsByTagName("li");
                                lilen = li.length;
                                for (incb = 0; incb < lilen; incb += 1) {
                                    if (li[incb].getAttribute("class") === "fold") {
                                        li[incb].onmousedown = pd.beaufold;
                                    }
                                }
                            }
                        }
                    }
                }());
            }());
        }
        pd.test.load = false;
    }());
}());