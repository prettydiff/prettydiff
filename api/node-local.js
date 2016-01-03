/*prettydiff.com api.topcoms: true, api.insize: 4, api.inchar: " ", api.vertical: true */
/***********************************************************************
 node-local is written by Austin Cheney on 6 Nov 2012.  Anybody may use
 this code without permission so long as this comment exists verbatim in
 each instance of its use.

 http://www.travelocity.com/
 http://mailmarkup.org/
 http://prettydiff.com/
 **********************************************************************/
/*

http://prettydiff.com/

Command line API for Prettydiff for local execution only.  This API is
not intended for execution as a service on a remote server.

Arguments entered from the command line are separated by spaces and
values are separated from argument names by a colon.  For safety
argument values should always be quoted.

Examples:

> node node-local.js source:"c:\mydirectory\myfile.js" readmethod:"file"
 diff:"c:\myotherfile.js"
> node node-local.js source:"c:\mydirectory\myfile.js" mode:"beautify"
 readmethod:"file" output:"c:\output\otherfile.js"
> node node-local.js source:"../package.json" mode:"beautify"
 readmethod:"filescreen"
*/

(function pdNodeLocal() {
    "use strict";
    var localPath      = (process.cwd() === "/" || (/^([a-z]:\\)$/).test(process.cwd()) === true)
            ? __dirname.replace(/(api)$/, "")
            : "../",
        cwd            = (process.cwd() === "/")
            ? __dirname
            : process.cwd(),
        libs           = (function pdNodeLocal__libs() {
            global.safeSort     = require(localPath + "lib/safeSort.js").api;
            global.csspretty    = require(localPath + "lib/csspretty.js").api;
            global.csvpretty    = require(localPath + "lib/csvpretty.js").api;
            global.diffview     = require(localPath + "lib/diffview.js").api;
            global.jspretty     = require(localPath + "lib/jspretty.js").api;
            global.markuppretty = require(localPath + "lib/markuppretty.js").api;
            global.jsxstatus    = global.jspretty.jsxstatus;
            return localPath;
        }()),
        prettydiff     = require(libs + "prettydiff.js"),
        fs             = require("fs"),
        http           = require("http"),
        path           = require("path"),
        sfiledump      = [],
        dfiledump      = [],
        sState         = [],
        dState         = [],
        clidata        = [
            [], [], []
        ],
        lf             = "\n",
        method         = "auto",
        startTime      = Date.now(),
        versionString  = (function pdNodeLocal__versionString() {
            var dstring = "",
                mstring = 0,
                month   = [
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December"
                ];
            global.edition = prettydiff.edition;
            global.report  = prettydiff.report;
            dstring        = global
                .edition
                .latest
                .toString();
            mstring        = Number(dstring.slice(2, 4)) - 1;
            return "\x1B[36mVersion\x1B[39m: " + global.edition.version + " \x1B[36mDated\x1B[39m: " + dstring.slice(4, 6) + " " + month[mstring] + " 20" + dstring.slice(0, 2);
        }()),
        dir            = [
            0, 0, 0
        ],
        address        = {
            dabspath: "",
            dorgpath: "",
            oabspath: "",
            oorgpath: "",
            sabspath: "",
            sorgpath: ""
        },
        help           = false,
        diffCount      = [
            0, 0
        ],
        total          = [
            0, 0
        ],
        options        = {
            api            : "node",
            braceline      : false,
            bracepadding   : false,
            braces         : "knr",
            color          : "white",
            comments       : "indent",
            commline       : false,
            conditional    : false,
            content        : false,
            context        : "",
            correct        : false,
            crlf           : false,
            cssinsertlines : false,
            csvchar        : ",",
            diff           : "",
            diffcli        : false,
            diffcomments   : false,
            difflabel      : "new",
            diffspaceignore: false,
            diffview       : "sidebyside",
            dustjs         : false,
            elseline       : false,
            endcomma       : false,
            force_indent   : false,
            html           : false,
            inchar         : " ",
            inlevel        : 0,
            insize         : 4,
            jsscope        : "none",
            lang           : "auto",
            langdefault    : "text",
            methodchain    : "indent",
            miniwrap       : false,
            mode           : "diff",
            neverflatten   : false,
            nocaseindent   : false,
            noleadzero     : false,
            objsort        : "js",
            output         : "",
            preserve       : "all",
            quote          : false,
            quoteConvert   : "none",
            readmethod     : "screen",
            report         : true,
            selectorlist   : false,
            semicolon      : false,
            source         : "",
            sourcelabel    : "base",
            space          : true,
            spaceclose     : false,
            style          : "indent",
            styleguide     : "none",
            summaryonly    : false,
            tagmerge       : false,
            tagsort        : false,
            ternaryline    : false,
            textpreserve   : false,
            titanium       : false,
            topcoms        : false,
            varword        : "none",
            version        : false,
            vertical       : "js",
            wrap           : 80
        },
        colors         = {
            del     : {
                charEnd  : "\x1B[22m",
                charStart: "\x1B[1m",
                lineEnd  : "\x1B[39m",
                lineStart: "\x1B[31m"
            },
            filepath: {
                end  : "\x1B[39m",
                start: "\x1B[36m"
            },
            ins     : {
                charEnd  : "\x1B[22m",
                charStart: "\x1B[1m",
                lineEnd  : "\x1B[39m",
                lineStart: "\x1B[32m"
            }
        },

        //ending messaging with stats
        ender          = function pdNodeLocal__ender() {
            var plural = (function pdNodeLocal__ender_plural() {
                    var a   = 0,
                        len = diffCount.length,
                        arr = [];
                    for (a = 0; a < len; a += 1) {
                        if (diffCount[a] === 1) {
                            arr.push("");
                        } else {
                            arr.push("s");
                        }
                    }
                    if (clidata[1].length === 1) {
                        arr.push("");
                    } else {
                        arr.push("s");
                    }
                    if (clidata[0].length === 1) {
                        arr.push("");
                    } else {
                        arr.push("s");
                    }
                    return arr;
                }()),
                log    = [],
                time   = 0;

            //indexes of diffCount array
            //0 - total number of differences
            //1 - the number of files containing those differences
            //last - total file count (not counting (sub)directories)
            if ((method !== "directory" && method !== "subdirectory") || sfiledump.length === 1) {
                diffCount[1] = 1;
                diffCount.push("1 file");
                plural[1] = "";
            } else {
                diffCount.push(sfiledump.length + " files");
            }
            if (options.diffcli === true && options.mode === "diff") {
                if (options.summaryonly === true && clidata[2].length > 0) {
                    log.push(lf + "Files changed:" + lf);
                    log.push(colors.filepath.start);
                    log.push(clidata[2].join(lf));
                    log.push(colors.filepath.end);
                    log.push(lf + lf);
                }
                if (clidata[0].length > 0) {
                    log.push(lf + "Files deleted:" + lf);
                    log.push(colors.del.lineStart);
                    log.push(clidata[0].join(lf));
                    log.push(colors.del.lineEnd);
                    log.push(lf + lf);
                }
                if (clidata[1].length > 0) {
                    log.push(lf + "Files inserted:" + lf);
                    log.push(colors.ins.lineStart);
                    log.push(clidata[1].join(lf));
                    log.push(colors.ins.lineEnd);
                    log.push(lf + lf);
                }
            }
            log.push(lf + "Pretty Diff ");
            if (options.mode === "diff") {
                if (method !== "directory" && method !== "subdirectory") {
                    log.push("found ");
                    log.push(diffCount[0]);
                    log.push(" difference");
                    log.push(plural[0]);
                    log.push(". ");
                } else {
                    log.push("found ");
                    log.push(diffCount[0]);
                    log.push(" difference");
                    log.push(plural[0]);
                    log.push(" in ");
                    log.push(diffCount[1]);
                    log.push(" file");
                    log.push(plural[1]);
                    log.push(" out of ");
                }
            } else if (options.mode === "beautify") {
                log.push("beautified ");
            } else if (options.mode === "minify") {
                log.push("minified ");
            }
            if (options.mode !== "diff" || method === "directory" || method === "subdirectory") {
                log.push(diffCount[diffCount.length - 1]);
                log.push(". ");
            }
            if (options.mode === "diff" && (method === "directory" || method === "subdirectory")) {
                log.push(clidata[1].length);
                log.push(" file");
                log.push(plural[2]);
                log.push(" added. ");
                log.push(clidata[0].length);
                log.push(" file");
                log.push(plural[3]);
                log.push(" deleted. Executed in ");
            } else {
                log.push("Executed in ");
            }
            time = (Date.now() - startTime) / 1000;
            log.push(time);
            log.push(" second");
            if (time !== 1) {
                log.push("s");
            }
            log.push("." + lf);
            console.log(log.join(""));
        },

        //extract errorcount from diff
        //report files for ender stats
        counter        = function pdNodeLocal__counter(x) {
            var num = Number(x.substring(14, x.indexOf("</em>")));
            if (num > 0) {
                diffCount[0] += num;
                diffCount[1] += 1;
            }
            return x;
        },

        //html report template
        reports        = function pdNodeLocal__reports() {
            var result = prettydiff.api(options),
                css    = {
                    core   : "body{font-family:'Arial';font-size:10px;overflow-y:scroll}#announcement.big{colo" +
                                 "r:#00c;font-weight:bold;height:auto;left:14em;margin:0;overflow:hidden;position:" +
                                 "absolute;text-overflow:ellipsis;top:4.5em;white-space:nowrap;width:50%;z-index:5" +
                                 "}#announcement.big strong.duplicate{display:block}#announcement.big span{display" +
                                 ":block}#announcement.normal{color:#000;font-weight:normal;height:2.5em;margin:0 " +
                                 "-5em -4.75em;position:static;width:27.5em}#apireturn textarea{font-size:1.2em;he" +
                                 "ight:50em;width:100%}#apitest input,#apitest label,#apitest select,#apitest text" +
                                 "area{float:left}#apitest input,#apitest select,#apitest textarea{width:30em}#api" +
                                 "test label{width:20em}#apitest p{clear:both;padding-top:0.75em}#beau-other-span," +
                                 "#diff-other-span{left:-20em;position:absolute;width:0}#beauops p strong,#options" +
                                 " p strong,#diffops p strong,#miniops p strong,#options .label,#diffops .label,#m" +
                                 "iniops .label,#beauops .label{display:block;float:left;font-size:1.2em;font-weig" +
                                 "ht:bold;margin-bottom:1em;width:17.5em}#beauops span strong,#miniops span strong" +
                                 ",#diffops span strong{display:inline;float:none;font-size:1em;width:auto}#feedre" +
                                 "port{right:38.8em}#beautyinput,#minifyinput,#baseText,#newText,#beautyoutput,#mi" +
                                 "nifyoutput{font-size:1em}#Beautify,#Minify,#diffBase,#diffNew{border-radius:0.4e" +
                                 "m;padding:1em 1.25em 0}#Beautify .input,#Minify .input,#Beautify .output,#Minify" +
                                 " .output{width:49%}#Beautify .input label,#Beautify .output label,#Minify .input" +
                                 " label,#Minify .output label{display:block;font-size:1.05em;font-weight:bold}#Be" +
                                 "autify p.file,#Minify p.file{clear:none;float:none}#Beautify textarea,#Minify te" +
                                 "xtarea{margin-bottom:0.75em}#checklist_option li{font-weight:bold}#checklist_opt" +
                                 "ion li li{font-weight:normal}#codeInput{margin-bottom:1em;margin-top:-3.5em}#cod" +
                                 "eInput #diffBase p,#codeInput #diffNew p{clear:both;float:none}#codeInput .input" +
                                 "{clear:none;float:left}#codeInput .output{clear:none;float:right;margin-top:-2.4" +
                                 "em}#cssreport.doc table{position:absolute}#css-size{left:24em}#css-uri{left:40em" +
                                 "}#css-uri td{text-align:left}#csvchar{width:11.8em}#dcolorScheme{float:right;mar" +
                                 "gin:-2em 0 0}#dcolorScheme label{display:inline-block;font-size:1em}#diff .addso" +
                                 "urce{cursor:pointer;margin-bottom:1em;padding:0}#diff .addsource input{display:b" +
                                 "lock;float:left;margin:0.5em 0.5em -1.5em}#diff .addsource label{cursor:pointer;" +
                                 "display:inline-block;font-size:1.2em;padding:0.5em 0.5em 0.5em 2em}#diffBase,#di" +
                                 "ffNew,#Beautify,#Minify,#doc div,#doc div div,#doc ol,#option_comment,#update,#t" +
                                 "hirdparties img,#diffoutput #thirdparties,.box h3.heading,.box .body,.options,.d" +
                                 "iff .replace em,.diff .delete em,.diff .insert em,button,fieldset{border-style:s" +
                                 "olid;border-width:0.1em}#diffBase,#diffNew{padding:1.25em 1%;width:47%}#diffBase" +
                                 " textarea,#diffNew textarea{width:99.5%}#diffBase{float:left;margin-right:1%}#di" +
                                 "ffNew{float:right}#diffoutput{width:100%}#diffoutput #thirdparties li{display:in" +
                                 "line-block;list-style-type:none}#diffoutput li em,#diffoutput p em,.analysis .ba" +
                                 "d,.analysis .good{font-weight:bold}#diffoutput ul{font-size:1.2em;margin-top:1em" +
                                 "}#diffoutput ul li{display:list-item;list-style-type:disc}#displayOps{float:righ" +
                                 "t;font-size:1.5em;font-weight:bold;margin:0 1em 0 0;position:relative;width:22.5" +
                                 "em;z-index:10}#displayOps #displayOps-hide{clear:both;float:none;position:absolu" +
                                 "te;top:-20em}#displayOps.default{position:static}#displayOps.maximized{margin-bo" +
                                 "ttom:-2em;position:relative}#displayOps a{border-style:solid;border-width:0.1em;" +
                                 "height:1.2em;line-height:1.4;margin:0.1em 0 0 5em;padding:0.05em 0 0.3em;text-al" +
                                 "ign:center;text-decoration:none}#displayOps button,#displayOps a{font-size:1em}#" +
                                 "displayOps li{clear:none;display:block;float:left;list-style:none;margin:0;text-" +
                                 "align:right;width:9em}#doc_contents a{text-decoration:none}#doc_contents ol{padd" +
                                 "ing-bottom:1em}#doc_contents ol ol li{font-size:0.75em;list-style:lower-alpha;ma" +
                                 "rgin:0.5em 0 1em 3em}#doc #doc_contents ol ol{background-color:inherit;border-st" +
                                 "yle:none;margin:0.25em 0.3em 0 0;padding-bottom:0}#doc div.beautify{border-style" +
                                 ":none}#doc #execution h3{background:transparent;border-style:none;font-size:1em;" +
                                 "font-weight:bold}#doc code,.doc code{display:block;font-family:'Courier New',Cou" +
                                 "rier,'Lucida Console',monospace;font-size:1.1em}#doc div,.doc div{margin-bottom:" +
                                 "2em;padding:0 0.5em 0.5em}#doc div div,.doc div div{clear:both;margin-bottom:1em" +
                                 "}#doc em,.doc em,.box .body em{font-style:normal;font-weight:bold}#doc h2,.doc h" +
                                 "2{font-size:1.6em;margin:0.5em 0.5em 0.5em 0}#doc h3,.doc h3{margin-top:0.5em}#d" +
                                 "oc ol,.doc ol{clear:both;padding:0}#doc ol li span,.doc ol li span{display:block" +
                                 ";margin-left:2em}#doc ol ol,#doc ul ol,.doc ol ol,.doc ul ol{margin-right:0.5em}" +
                                 "#doc td span,.doc td span{display:block}#doc table,.doc table,.box .body table{b" +
                                 "order-collapse:collapse;border-style:solid;border-width:0.2em;clear:both}#doc ta" +
                                 "ble,.doc table{font-size:1.2em}#doc td,#doc th,.doc td,.doc th{border-left-style" +
                                 ":solid;border-left-width:0.1em;border-top-style:solid;border-top-width:0.1em;pad" +
                                 "ding:0.5em}#doc th,.doc th{font-weight:bold}#doc ul,.doc ul{margin-top:1em}#doc " +
                                 "ul li,.doc ul li{font-size:1.2em}#feedemail{display:block;width:100%}#feedreport" +
                                 "body{text-align:center}#feedreportbody .radiogroup .feedlabel{display:block;marg" +
                                 "in:0 0 1em;width:auto;font-size:1.4em}#feedreportbody .radiogroup span{margin:0 " +
                                 "0 2em;display:inline-block;width:5em}#feedreportbody .radiogroup input{position:" +
                                 "absolute;top:-2000em}#feedreportbody .radiogroup label{display:inline-block;bord" +
                                 "er-style:solid;border-width:0.1em;line-height:1.5;text-align:center;height:1.5em" +
                                 ";width:1.5em;border-radius:50%;cursor:pointer}#feedreportbody .radiogroup span s" +
                                 "pan{font-size:0.8em;display:block;margin:0;width:auto}#feedsubmit{position:stati" +
                                 "c;width:50%;float:none;text-shadow:none;height:3em;margin:2.5em auto 0;font-fami" +
                                 "ly:inherit}#function_properties h4{font-size:1.2em;float:none}#function_properti" +
                                 "es h4 strong{color:#c00}#function_properties h5{margin:0 0 0 -2.5em;font-size:1e" +
                                 "m}#function_properties ol{padding-right:1em}#functionGroup.append{border-radius:" +
                                 "0.2em;border-style:solid;border-width:0.1em;padding:0.7em 1.2em;position:relativ" +
                                 "e;top:-2.625em}#functionGroup.append input{cursor:pointer}#functionGroup.append " +
                                 "label{cursor:pointer;font-size:1em}#functionGroup.append span{display:inline-blo" +
                                 "ck;margin-left:2em}#hideOptions{margin-left:5em}#introduction{clear:both;margin:" +
                                 "0 0 0 5.6em;position:relative;top:-2.75em}#introduction .information,#webtool #i" +
                                 "ntroduction h2{left:-90em;position:absolute;top:0;width:10em}#introduction h2{fl" +
                                 "oat:none}#introduction li{clear:none;display:block;float:left;font-size:1.4em;ma" +
                                 "rgin:0 4.95em -1em 0}#introduction li li{font-size:1em;margin-left:2em}#introduc" +
                                 "tion ul{clear:both;height:3em;margin:0 0 0 -5.5em;overflow:hidden;width:100em}#m" +
                                 "odalSave p{background:#eee;color:#333;font-size:3em;padding:1em;position:absolut" +
                                 "e;text-align:center;top:10em;width:25em;z-index:9001}#modalSave p em{display:blo" +
                                 "ck;font-size:0.75em;margin-top:1em}#modalSave p strong{color:#c00;font-weight:bo" +
                                 "ld}#modalSave span{background:#000;display:block;left:0;opacity:0.5;position:abs" +
                                 "olute;top:0;z-index:9000}#codereport{right:19.8em}#option_comment{font-size:1.2e" +
                                 "m;height:2.5em;margin-bottom:-1.5em;width:100%}#option_commentClear{float:right;" +
                                 "height:2em;margin:-0.5em -0.25em 0 0;padding:0;width:15em}#options{margin:0 0 1e" +
                                 "m}#options label{width:auto}#options p,#addOptions p{clear:both;font-size:1em;ma" +
                                 "rgin:0;padding:1em 0 0}#options p span{height:2em;margin:0 0 0 1em}#pdsamples{li" +
                                 "st-style-position:inside;margin:0;padding:0;position:relative;z-index:10}#pdsamp" +
                                 "les li{border-radius:1em;border-style:solid;border-width:0.1em;margin:0 0 3em;pa" +
                                 "dding:1em}#pdsamples li div{border-radius:1em;border-style:solid;border-width:0." +
                                 "1em;margin:0;padding:1em}#pdsamples li p{display:inline-block;font-size:1em;marg" +
                                 "in:0}#pdsamples li p a{display:block;margin:0 0 1em 2em}#pdsamples li ul{margin:" +
                                 "0 0 0 2em}#reports{height:4em}#reports h2{display:none}#samples #dcolorScheme{po" +
                                 "sition:relative;z-index:1000}#samples #pdsamples li li{background:none transpare" +
                                 "nt;border-style:none;display:list-item;list-style:disc outside;margin:0;padding:" +
                                 "0.5em}#samples h1{float:none}#samples h2{float:none;font-size:1.5em;border-style" +
                                 ":none;margin:1em 0}#showOptionsCallOut{background:#fff;border:0.1em solid #000;b" +
                                 "ox-shadow:0.2em 0.2em 0.4em rgba(0,0,0,.15);left:28.6%;padding:0.5em;position:ab" +
                                 "solute;top:4.6em;width:20%;z-index:1000}#showOptionsCallOut a{color:#66f;font-we" +
                                 "ight:bold}#showOptionsCallOut em{color:#c00}#showOptionsCallOut strong{color:#09" +
                                 "0}#statreport{right:0.8em}#statreport .body p,#statreport .body li,#statreport ." +
                                 "body h3{font-size:1.2em}#statreport .body h3{margin-top:0}#statreport .body ul{m" +
                                 "argin-top:1em}#textareaTabKey{position:absolute;border-width:0.1em;border-style:" +
                                 "solid;padding:0.5em;width:24em;right:51%}#textareaTabKey strong{text-decoration:" +
                                 "underline}#textreport{width:100%}#thirdparties a{border-style:none;display:block" +
                                 ";height:4em;text-decoration:none}#title_text{border-style:solid;border-width:0.0" +
                                 "5em;display:block;float:left;font-size:1em;margin-left:0.55em;padding:0.1em}#top" +
                                 "{left:0;overflow:scroll;position:absolute;top:-200em;width:1em}#top em{font-weig" +
                                 "ht:bold}#update{clear:left;float:right;font-weight:bold;padding:0.5em;position:a" +
                                 "bsolute;right:1.25em;top:4.75em}#webtool .diff h3{border-style:none solid solid;" +
                                 "border-width:0 0.1em 0.2em;box-shadow:none;display:block;font-family:Verdana;mar" +
                                 "gin:0 0 0 -.1em;padding:0.2em 2em;text-align:left}#webtool .options input[type=t" +
                                 "ext]{margin-right:1em;width:11.6em}#webtool .options input[type=text],div input," +
                                 "textarea{border-style:inset;border-width:0.1em}.analysis th{text-align:left}.ana" +
                                 "lysis td{text-align:right}.beautify,.diff{border-style:solid;border-width:0.2em;" +
                                 "display:inline-block;font-family:'Courier New',Courier,'Lucida Console',monospac" +
                                 "e;margin:0 1em 1em 0;position:relative}.beautify .count,.diff .count{border-styl" +
                                 "e:solid;border-width:0 0.1em 0 0;font-weight:normal;padding:0;text-align:right}." +
                                 "beautify .count li,.diff .count li{padding-left:2em}.beautify .count li{padding-" +
                                 "top:0.5em}.beautify .count li.fold,.diff .count li.fold{color:#900;cursor:pointe" +
                                 "r;font-weight:bold;padding-left:0.5em}.beautify .data,.diff .data{text-align:lef" +
                                 "t;white-space:pre}.beautify .data em{display:inline-block;font-style:normal;font" +
                                 "-weight:bold;padding-top:0.5em}.beautify .data li,.diff .data li{padding-left:0." +
                                 "5em;white-space:pre}.beautify li,.diff li{border-style:none none solid;border-wi" +
                                 "dth:0 0 0.1em;display:block;line-height:1.2;list-style-type:none;margin:0;paddin" +
                                 "g-bottom:0;padding-right:0.5em}.beautify ol,.diff ol{display:table-cell;margin:0" +
                                 ";padding:0}.box{border-style:solid;border-width:0;left:auto;margin:0;padding:0;p" +
                                 "osition:absolute;z-index:10}.box button{border-radius:0;border-style:solid;borde" +
                                 "r-width:0.1em;display:block;float:right;font-family:'Lucida Console','Trebuchet " +
                                 "MS','Arial';height:1.75em;padding:0;position:absolute;right:0;text-align:center;" +
                                 "top:0;width:1.75em;z-index:7}.box button.resize{border-width:0.05em;cursor:se-re" +
                                 "size;font-size:1.667em;font-weight:normal;height:0.8em;line-height:0.5em;margin:" +
                                 "-.85em 0 0;position:absolute;right:0.05em;top:100%;width:0.85em}.box button.mini" +
                                 "mize{margin:0.35em 4em 0 0}.box button.maximize{margin:0.35em 1.75em 0 0}.box bu" +
                                 "tton.save{margin:0.35em 6.25em 0 0}.box .buttons{float:right;margin:0}.box h3.he" +
                                 "ading{cursor:pointer;float:left;font-size:1em;height:3em;margin:0 0 -3.2em;posit" +
                                 "ion:relative;width:17em;z-index:6}.box h3.heading span{display:block;font-size:1" +
                                 ".8em;padding:0.25em 0 0 0.5em}.box .body{clear:both;height:20em;margin-top:-.1em" +
                                 ";overflow:scroll;padding:4.25em 1em 1em;position:relative;right:0;top:0;width:75" +
                                 "em;z-index:5}.button{margin:1em 0;text-align:center}.button button{display:block" +
                                 ";font-size:2em;height:1.5em;margin:0 auto;padding:0;width:50%}.clear{clear:both;" +
                                 "display:block}.diff .skip{border-style:none none solid;border-width:0 0 0.1em}.d" +
                                 "iff .diff-left,.diff .diff-right{display:table-cell}.diff .diff-left{border-styl" +
                                 "e:none none none solid;border-width:0 0 0 0.1em}.diff .diff-right{border-style:n" +
                                 "one none none solid;border-width:0 0 0 0.1em;margin-left:-.1em;min-width:16.5em;" +
                                 "right:0;top:0}.diff-right .data ol{min-width:16.5em}.diff-right .data{border-sty" +
                                 "le:none solid none none;border-width:0 0.1em 0 0;width:100%}.diff-right .data li" +
                                 "{min-width:16.5em}.diff li,.diff p,.diff h3,.beautify li{font-size:1.1em}.diff l" +
                                 "i{padding-top:0.5em}.diff li em{font-style:normal;margin:0 -.09em;padding:0.05em" +
                                 " 0}.diff p.author{border-style:solid;border-width:0.2em 0.1em 0.1em;margin:0;ove" +
                                 "rflow:hidden;padding:0.4em;text-align:right}.difflabel{display:block;height:0}.f" +
                                 "ile,.labeltext{font-size:0.9em;font-weight:bold;margin-bottom:1em}.file input,.l" +
                                 "abeltext input{display:inline-block;margin:0 0.7em 0 0;width:16em}.input,.output" +
                                 "{margin:0}.options{border-radius:0.4em;clear:both;margin-bottom:1em;padding:1em " +
                                 "1em 3.5em;width:auto}.options input,.options label{border-style:none;display:blo" +
                                 "ck;float:left}.output label{text-align:right}.options p span label{font-size:1em" +
                                 "}.options p span{display:block;float:left;font-size:1.2em;min-width:14em;padding" +
                                 "-bottom:0.5em}.options select,#csvchar{margin:0 0 0 1em}.options span label{marg" +
                                 "in-left:0.4em}body#doc{font-size:0.8em;margin:0 auto;max-width:80em}body#doc #fu" +
                                 "nction_properties ul{margin:0}body#doc #function_properties ul li{font-size:0.9e" +
                                 "m;margin:0.5em 0 0 4em}body#doc ul li,body#doc ol li{font-size:1.1em}body#doc ta" +
                                 "ble{font-size:1em}button,a.button{border-radius:0.15em;display:block;font-weight" +
                                 ":bold;padding:0.2em 0;width:100%}div .button{text-align:center}div button,div a." +
                                 "button{display:inline-block;font-weight:bold;margin:1em 0;padding:1em 2em}button" +
                                 ":hover,a.button:hover{cursor:pointer}fieldset{border-radius:0.9em;clear:both;mar" +
                                 "gin:3.5em 0 -2em;padding:0 0 0 1em}h1{float:left;font-size:2em;margin:0 0.5em 0." +
                                 "5em 0}h1 svg,h1 img{border-style:solid;border-width:0.05em;float:left;height:1.5" +
                                 "em;margin-right:0.5em;width:1.5em}h1 span{font-size:0.5em}h2,h3{background:#fff;" +
                                 "border-style:solid;border-width:0.075em;display:inline-block;font-size:1.8em;fon" +
                                 "t-weight:bold;margin:0 0.5em 0.5em 0;padding:0 0.2em}h3{font-size:1.6em}h4{font-" +
                                 "size:1.4em}input[type='radio']{margin:0 0.25em}input[type='file']{box-shadow:non" +
                                 "e}label{display:inline;font-size:1.4em}legend{border-style:solid;border-width:0." +
                                 "1em;font-size:1.2em;font-weight:bold;margin-left:-.25em}li{clear:both;margin:1em" +
                                 " 0 1em 3em}li h4{display:inline;float:left;margin:0.4em 0;text-align:left;width:" +
                                 "14em}ol li{font-size:1.4em;list-style-type:decimal}ol li li{font-size:1em}p{clea" +
                                 "r:both;font-size:1.2em;margin:0 0 1em}select{border-style:inset;border-width:0.1" +
                                 "em;width:11.85em}strong.new{background:#ff6;font-style:italic}strong label{font-" +
                                 "size:1em;width:inherit}textarea{display:inline-block;font-family:'Courier New',C" +
                                 "ourier,'Lucida Console',monospace;height:10em;margin:0 0 -.1em;width:100%}ul{mar" +
                                 "gin:-1.4em 0 2em;padding:0}ul li{list-style-type:none}@media print{div{width:100" +
                                 "%}html td{font-size:0.8em;white-space:normal}p,.options,#Beautify,#Minify,#diff," +
                                 "ul{display:none}}@media screen and (-webkit-min-device-pixel-ratio:0){.beautify " +
                                 ".count li{padding-top:0.546em}.beautify .data li{line-height:1.3}}@media (max-wi" +
                                 "dth: 640px){#functionGroup{height:4em}#functionGroup.append span{margin-left:0.5" +
                                 "em;position:relative;z-index:10}#displayOps{margin-bottom:-2em;padding-right:0.7" +
                                 "5em;width:auto}#displayOps li{padding-top:2em}#displayOps a{margin-left:1em}#dif" +
                                 "fBase,#diffNew{width:46%}#reports{display:none}.labeltext input,.file input{widt" +
                                 "h:12em}#update{margin-top:2.75em}#codeInput label{display:none}#doc #dcolorSchem" +
                                 "e{margin:0 0 1em}}",
                    scanvas: "#doc.canvas{color:#444}#webtool.canvas input.unchecked{background:#ccc;color:#33" +
                                 "3}.canvas *:focus,.canvas .filefocus,.canvas #feedreportbody .focus,.canvas #fee" +
                                 "dreportbody .active-focus{outline:0.1em dashed #00f}.canvas #Beautify,.canvas #M" +
                                 "inify,.canvas #diffBase,.canvas #diffNew{background:#d8d8cf;border-color:#664;bo" +
                                 "x-shadow:0 0.2em 0.4em rgba(128,128,92,0.5);color:#444}.canvas #beautyoutput,.ca" +
                                 "nvas #minifyoutput{background:#ccc}.canvas #diffoutput #thirdparties{background:" +
                                 "#c8c8bf;border-color:#664}.canvas #diffoutput #thirdparties a{color:#664}.canvas" +
                                 " #diffoutput p em,.canvas #diffoutput li em{color:#050}.canvas #feedreportbody ." +
                                 "radiogroup label{background:#f8f8f8}.canvas #feedreportbody .feedradio1:hover,.c" +
                                 "anvas #feedreportbody .active .feedradio1{background:#f66}.canvas #feedreportbod" +
                                 "y .feedradio2:hover,.canvas #feedreportbody .active .feedradio2{background:#f96}" +
                                 ".canvas #feedreportbody .feedradio3:hover,.canvas #feedreportbody .active .feedr" +
                                 "adio3{background:#fc9}.canvas #feedreportbody .feedradio4:hover,.canvas #feedrep" +
                                 "ortbody .active .feedradio4{background:#ff9}.canvas #feedreportbody .feedradio5:" +
                                 "hover,.canvas #feedreportbody .active .feedradio5{background:#eea}.canvas #feedr" +
                                 "eportbody .feedradio6:hover,.canvas #feedreportbody .active .feedradio6{backgrou" +
                                 "nd:#cd9}.canvas #feedreportbody .feedradio7:hover,.canvas #feedreportbody .activ" +
                                 "e .feedradio7{background:#8d8}.canvas #functionGroup.append{background:#d8d8cf;b" +
                                 "order-color:#664;box-shadow:0 0.2em 0.4em rgba(128,128,92,0.5)}.canvas #option_c" +
                                 "omment{background:#e8e8e8;border-color:#664;color:#444}.canvas #pdsamples li{bac" +
                                 "kground:#d8d8cf;border-color:#664}.canvas #pdsamples li div{background:#e8e8e8;b" +
                                 "order-color:#664}.canvas #pdsamples li div a{color:#664}.canvas #pdsamples li p " +
                                 "a{color:#450}.canvas #textareaTabKey{background:#c8c8bf;border-color:#c33;color:" +
                                 "#555}.canvas #top em{color:#fcc}.canvas #update,.canvas #title_text{background:#" +
                                 "f8f8ee;box-shadow:0 0.1em 0.2em rgba(128,128,92,0.75);color:#464}.canvas .beauti" +
                                 "fy .data em.s0,#doc.canvas .beautify .data em.s0{color:#000}.canvas .beautify .d" +
                                 "ata em.s1,#doc.canvas .beautify .data em.s1{color:#f66}.canvas .beautify .data e" +
                                 "m.s2,#doc.canvas .beautify .data em.s2{color:#12f}.canvas .beautify .data em.s3," +
                                 "#doc.canvas .beautify .data em.s3{color:#090}.canvas .beautify .data em.s4,#doc." +
                                 "canvas .beautify .data em.s4{color:#d6d}.canvas .beautify .data em.s5,#doc.canva" +
                                 "s .beautify .data em.s5{color:#7cc}.canvas .beautify .data em.s6,#doc.canvas .be" +
                                 "autify .data em.s6{color:#c85}.canvas .beautify .data em.s7,#doc.canvas .beautif" +
                                 "y .data em.s7{color:#737}.canvas .beautify .data em.s8,#doc.canvas .beautify .da" +
                                 "ta em.s8{color:#6d0}.canvas .beautify .data em.s9,#doc.canvas .beautify .data em" +
                                 ".s9{color:#dd0s}.canvas .beautify .data em.s10,#doc.canvas .beautify .data em.s1" +
                                 "0{color:#893}.canvas .beautify .data em.s11,#doc.canvas .beautify .data em.s11{c" +
                                 "olor:#b97}.canvas .beautify .data em.s12,#doc.canvas .beautify .data em.s12{colo" +
                                 "r:#bbb}.canvas .beautify .data em.s13,#doc.canvas .beautify .data em.s13{color:#" +
                                 "cc3}.canvas .beautify .data em.s14,#doc.canvas .beautify .data em.s14{color:#333" +
                                 "}.canvas .beautify .data em.s15,#doc.canvas .beautify .data em.s15{color:#9d9}.c" +
                                 "anvas .beautify .data em.s16,#doc.canvas .beautify .data em.s16{color:#880}.canv" +
                                 "as .beautify .data .l0{background:#f8f8ef}.canvas .beautify .data .l1{background" +
                                 ":#fed}.canvas .beautify .data .l2{background:#def}.canvas .beautify .data .l3{ba" +
                                 "ckground:#efe}.canvas .beautify .data .l4{background:#fef}.canvas .beautify .dat" +
                                 "a .l5{background:#eef}.canvas .beautify .data .l6{background:#fff8cc}.canvas .be" +
                                 "autify .data .l7{background:#ede}.canvas .beautify .data .l8{background:#efc}.ca" +
                                 "nvas .beautify .data .l9{background:#ffd}.canvas .beautify .data .l10{background" +
                                 ":#edc}.canvas .beautify .data .l11{background:#fdb}.canvas .beautify .data .l12{" +
                                 "background:#f8f8f8}.canvas .beautify .data .l13{background:#ffb}.canvas .beautif" +
                                 "y .data .l14{background:#eec}.canvas .beautify .data .l15{background:#cfc}.canva" +
                                 "s .beautify .data .l16{background:#eea}.canvas .beautify .data .c0{background:#d" +
                                 "dd}.canvas .beautify .data li{color:#777}.canvas .analysis .bad{background-color" +
                                 ":#ecb;color:#744}.canvas .analysis .good{background-color:#cdb;color:#474}.canva" +
                                 "s .box{background:#ccc;border-color:#664}.canvas .box .body{background:#e8e8e8;b" +
                                 "order-color:#664;box-shadow:0 0.2em 0.4em rgba(128,128,92,0.75);color:#666}.canv" +
                                 "as .box button{box-shadow:0 0.1em 0.2em rgba(128,128,92,0.75)}.canvas .box butto" +
                                 "n.maximize{background:#cfd8cf;border-color:#464;color:#464}.canvas .box button.m" +
                                 "aximize:hover{background:#cfc;border-color:#282;color:#282}.canvas .box button.m" +
                                 "inimize{background:#cfcfd8;border-color:#446;color:#446}.canvas .box button.mini" +
                                 "mize:hover{background:#bbf;border-color:#228;color:#228}.canvas .box button.resi" +
                                 "ze{background:#cfcfd8;border-color:#446;color:#446}.canvas .box button.resize:ho" +
                                 "ver{background:#bbf;border-color:#228;color:#228}.canvas .box button.save{backgr" +
                                 "ound:#d8cfcf;border-color:#644;color:#644}.canvas .box button.save:hover{backgro" +
                                 "und:#fcc;border-color:#822;color:#822}.canvas .box h3.heading:hover{background:#" +
                                 "d8d8cf}.canvas .diff,.canvas .beautify,.canvas ol,.canvas .diff p.author,.canvas" +
                                 " .diff h3,.canvas .diff-right,.canvas .diff-left{border-color:#664}.canvas .diff" +
                                 " .count,.canvas .beautify .count{background:#c8c8bf}.canvas .diff .count .empty{" +
                                 "background:#c8c8bf;border-color:#664;color:#c8c8bf}.canvas .diff .data,.canvas ." +
                                 "beautify .data{background:#f8f8ef}.canvas .diff .data .delete em{background-colo" +
                                 "r:#fdc;border-color:#600;color:#933}.canvas .diff .data .insert em{background-co" +
                                 "lor:#efc;border-color:#060;color:#464}.canvas .diff .data .replace em{background" +
                                 "-color:#ffd;border-color:#664;color:#880}.canvas .diff .delete{background-color:" +
                                 "#da9;border-color:#c87;color:#600}.canvas .diff .equal,.canvas .beautify .data l" +
                                 "i{background-color:#f8f8ef;border-color:#ddd;color:#666}.canvas .diff .insert{ba" +
                                 "ckground-color:#bd9;border-color:#9c7;color:#040}.canvas .diff .replace{backgrou" +
                                 "nd-color:#dda;border-color:#cc8;color:#660}.canvas .diff .skip{background-color:" +
                                 "#eee;border-color:#ccc}.canvas .diff h3{background:#c8c8bf;color:#664}.canvas .d" +
                                 "iff p.author{background:#ddc;color:#666}.canvas #doc .analysis thead th,.canvas " +
                                 "#doc .analysis th[colspan],.canvas .doc .analysis thead th,.canvas .doc .analysi" +
                                 "s th[colspan]{background:#c8c8bf}.canvas #doc div,.canvas .doc div,#doc.canvas d" +
                                 "iv{background:#c8c8bf;border-color:#664}.canvas #doc div:hover,.canvas .doc div:" +
                                 "hover,#doc.canvas div:hover{background:#d8d8cf}.canvas #doc div div,.canvas .doc" +
                                 " div div,#doc.canvas div div{background:#e8e8e8;border-color:#664}.canvas #doc d" +
                                 "iv div:hover,.canvas .doc div div:hover,#doc.canvas div div:hover,#doc.canvas di" +
                                 "v ol:hover{background:#f8f8ef}.canvas #doc em,.canvas .doc em,.canvas .box .body" +
                                 " em,.canvas .box .body .doc em{color:#472}.canvas #doc ol,.canvas .doc ol,#doc.c" +
                                 "anvas ol{background:#e8e8e8;border-color:#664}.canvas #doc strong,.canvas .doc s" +
                                 "trong,.canvas .box .body strong{color:#933}.canvas #doc table,.canvas .doc table" +
                                 ",#doc.canvas table,.canvas .box .body table{background:#f8f8ef;border-color:#664" +
                                 ";color:#666}.canvas #doc td,.canvas .doc td,#doc.canvas td{border-color:#664}.ca" +
                                 "nvas #doc th,.canvas .doc th,#doc.canvas th{background:#c8c8bf;border-left-color" +
                                 ":#664;border-top-color:#664}.canvas #doc tr:hover,.canvas .doc tr:hover,#doc.can" +
                                 "vas tr:hover{background:#c8c8bf}.canvas .file input,.canvas .labeltext input,.ca" +
                                 "nvas .options input[type=text],.canvas .options select{background:#f8f8f8;border" +
                                 "-color:#664}.canvas .options{background:#d8d8cf;border-color:#664;box-shadow:0 0" +
                                 ".2em 0.4em rgba(128,128,92,0.5);color:#444}.canvas a{color:#450}.canvas a.button" +
                                 ",.canvas button{background:#d8d8cf;border-color:#664;box-shadow:0 0.1em 0.2em rg" +
                                 "ba(128,128,92,0.75);color:#664}.canvas a.button:hover,.canvas a.button:active,.c" +
                                 "anvas button:hover,.canvas button:active{background:#ffe}.canvas fieldset{backgr" +
                                 "ound:#e8e8e8;border-color:#664}.canvas h1 svg{border-color:#664;box-shadow:0 0.1" +
                                 "em 0.2em rgba(128,128,92,0.75)}.canvas h2,.canvas h3{background:#f8f8ef;border-c" +
                                 "olor:#664;box-shadow:0 0.1em 0.2em rgba(128,128,92,0.75);text-shadow:none}.canva" +
                                 "s input,.canvas select{box-shadow:0.1em 0.1em 0.2em #999}.canvas legend{backgrou" +
                                 "nd:#f8f8ef;border-color:#664}.canvas textarea{background:#f8f8ef;border-color:#6" +
                                 "64}.canvas textarea:hover{background:#e8e8e8}html .canvas,body.canvas{background" +
                                 ":#e8e8e8;color:#666}",
                    sshadow: "#doc.shadow{color:#ddd}#doc.shadow h3 a{color:#f90}#webtool.shadow input.uncheck" +
                                 "ed{background:#666;color:#ddd}.shadow *:focus,.shadow .filefocus,.shadow #feedre" +
                                 "portbody .focus,.shadow #feedreportbody .active-focus{outline:0.1em dashed #00f}" +
                                 ".shadow #beautyoutput,.shadow #minifyoutput{background:#555;color:#eee}.shadow #" +
                                 "Beautify,.shadow #Minify,.shadow #diffBase,.shadow #diffNew{background:#666;bord" +
                                 "er-color:#999;color:#ddd}.shadow #Beautify label,.shadow #Minify label,.shadow #" +
                                 "diffBase label,.shadow #diffNew label{text-shadow:0.1em 0.1em 0.1em #333}.shadow" +
                                 " #diffoutput #thirdparties{background:#666;border-color:#999}.shadow #diffoutput" +
                                 " #thirdparties a{box-shadow:0 0.2em 0.4em rgba(0,0,0,1);color:#000}.shadow #doc " +
                                 "div,.shadow .doc div,#doc.shadow div{background:#666;border-color:#999}.shadow #" +
                                 "doc div:hover,.shadow .doc div:hover,#doc.shadow div:hover{background:#777}.shad" +
                                 "ow #doc div div,.shadow .doc div div,#doc.shadow div div{background:#333;border-" +
                                 "color:#999}.shadow #doc div div:hover,.shadow .doc div div:hover,#doc.shadow div" +
                                 " div:hover,#doc.shadow div ol:hover{background:#444}.shadow #doc em,.shadow .doc" +
                                 " em,.shadow .box .body em,.shadow .box .body .doc em,.shadow #diffoutput p em,.s" +
                                 "hadow #diffoutput li em{color:#684}.shadow #doc ol,.shadow .doc ol,#doc.shadow o" +
                                 "l{background:#333;border-color:#999}.shadow #doc strong,.shadow .doc strong,.sha" +
                                 "dow .box .body strong{color:#b33}.shadow #doc table,.shadow .doc table,#doc.shad" +
                                 "ow table,.shadow .diff,.shadow .beautify,.shadow .box .body table{background:#33" +
                                 "3;border-color:#999;color:#ddd}.shadow #doc th,.shadow .doc th,#doc.shadow th{ba" +
                                 "ckground:#bbb;border-left-color:#999;border-top-color:#999;color:#333}.shadow #d" +
                                 "oc tr:hover,.shadow .doc tr:hover,#doc.shadow tr:hover{background:#555}.shadow #" +
                                 "feedreportbody .radiogroup label{background:#000}.shadow #feedreportbody .feedra" +
                                 "dio1:hover,.shadow #feedreportbody .active .feedradio1{background:#700}.shadow #" +
                                 "feedreportbody .feedradio2:hover,.shadow #feedreportbody .active .feedradio2{bac" +
                                 "kground:#742}.shadow #feedreportbody .feedradio3:hover,.shadow #feedreportbody ." +
                                 "active .feedradio3{background:#763}.shadow #feedreportbody .feedradio4:hover,.sh" +
                                 "adow #feedreportbody .active .feedradio4{background:#880}.shadow #feedreportbody" +
                                 " .feedradio5:hover,.shadow #feedreportbody .active .feedradio5{background:#675}." +
                                 "shadow #feedreportbody .feedradio6:hover,.shadow #feedreportbody .active .feedra" +
                                 "dio6{background:#452}.shadow #feedreportbody .feedradio7:hover,.shadow #feedrepo" +
                                 "rtbody .active .feedradio7{background:#362}.shadow #functionGroup.append{backgro" +
                                 "und:#eee;border-color:#ccc;box-shadow:0 0.1em 0.2em rgba(64,64,64,0.15)}.shadow " +
                                 "#functionGroup.append{background:#666;border-color:#999}.shadow #option_comment{" +
                                 "background:#333;border-color:#999;color:#ddd}.shadow #option_comment,.shadow inp" +
                                 "ut,.shadow select{box-shadow:0.1em 0.1em 0.2em #000}.shadow #pdsamples li{backgr" +
                                 "ound:#666;border-color:#999}.shadow #pdsamples li div{background:#333;border-col" +
                                 "or:#999}.shadow #pdsamples li p a{color:#f90}.shadow #pdsamples li p a:hover{col" +
                                 "or:#fc0}.shadow #textreport{background:#222}.shadow #title_text{border-color:#22" +
                                 "2;color:#eee}.shadow #top em{color:#9c6}.shadow #update{background:#ddd;border-c" +
                                 "olor:#000;color:#222}.shadow .analysis .bad{background-color:#400;color:#c66}.sh" +
                                 "adow .analysis .good{background-color:#040;color:#6a6}.shadow .beautify .data em" +
                                 ".s0,#doc.shadow .beautify .data em.s0{color:#fff}.shadow .beautify .data em.s1,#" +
                                 "doc.shadow .beautify .data em.s1{color:#c44}.shadow .beautify .data em.s2,#doc.s" +
                                 "hadow .beautify .data em.s2{color:#69c}.shadow .beautify .data em.s3,#doc.shadow" +
                                 " .beautify .data em.s3{color:#0c0}.shadow .beautify .data em.s4,#doc.shadow .bea" +
                                 "utify .data em.s4{color:#c0c}.shadow .beautify .data em.s5,#doc.shadow .beautify" +
                                 " .data em.s5{color:#0cc}.shadow .beautify .data em.s6,#doc.shadow .beautify .dat" +
                                 "a em.s6{color:#981}.shadow .beautify .data em.s7,#doc.shadow .beautify .data em." +
                                 "s7{color:#a7a}.shadow .beautify .data em.s8,#doc.shadow .beautify .data em.s8{co" +
                                 "lor:#7a7}.shadow .beautify .data em.s9,#doc.shadow .beautify .data em.s9{color:#" +
                                 "ff6}.shadow .beautify .data em.s10,#doc.shadow .beautify .data em.s10{color:#33f" +
                                 "}.shadow .beautify .data em.s11,#doc.shadow .beautify .data em.s11{color:#933}.s" +
                                 "hadow .beautify .data em.s12,#doc.shadow .beautify .data em.s12{color:#990}.shad" +
                                 "ow .beautify .data em.s13,#doc.shadow .beautify .data em.s13{color:#987}.shadow " +
                                 ".beautify .data em.s14,#doc.shadow .beautify .data em.s14{color:#fc3}.shadow .be" +
                                 "autify .data em.s15,#doc.shadow .beautify .data em.s15{color:#897}.shadow .beaut" +
                                 "ify .data em.s16,#doc.shadow .beautify .data em.s16{color:#f30}.shadow .beautify" +
                                 " .data .l0{background:#333}.shadow .beautify .data .l1{background:#633}.shadow ." +
                                 "beautify .data .l2{background:#335}.shadow .beautify .data .l3{background:#353}." +
                                 "shadow .beautify .data .l4{background:#636}.shadow .beautify .data .l5{backgroun" +
                                 "d:#366}.shadow .beautify .data .l6{background:#640}.shadow .beautify .data .l7{b" +
                                 "ackground:#303}.shadow .beautify .data .l8{background:#030}.shadow .beautify .da" +
                                 "ta .l9{background:#660}.shadow .beautify .data .l10{background:#003}.shadow .bea" +
                                 "utify .data .l11{background:#300}.shadow .beautify .data .l12{background:#553}.s" +
                                 "hadow .beautify .data .l13{background:#432}.shadow .beautify .data .l14{backgrou" +
                                 "nd:#640}.shadow .beautify .data .l15{background:#562}.shadow .beautify .data .l1" +
                                 "6{background:#600}.shadow .beautify .data .c0{background:#666}.shadow .box{backg" +
                                 "round:#000;border-color:#999;box-shadow:0.6em 0.6em 0.8em rgba(0,0,0,.75)}.shado" +
                                 "w .box .body{background:#333;border-color:#999;color:#ddd}.shadow .box button{bo" +
                                 "x-shadow:0 0.1em 0.2em rgba(0,0,0,0.75);text-shadow:0.1em 0.1em 0.1em rgba(0,0,0" +
                                 ",.5)}.shadow .box button.maximize{background:#9c9;border-color:#030;color:#030}." +
                                 "shadow .box button.maximize:hover{background:#cfc;border-color:#060;color:#060}." +
                                 "shadow .box button.minimize{background:#bbf;border-color:#006;color:#006}.shadow" +
                                 " .box button.minimize:hover{background:#eef;border-color:#228;color:#228}.shadow" +
                                 " .box button.resize{background:#bbf;border-color:#446;color:#446}.shadow .box bu" +
                                 "tton.resize:hover{background:#ddf;border-color:#228;color:#228}.shadow .box butt" +
                                 "on.save{background:#d99;border-color:#300;color:#300}.shadow .box button.save:ho" +
                                 "ver{background:#fcc;border-color:#822;color:#822}.shadow .box h3{background:#ccc" +
                                 ";border-color:#333;box-shadow:0.2em 0.2em 0.8em #000;color:#222}.shadow .box h3." +
                                 "heading:hover{background:#222;border-color:#ddd;color:#ddd}.shadow .diff,.shadow" +
                                 " .beautify,.shadow .diff div,.shadow .diff p,.ahadow .diff ol,.shadow .beautify " +
                                 "ol,.shadow .diff li,.ahadow .beautify li,.shadow .diff .count li,.shadow .beauti" +
                                 "fy .count li,.shadow .diff-right .data{border-color:#999}.shadow .diff .count,.s" +
                                 "hadow .beautify .count,#doc.shadow .diff .count,#doc.shadow .beautify .count{bac" +
                                 "kground:#bbb;color:#333}.shadow .diff .count .empty{background:#bbb;color:#bbb}." +
                                 "shadow .diff .data,.shadow .beautify .data{background:#333;color:#ddd}.shadow .d" +
                                 "iff .data .delete em{background-color:#700;border-color:#c66;color:#f99}.shadow " +
                                 ".diff .data .insert em{background-color:#363;border-color:#6c0;color:#cfc}.shado" +
                                 "w .diff .data .replace em{background-color:#440;border-color:#220;color:#cc9}.sh" +
                                 "adow .diff .delete{background-color:#300;border-color:#400;color:#c66}.shadow .d" +
                                 "iff .diff-right{border-color:#999 #999 #999 #333}.shadow .diff .empty{background" +
                                 "-color:#999;border-color:#888}.shadow .diff .equal,.shadow .beautify .data li{ba" +
                                 "ckground-color:#333;border-color:#404040;color:#ddd}.shadow .diff .insert{backgr" +
                                 "ound-color:#040;border-color:#005000;color:#6c6}.shadow .diff .replace{backgroun" +
                                 "d-color:#664;border-color:#707050;color:#bb8}.shadow .diff .skip{background-colo" +
                                 "r:#000;border-color:#555}.shadow .diff h3,.shadow #doc .analysis th[colspan],.sh" +
                                 "adow #doc .analysis thead th,.shadow .doc .analysis th[colspan],.shadow .doc .an" +
                                 "alysis thead th{background:#555;border-color:#999;color:#ddd}.shadow .diff p.aut" +
                                 "hor{background:#555;border-color:#999;color:#ddd}.shadow .file input,.shadow .la" +
                                 "beltext input,.shadow .options input[type=text],.shadow .options select{backgrou" +
                                 "nd:#333;border-color:#999;color:#ddd}.shadow .options{background:#666;border-col" +
                                 "or:#999;color:#ddd;text-shadow:0.1em 0.1em 0.2em #333}.shadow .options fieldset " +
                                 "span input[type=text]{background:#222;border-color:#333}.shadow a{color:#f90}.sh" +
                                 "adow a:hover{color:#c30}.shadow a.button,.shadow button{background:#630;border-c" +
                                 "olor:#600;box-shadow:0 0.2em 0.4em rgba(0,0,0,1);color:#f90;text-shadow:0.1em 0." +
                                 "1em 0.1em #000}.shadow a.button:hover,.shadow a.button:active,.shadow button:hov" +
                                 "er,.shadow button:active{background:#300;border-color:#c00;color:#fc0;text-shado" +
                                 "w:0.1em 0.1em 0.1em rgba(0,0,0,.5)}.shadow h1 svg{border-color:#222;box-shadow:0" +
                                 ".2em 0.2em 0.4em #000}.shadow h2,.shadow h3{background-color:#666;border-color:#" +
                                 "666;box-shadow:none;color:#ddd;padding-left:0;text-shadow:none}.shadow textarea{" +
                                 "background:#333;border-color:#000;color:#ddd}.shadow textarea:hover{background:#" +
                                 "000}.shadow fieldset{background:#333;border-color:#999}.shadow input[disabled]{b" +
                                 "ox-shadow:none}.shadow legend{background:#eee;border-color:#333;box-shadow:0 0.1" +
                                 "em 0.2em rgba(0,0,0,0.75);color:#222;text-shadow:none}.shadow table td{border-co" +
                                 "lor:#999}html .shadow,body.shadow{background:#222;color:#eee}",
                    swhite : "#webtool.white input.unchecked{background:#ccc;color:#666}.white *:focus,.white " +
                                 ".filefocus,.white #feedreportbody .focus,.white #feedreportbody .active-focus{ou" +
                                 "tline:0.1em dashed #00f}.white #beautyoutput,.white #minifyoutput{background:#dd" +
                                 "d}.white #Beautify,.white #Minify,.white #diffBase,.white #diffNew{background:#e" +
                                 "ee;border-color:#ccc;box-shadow:0 0.2em 0.4em rgba(64,64,64,0.15)}.white #diffou" +
                                 "tput #thirdparties{background:#eee}.white #diffoutput p em,.white #diffoutput li" +
                                 " em{color:#c00}.white #doc .analysis thead th,.white #doc .analysis th[colspan]," +
                                 ".white .doc .analysis thead th,.white .doc .analysis th[colspan]{background:#eef" +
                                 "}.white #doc div,.white .doc div,#doc.white div{background:#ddd;border-color:#99" +
                                 "9}.white #doc div:hover,.white .doc div:hover,#doc.white div:hover{background:#c" +
                                 "cc}.white #doc div div,.white .doc div div,#doc.white div div{background:#eee;bo" +
                                 "rder-color:#999}.white #doc div div:hover,.white .doc div div:hover,#doc.white d" +
                                 "iv div:hover,#doc.white div ol:hover{background:#fff}.white #doc em,.white .doc " +
                                 "em,#doc.white em{color:#060}.white #doc ol,.white .doc ol,#doc.white ol{backgrou" +
                                 "nd:#f8f8f8;border-color:#999}.white #doc strong,.white .doc strong,.white .box ." +
                                 "body strong{color:#c00}#doc.white table,.white #doc table,.white .doc table,.whi" +
                                 "te .box .body table{background:#fff;border-color:#999}.white #doc th,.white .doc" +
                                 " th,#doc.white th{background:#ddd;border-left-color:#999;border-top-color:#999}." +
                                 "white #doc tr:hover,.white .doc tr:hover,#doc.white tr:hover{background:#ddd}.wh" +
                                 "ite #feedreportbody .radiogroup label{background:#f8f8f8}.white #feedreportbody " +
                                 ".feedradio1:hover,.white #feedreportbody .active .feedradio1,.white #feedreportb" +
                                 "ody .active-focus .feedradio1{background:#f66}.white #feedreportbody .feedradio2" +
                                 ":hover,.white #feedreportbody .active .feedradio2,.white #feedreportbody .active" +
                                 "-focus .feedradio2{background:#f96}.white #feedreportbody .feedradio3:hover,.whi" +
                                 "te #feedreportbody .active .feedradio3,.white #feedreportbody .active-focus .fee" +
                                 "dradio3{background:#fc9}.white #feedreportbody .feedradio4:hover,.white #feedrep" +
                                 "ortbody .active .feedradio4,.white #feedreportbody .active-focus .feedradio4{bac" +
                                 "kground:#ff9}.white #feedreportbody .feedradio5:hover,.white #feedreportbody .ac" +
                                 "tive .feedradio5,.white #feedreportbody .active-focus .feedradio5{background:#ee" +
                                 "a}.white #feedreportbody .feedradio6:hover,.white #feedreportbody .active .feedr" +
                                 "adio6,.white #feedreportbody .active-focus .feedradio6{background:#cd9}.white #f" +
                                 "eedreportbody .feedradio7:hover,.white #feedreportbody .active .feedradio7,.whit" +
                                 "e #feedreportbody .active-focus .feedradio7{background:#8d8}.white #functionGrou" +
                                 "p.append{background:#eee;border-color:#ccc;box-shadow:0 0.1em 0.2em rgba(64,64,6" +
                                 "4,0.15)}.white #introduction h2{border-color:#999;color:#333}.white #option_comm" +
                                 "ent{background:#ddd;border-color:#999}.white #pdsamples li{background:#eee;borde" +
                                 "r-color:#999}.white #pdsamples li div{background:#ddd;border-color:#999}.white #" +
                                 "pdsamples li div a{color:#47a}.white #pdsamples li p a{color:#009}.white #thirdp" +
                                 "arties img,.white #diffoutput #thirdparties{border-color:#999}.white #textareaTa" +
                                 "bKey{background:#fff;border-color:#ccf}.white #thirdparties img{box-shadow:0.2em" +
                                 " 0.2em 0.4em #999}.white #title_text{border-color:#fff;color:#333}.white #top em" +
                                 "{color:#00f}.white #update{background:#ddd;border-color:#999;box-shadow:0 0.1em " +
                                 "0.2em rgba(64,64,64,0.15)}.white .analysis .bad{background-color:#ebb;color:#400" +
                                 "}.white .analysis .good{background-color:#cec;color:#040}.white .beautify .data " +
                                 ".l0{background:#fff}.white .beautify .data .l1{background:#fed}.white .beautify " +
                                 ".data .l2{background:#def}.white .beautify .data .l3{background:#efe}.white .bea" +
                                 "utify .data .l4{background:#fef}.white .beautify .data .l5{background:#eef}.whit" +
                                 "e .beautify .data .l6{background:#fff8cc}.white .beautify .data .l7{background:#" +
                                 "ede}.white .beautify .data .l8{background:#efc}.white .beautify .data .l9{backgr" +
                                 "ound:#ffd}.white .beautify .data .l10{background:#edc}.white .beautify .data .l1" +
                                 "1{background:#fdb}.white .beautify .data .l12{background:#f8f8f8}.white .beautif" +
                                 "y .data .l13{background:#ffb}.white .beautify .data .l14{background:#eec}.white " +
                                 ".beautify .data .l15{background:#cfc}.white .beautify .data .l16{background:#eea" +
                                 "}.white .beautify .data .c0{background:#ddd}.white .beautify .data em.s0,#doc.wh" +
                                 "ite .beautify .data em.s0{color:#000}.white .beautify .data em.s1,#doc.white .be" +
                                 "autify .data em.s1{color:#f66}.white .beautify .data em.s2,#doc.white .beautify " +
                                 ".data em.s2{color:#12f}.white .beautify .data em.s3,#doc.white .beautify .data e" +
                                 "m.s3{color:#090}.white .beautify .data em.s4,#doc.white .beautify .data em.s4{co" +
                                 "lor:#d6d}.white .beautify .data em.s5,#doc.white .beautify .data em.s5{color:#7c" +
                                 "c}.white .beautify .data em.s6,#doc.white .beautify .data em.s6{color:#c85}.whit" +
                                 "e .beautify .data em.s7,#doc.white .beautify .data em.s7{color:#737}.white .beau" +
                                 "tify .data em.s8,#doc.white .beautify .data em.s8{color:#6d0}.white .beautify .d" +
                                 "ata em.s9,#doc.white .beautify .data em.s9{color:#dd0}.white .beautify .data em." +
                                 "s10,#doc.white .beautify .data em.s10{color:#893}.white .beautify .data em.s11,#" +
                                 "doc.white .beautify .data em.s11{color:#b97}.white .beautify .data em.s12,#doc.w" +
                                 "hite .beautify .data em.s12{color:#bbb}.white .beautify .data em.s13,#doc.white " +
                                 ".beautify .data em.s13{color:#cc3}.white .beautify .data em.s14,#doc.white .beau" +
                                 "tify .data em.s14{color:#333}.white .beautify .data em.s15,#doc.white .beautify " +
                                 ".data em.s15{color:#9d9}.white .beautify .data em.s16,#doc.white .beautify .data" +
                                 " em.s16{color:#880}.white .beautify .data li{color:#777}.white .box{background:#" +
                                 "666;border-color:#999;box-shadow:0 0.4em 0.8em rgba(64,64,64,0.25)}.white .box ." +
                                 "body{background:#eee;border-color:#888;box-shadow:0 0 0.4em rgba(64,64,64,0.75)}" +
                                 ".white .box .body em,.white .box .body .doc em{color:#090}.white .box button{box" +
                                 "-shadow:0 0.1em 0.2em rgba(0,0,0,0.25);text-shadow:0.1em 0.1em 0.1em rgba(0,0,0," +
                                 ".25)}.white .box button.maximize{background:#9c9;border-color:#030;color:#030}.w" +
                                 "hite .box button.maximize:hover{background:#cfc;border-color:#060;color:#060}.wh" +
                                 "ite .box button.minimize{background:#bbf;border-color:#006;color:#006}.white .bo" +
                                 "x button.minimize:hover{background:#eef;border-color:#228;color:#228}.white .box" +
                                 " button.resize{background:#bbf;border-color:#446;color:#446}.white .box button.r" +
                                 "esize:hover{background:#ddf;border-color:#228;color:#228}.white .box button.save" +
                                 "{background:#d99;border-color:#300;color:#300}.white .box button.save:hover{back" +
                                 "ground:#fcc;border-color:#822;color:#822}.white .box h3.heading{background:#ddd;" +
                                 "border-color:#888;box-shadow:0.2em 0.2em 0.4em #ccc}.white .box h3.heading:hover" +
                                 "{background:#333;color:#eee}.white .diff,.white .beautify,.white .diff ol,.white" +
                                 " .beautify ol,.white .diff .diff-left,.white .diff .diff-right,.white h3,.white " +
                                 "p.author{border-color:#999}.white .diff .count li,.white .beautify .count li{bac" +
                                 "kground:#eed;border-color:#bbc;color:#886}.white .diff .data .delete em{backgrou" +
                                 "nd-color:#fdd;border-color:#700;color:#600}.white .diff .data .insert em{backgro" +
                                 "und-color:#efc;border-color:#070;color:#050}.white .diff .data .replace em{backg" +
                                 "round-color:#ffd;border-color:#963;color:#630}.white .diff .delete{background-co" +
                                 "lor:#fbb;border-color:#eaa}.white .diff .equal,.white .beautify .data li{backgro" +
                                 "und-color:#fff;border-color:#eee}.white .diff .empty{background-color:#ddd;borde" +
                                 "r-color:#ccc}.white .diff .insert{background-color:#bfb;border-color:#aea}.white" +
                                 " .diff .replace{background-color:#fea;border-color:#dd8}.white .diff .skip{backg" +
                                 "round-color:#efefef;border-color:#ddd}.white .diff h3{background:#ddd;border-bot" +
                                 "tom-color:#bbc}.white .diff p.author{background:#efefef;border-top-color:#bbc}.w" +
                                 "hite .file input,.white .labeltext input{border-color:#fff}.white .options{backg" +
                                 "round:#eee;border-color:#ccc;box-shadow:0 0.2em 0.4em rgba(64,64,64,0.15);text-s" +
                                 "hadow:0.05em 0.05em 0.1em #ddd}.white .options input[type=text],.white .options " +
                                 "select{border-color:#999}.white .options h2,.white #Beautify h2,.white #Minify h" +
                                 "2,.white #diffBase h2,.white #diffNew h2{background:#eee;border-color:#eee;box-s" +
                                 "hadow:none;text-shadow:none}.white a{color:#009}.white a.button:hover,.white a.b" +
                                 "utton:active,.white button:hover,.white button:active{background:#fee;border-col" +
                                 "or:#cbb;color:#966;text-shadow:0.05em 0.05em 0.1em #f8e8e8}.white fieldset{backg" +
                                 "round:#ddd;border-color:#999}.white h1 svg{background:#eee;border-color:#999;box" +
                                 "-shadow:0 0.1em 0.2em rgba(150,150,150,0.5)}.white h2,.white h3{background:#fefe" +
                                 "fe;border-color:#999;box-shadow:none;text-shadow:none}.white legend{background:#" +
                                 "fff;border-color:#999;color:#333;text-shadow:none}.white div input{border-color:" +
                                 "#999}.white textarea{border-color:#ccc;border-style:solid}.white textarea:hover{" +
                                 "background:#eef8ff}body.white button,body.white a.button{background:#f8f8f8;bord" +
                                 "er-color:#bbb;box-shadow:0 0.1em 0.2em rgba(64,64,64,0.15);color:#666;text-shado" +
                                 "w:0.05em 0.05em 0.1em #e0e0e0}html .white,body.white{color:#333}#about_license a" +
                                 "{display:block}"
                },
                a      = ["<?xml version='1.0' encoding='UTF-8' ?><!DOCTYPE html PUBLIC '-//W3C//DTD XHTML " +
                        "1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'><html xmlns='http://www." +
                        "w3.org/1999/xhtml' xml:lang='en'><head><title>Pretty Diff - The difference tool<" +
                        "/title><meta name='robots' content='index, follow'/> <meta name='DC.title' conte" +
                        "nt='Pretty Diff - The difference tool'/> <link rel='canonical' href='http://pret" +
                        "tydiff.com/' type='application/xhtml+xml'/><meta http-equiv='Content-Type' conte" +
                        "nt='application/xhtml+xml;charset=UTF-8'/><meta http-equiv='Content-Style-Type' " +
                        "content='text/css'/><style type='text/css'>"];
            if (result[0].indexOf("Error: ") === 0) {
                return [result[0], ""];
            }
            a.push(css.core);
            a.push(css["s" + options.color]);
            a.push("</style></head><body class='");
            a.push(options.color);
            a.push("'><h1><a href='http://prettydiff.com/'>Pretty Diff - The difference tool</a></h1" +
                    "><div id='doc'>");
            a.push(result[1]);
            a.push("</div>");
            if (options.jsscope !== "none" && options.mode === "beautify" && (options.lang === "javascript" || options.lang === "auto")) {
                a.push(result[0]);
                a.push("<script type='application/javascript'><![CDATA[");
                a.push("var pd={};pd.beaufold=function dom__beaufold(){'use strict';var self=this,title=" +
                        "self.getAttribute('title').split('line '),min=Number(title[1].substr(0,title[1]." +
                        "indexOf(' '))),max=Number(title[2]),a=0,b='',list=[self.parentNode.getElementsBy" +
                        "TagName('li'),self.parentNode.nextSibling.getElementsByTagName('li')];if(self.in" +
                        "nerHTML.charAt(0)==='-'){for(a=min;a<max;a+=1){list[0][a].style.display='none';l" +
                        "ist[1][a].style.display='none';}self.innerHTML='+'+self.innerHTML.substr(1);}els" +
                        "e{for(a=min;a<max;a+=1){list[0][a].style.display='block';list[1][a].style.displa" +
                        "y='block';if(list[0][a].getAttribute('class')==='fold'&&list[0][a].innerHTML.cha" +
                        "rAt(0)==='+'){b=list[0][a].getAttribute('title');b=b.substring(b.indexOf('to lin" +
                        "e ')+1);a=Number(b)-1;}}self.innerHTML='-'+self.innerHTML.substr(1);}};(function" +
                        "(){'use strict';var lists=document.getElementsByTagName('ol'),listslen=lists.len" +
                        "gth,list=[],listlen=0,a=0,b=0;for(a=0;a<listslen;a+=1){if(lists[a].getAttribute(" +
                        "'class')==='count'&&lists[a].parentNode.getAttribute('class')==='beautify'){list" +
                        "=lists[a].getElementsByTagName('li');listlen=list.length;for(b=0;b<listlen;b+=1)" +
                        "{if(list[b].getAttribute('class')==='fold'){list[b].onmousedown=pd.beaufold;}}}}" +
                        "}());");
                a.push("]]></script></body></html>");
                return a.join("");
            }
            if (options.mode === "diff") {
                a.push(result[0]);
                a.push("<script type='application/javascript'><![CDATA[");
                a.push("var pd={};pd.colSliderProperties=[];(function(){var d=document.getElementsByTagN" +
                        "ame('ol'),cells=d[0].getElemensByTagName('li'),len=cells.length,a=0;pd.colSlider" +
                        "Properties=[d[0].clientWidth,d[1].clientWidth,d[2].parentNode.clientWidth,d[2].p" +
                        "arentNode.parentNode.clientWidth,d[2].parentNode.offsetLeft-d[2].parentNode.pare" +
                        "ntNode.offsetLeft,];for(a=0;a<len;a+=1){if(cells[a].getAttribute('class')==='fol" +
                        "d'){cells[a].onmousedown=pd.difffold;}}if(d.length>3){d[2].onmousedown=pd.colSli" +
                        "derGrab;d[2].ontouchstart=pd.colSliderGrab;}}());pd.difffold=function dom__difff" +
                        "old(){var a=0,b=0,self=this,title=self.getAttribute('title').split('line '),min=" +
                        "Number(title[1].substr(0,title[1].indexOf(' '))),max=Number(title[2]),inner=self" +
                        ".innerHTML,lists=[],parent=self.parentNode.parentNode,listnodes=(parent.getAttri" +
                        "bute('class')==='diff')?parent.getElementsByTagName('ol'):parent.parentNode.getE" +
                        "lementsByTagName('ol'),listLen=listnodes.length;for(a=0;a<listLen;a+=1){lists.pu" +
                        "sh(listnodes[a].getElementsByTagName('li'));}if(lists.length>3){for(a=0;a<min;a+" +
                        "=1){if(lists[0][a].getAttribute('class')==='empty'){min+=1;max+=1;}}}max=(max>=l" +
                        "ists[0].length)?lists[0].length:max;if(inner.charAt(0)==='-'){self.innerHTML='+'" +
                        "+inner.substr(1);for(a=min;a<max;a+=1){for(b=0;b<listLen;b+=1){lists[b][a].style" +
                        ".display='none';}}}else{self.innerHTML='-'+inner.substr(1);for(a=min;a<max;a+=1)" +
                        "{for(b=0;b<listLen;b+=1){lists[b][a].style.display='block';}}}};pd.colSliderGrab" +
                        "=function dom__colSliderGrab(e){var event=e||window.event,touch=(e.type==='touch" +
                        "start')?true:false,node=this,diffRight=node.parentNode,diff=diffRight.parentNode" +
                        ",subOffset=0,counter=pd.colSliderProperties[0],data=pd.colSliderProperties[1],wi" +
                        "dth=pd.colSliderProperties[2],total=pd.colSliderProperties[3],offset=pd.colSlide" +
                        "rProperties[4],min=0,max=data-1,status='ew',minAdjust=min+15,maxAdjust=max-15,wi" +
                        "thinRange=false,diffLeft=diffRight.previousSibling,drop=function dom__colSliderG" +
                        "rab_drop(f){f=f||window.event;f.preventDefault();node.style.cursor=status+'-resi" +
                        "ze';if(touch===true){document.ontouchmove=null;document.ontouchend=null;}else{do" +
                        "cument.onmousemove=null;document.onmouseup=null;}},boxmove=function dom__colSlid" +
                        "erGrab_boxmove(f){f=f||window.event;f.preventDefault();if(touch===true){subOffse" +
                        "t=offset-f.touches[0].clientX;}else{subOffset=offset-f.clientX;}if(subOffset>min" +
                        "Adjust&&subOffset<maxAdjust){withinRange=true;}if(withinRange===true&&subOffset>" +
                        "maxAdjust){diffRight.style.width=((total-counter-2)/10)+'em';status='e';}else if" +
                        "(withinRange===true&&subOffset<minAdjust){diffRight.style.width=(width/10)+'em';" +
                        "status='w';}else if(subOffset<max&&subOffset>min){diffRight.style.width=((width+" +
                        "subOffset)/10)+'em';status='ew';}if(touch===true){document.ontouchend=drop;}else" +
                        "{document.onmouseup=drop;}};event.preventDefault();if(typeof pd.o==='object'&&pd" +
                        ".o.report.code.box!==null){offset+=pd.o.report.code.box.offsetLeft;offset-=pd.o." +
                        "report.code.body.scrollLeft;}else{subOffset=(document.body.parentNode.scrollLeft" +
                        ">document.body.scrollLeft)?document.body.parentNode.scrollLeft:document.body.scr" +
                        "ollLeft;offset-=subOffset;}offset+=node.clientWidth;node.style.cursor='ew-resize" +
                        "';diff.style.width=(total/10)+'em';diff.style.display='inline-block';if(diffLeft" +
                        ".nodeType!==1){do{diffLeft=diffLeft.previousSibling;}while(diffLeft.nodeType!==1" +
                        ");}diffLeft.style.display='block';diffRight.style.width=(diffRight.clientWidth/1" +
                        "0)+'em';diffRight.style.position='absolute';if(touch===true){document.ontouchmov" +
                        "e=boxmove;document.ontouchstart=false;}else{document.onmousemove=boxmove;documen" +
                        "t.onmousedown=null;}};");
                a.push("]]></script>");
                a.push("</body></html>");
                return [a.join(""), ""];
            }
            a.push("</body></html>");
            return [result[0], a.join("")];
        },

        //instructions
        error          = (function pdNodeLocal__error() {
            var a       = [],
                color   = {
                    accepted: "\x1B[31m",
                    bool    : "\x1B[35m",
                    number  : "\x1B[36m",
                    string  : "\x1B[33m",
                    word    : "\x1B[32m"
                },
                opname  = function pdNodeLocal__opname(x) {
                    var value = x.match(/\w+/);
                    return x.replace(value, color.word + value + "\x1B[39m");
                },
                vallist = function pdNodeLocal__vallist(x) {
                    var value = x.split(":\x1B[39m"),
                        items = value[1].split(","),
                        len   = items.length,
                        b     = 0;
                    for (b = 0; b < len; b += 1) {
                        items[b] = items[b].replace(/\s(?=\w)/, " " + color.string) + "\x1B[39m";
                    }
                    return value[0] + ":\x1B[39m" + items.join(",");
                };
            a.push(lf);
            a.push("\x1B[1mOptions\x1B[22m");
            a.push("");
            a.push("Arguments      - Type    - Definition");
            a.push("-------------------------------------");
            a.push("* braceline    - boolean - If true a new line character will be inserted after");
            a.push("                           opening curly braces and before closing curly");
            a.push("                            braces. Default is false.");
            a.push("");
            a.push("* bracepadding - boolean - Inserts a space after the start of a contain and");
            a.push("                           before the end of the container in JavaScript if the");
            a.push("                           contents of that container are not indented; such");
            a.push("                           as: conditions, function arguments, and escaped");
            a.push("                           sequences of template strings. Default is false.");
            a.push("");
            a.push("* braces       - string  - If lang is 'javascript' and mode is 'beautify' this");
            a.push("                           determines if opening curly braces will exist on the");
            a.push("                           same line as their condition or be forced onto a new");
            a.push("                           line. Defaults to 'knr'.");
            a.push("                 Accepted values: knr, allman");
            a.push("");
            a.push("* color        - string  - The color scheme of the reports. Default is shadow.");
            a.push("                 Accepted values: default, canvas, shadow, white");
            a.push("");
            a.push("* comments     - string  - If mode is 'beautify' this will determine whether");
            a.push("                           comments should always start at position 0 of each");
            a.push("                           line or if comments should be indented according to");
            a.push("                           sthe code. Default is 'indent'.");
            a.push("                 Accepted values: indent, noindent");
            a.push("");
            a.push("* commline     - boolean - If a blank new line should be forced above comments");
            a.push("                           in markup. Default is false.");
            a.push("");
            a.push("* conditional  - boolean - If true then conditional comments used by Internet");
            a.push("                           Explorer are preserved at minification of markup.");
            a.push("                           Default is false.");
            a.push("");
            a.push("* content      - boolean - If true and mode is 'diff' this will normalize all");
            a.push("                           string literals in JavaScript to 'text' and all");
            a.push("                           content in markup to 'text' so as to eliminate some");
            a.push("                           differences from the HTML diff report. Default is");
            a.push("                           false.");
            a.push("");
            a.push("* context      - number  - This shortens the diff output by allowing a");
            a.push("                           specified number of equivalent lines between each");
            a.push("                           line of difference. Defaults to an empty string,");
            a.push("                           which nullifies its use.");
            a.push("");
            a.push("* correct      - boolean - Automatically correct some sloppiness in JavaScript.");
            a.push("                           The default is 'false' and it is only applied during");
            a.push("                           JavaScript beautification.");
            a.push("");
            a.push("* crlf         - boolean - If line termination should be Windows (LF) format.");
            a.push("                           Unix (LF) format is the default.");
            a.push("");
            a.push("* cssinsertlines - boolean - Inserts new line characters between every CSS code");
            a.push("                           block. Default is false.");
            a.push("");
            a.push("* csvchar      - string  - The character to be used as a separator if lang is");
            a.push("                           'csv'. Any string combination is accepted. Defaults");
            a.push("                           to a comma ','.");
            a.push("");
            a.push("* diff         - string  - The file to be compared to the source file. This is");
            a.push("                           required if mode is 'diff'.");
            a.push("");
            a.push("* diffcli      - boolean - If true only text lines of the code differences are");
            a.push("                           returned instead of an HTML diff report. Default is");
            a.push("                           false.");
            a.push("");
            a.push("* diffcomments - boolean - If true then comments will be preserved so that both");
            a.push("                           code and comments are compared by the diff engine.");
            a.push("");
            a.push("* difflabel    - string  - This allows for a descriptive label for the diff");
            a.push("                           file code of the diff HTML output. Defaults to new'.");
            a.push("");
            a.push("* diffspaceignore - boolean - If white space only differences should be ignored");
            a.push("                           by the diff tool.  Default is false.");
            a.push("");
            a.push("* diffview     - string  - This determines whether the diff HTML output should");
            a.push("                           display as a side-by-side comparison or if the");
            a.push("                           differences should display in a single table column.");
            a.push("                           Defaults to 'sidebyside'.");
            a.push("                 Accepted values: sidebyside, inline");
            a.push("");
            a.push("* dustjs       - boolean - If the provided markup code is a Dust.js template.");
            a.push("                           Takes a boolean and defaults to false.");
            a.push("");
            a.push("* elseline     - boolean - If elseline is true then the keyword 'else' is forced");
            a.push("                           onto a new line in JavaScript beautification.");
            a.push("                           Defaults to false.");
            a.push("");
            a.push("* endcomma     - boolean - If there should be a trailing comma in JavaScript");
            a.push("                           arrays and objects.");
            a.push("");
            a.push("* force_indent - boolean - If lang is 'markup' this will force indentation upon");
            a.push("                           all content and tags without regard for the creation");
            a.push("                           of new text nodes. Default is false.");
            a.push("");
            a.push("* help         - string  - This list of argument definitions. The value is");
            a.push("                           unnecessary and is required only to pass in use of");
            a.push("                           the parameter.");
            a.push("");
            a.push("* html         - boolean - If lang is 'markup' this will provide an override so");
            a.push("                           that some tags are treated as singletons and not");
            a.push("                           start tags, such as '<br>' opposed to '<br/>'.");
            a.push("");
            a.push("* inchar       - string  - The string characters to comprise a single");
            a.push("                           indentation. Any string combination is accepted.");
            a.push("                           Defaults to space ' '.");
            a.push("");
            a.push("* inlevel      - number  - How much indentation padding should be applied to");
            a.push("                           JavaScript beautification?  Default is 0.");
            a.push("");
            a.push("* insize       - number  - The number of characters to comprise a single");
            a.push("                           indentation. Defaults to '4'.");
            a.push("");
            a.push("* jsscope      - string  - If 'html' JavaScript beautification produces HTML");
            a.push("                           formatted output coloring function scope and");
            a.push("                           variables to indicate scope depth and inheritance.");
            a.push("                           The value 'report' is similar to the value 'html',");
            a.push("                           except that it forms the entirety of an HTML");
            a.push("                           document. Default is 'none', which just returns");
            a.push("                           beautified JavaScript in text format.");
            a.push("                 Accepted values: none, report, html");
            a.push("");
            a.push("* lang         - string  - The programming language of the source file.");
            a.push("                           Defaults to auto.");
            a.push("                 Accepted values: auto, markup, javascript, css, html, csv, text");
            a.push("");
            a.push("* langdefault  - string  - The fallback option if lang is set to 'auto' and a");
            a.push("                           language cannot be detected.");
            a.push("                 Accepted values: markup, javascript, css, html, csv, text");
            a.push("");
            a.push("* methodchain  - string  - Whether consecutive JavaScript methods should be");
            a.push("                           chained onto a single line of code instead of");
            a.push("                           indented. Default is 'indent'.");
            a.push("                 Accepted values: chain, indent, none");
            a.push("");
            a.push("* miniwrap     - boolean - Whether minified JavaScript should wrap after a");
            a.push("                           specified character width. This option requires a");
            a.push("                           value from option 'wrap'.");
            a.push("");
            a.push("* mode         - string  - The operation to be performed. Defaults to 'diff'.");
            a.push("                           * diff     - returns either command line list of");
            a.push("                                        differences or an HTML report");
            a.push("                           * beautify - beautifies code and returns a string");
            a.push("                           * minify   - minifies code and returns a string");
            a.push("                           * parse    - returns an object with shallow arrays");
            a.push("                 Accepted values: diff, beautify, minify, parse");
            a.push("");
            a.push("* neverflatten - boolean - If destructured lists in JavaScript should never be");
            a.push("                           flattend. Default is false.");
            a.push("");
            a.push("* nocaseindent - boolean - If a case statement should receive the same");
            a.push("                           indentation as the containing switch block.");
            a.push("");
            a.push("* noleadzero   - boolean - If in CSS values leading 0s immediately preceeding a");
            a.push("                           decimal should be removed or prevented.");
            a.push("");
            a.push("* objsort      - string  - Sorts properties by key name in JavaScript and/or");
            a.push("                           CSS. Defaults to 'js'.");
            a.push("                 Accepted values: all, css, js, markup, none");
            a.push("");
            a.push("* output       - string  - The path of the directory, if readmethod is value");
            a.push("                           'directory', or path and name of the file to write");
            a.push("                           the output.  If the directory path or file exists it");
            a.push("                           will be over written else it will be created.");
            a.push("");
            a.push("* preserve     - string  - Should empty lines be removed during JavaScript or");
            a.push("                           CSS beautification? Default value is 'js', which");
            a.push("                           retains one empty line for any series of empty lines");
            a.push("                           in the JavaScript code input.");
            a.push("                 Accepted values: all, css, js, none");
            a.push("");
            a.push("* quote        - boolean - If true and mode is 'diff' then all single quote");
            a.push("                           characters will be replaced by double quote");
            a.push("                           characters in both the source and diff file input so");
            a.push("                           as to eliminate some differences from the diff");
            a.push("                           report HTML output.");
            a.push("");
            a.push("* quoteConvert - string  - If the quotes of JavaScript strings or markup");
            a.push("                           attributes should be converted to single quotes or");
            a.push("                           double quotes. The default is 'none', which performs");
            a.push("                           no conversion.");
            a.push("                 Accepted values: double, single, none");
            a.push("");
            a.push("* readmethod   - string  - The readmethod determines if operating with IO from");
            a.push("                           command line or IO from files.  Default value is");
            a.push("                           'screen':");
            a.push("                           * auto         - changes to value subdirectory,");
            a.push("                                            file, or screen depending on the");
            a.push("                                            source");
            a.push("                           * screen       - reads from screen and outputs to");
            a.push("                                            screen");
            a.push("                           * file         - reads a file and outputs to a file");
            a.push("                                          - file requires option 'output'");
            a.push("                           * filescreen   - reads a file and writes to screen");
            a.push("                           * directory    - process all files in the immediate");
            a.push("                                            directory");
            a.push("                           * subdirectory - process all files in a directory");
            a.push("                                            and its subdirectories");
            a.push("                 Accepted values: auto, screen, file, filescreen, directory,");
            a.push("                                  subdirectory");
            a.push("");
            a.push("* report       - boolean - Determines whether a report file should be created.");
            a.push("                           The default value is true.  If false reports will be");
            a.push("                           suppressed for 'beautify' and 'minify' modes if");
            a.push("                           readmethod is 'file' or 'directory'.");
            a.push("");
            a.push("* selectorlist - boolean - If comma separated CSS selectors should be retained");
            a.push("                           on a single line of code.");
            a.push("");
            a.push("* semicolon    - boolean - If true and mode is 'diff' and lang is 'javascript'");
            a.push("                           all semicolon characters that immediately preceed");
            a.push("                           any white space containing a new line character will");
            a.push("                           be removed so as to elimate some differences from");
            a.push("                           the diff report HTML output.");
            a.push("");
            a.push("* source       - string  - The file source for interpretation. This is required.");
            a.push("");
            a.push("* sourcelabel  - string  - This allows for a descriptive label of the source");
            a.push("                           file code of the diff HTML output.");
            a.push("");
            a.push("* space        - boolean - If false the space following the function keyword");
            a.push("                           for anonymous functions is removed. Default is true.");
            a.push("");
            a.push("* spaceclose   - boolean - If false markup self-closing tags end with '/>' and");
            a.push("                           ' />' if true. Default is false.");
            a.push("");
            a.push("* style        - string  - If mode is 'beautify' and lang is 'markup' or 'html'");
            a.push("                           this will determine whether the contents of script");
            a.push("                           and style tags should always start at position 0 of");
            a.push("                           each line or if such content should be indented");
            a.push("                           starting from the opening script or style tag.");
            a.push("                           Default is 'indent'.");
            a.push("                 Accepted values: indent, noindent");
            a.push("");
            a.push("* styleguide   - string  - Provides a collection of option presets to easily");
            a.push("                           conform to popular JavaScript style guides. Default");
            a.push("                           is 'none'.");
            a.push("                 Accepted values: airbnb, crockford, google, grunt, jquery,");
            a.push("                                  mediawiki, meteor, yandex, none");
            a.push("");
            a.push("* summaryonly  - boolean - Node only option to output only number of");
            a.push("                           differences and generate no reports. Default is");
            a.push("                           false.");
            a.push("");
            a.push("* tagmerge     - boolean - Allows immediately adjacement start and end markup");
            a.push("                           tags of the same name to be combined into a single");
            a.push("                           self-closing tag. Default is false.");
            a.push("");
            a.push("* tagsort      - boolean - Sort child items of each respective markup parent");
            a.push("                           element.");
            a.push("");
            a.push("* textpreserve - boolean - If text in the provided markup code should be");
            a.push("                           preserved exactly as provided. This option");
            a.push("                           eliminates beautification and wrapping of text");
            a.push("                           content.  Takes a boolean and defaults to false.");
            a.push("");
            a.push("* ternaryline  - boolean - If ternary operators in JavaScript (? and :) should");
            a.push("                           remain on the same line.  Defaults to false.");
            a.push("");
            a.push("* titanium     - boolean - Forces the JavaScript parser to parse Titanium Style");
            a.push("                           Sheets instead of JavaScript. Default is false.");
            a.push("");
            a.push("* topcoms      - boolean - If mode is 'minify' this determines whether comments");
            a.push("                           above the first line of code should be kept. Default");
            a.push("                           is false.");
            a.push("");
            a.push("* varword      - string  - If consecutive JavaScript variables should be merged");
            a.push("                           into a comma separated list ('list') or the opposite");
            a.push("                           ('each'). Default is 'none'.");
            a.push("                 Accepted values: each, list, none");
            a.push("");
            a.push("* vertical     - string  - If lists of assignments and properties should be");
            a.push("                           vertically aligned. Default is 'js'.");
            a.push("                 Accepted values: all, css, js, none");
            a.push("");
            a.push("* wrap         - number  - How many characters text content in markup or");
            a.push("                           strings in JavaScript can be before wrapping. The");
            a.push("                           default value is 80. A value of turns this feature");
            a.push("                           off. A value of -1 will concatenate strings in");
            a.push("                           JavaScript separated by a '+' operator. In markup");
            a.push("                           wrapping occurs on the last space character prior to");
            a.push("                           the given character width");
            a.push("");
            a.push("\x1B[1mUsage\x1B[22m");
            a.push(color.bool + "prettydiff\x1B[39m " + color.word + "option1:\x1B[39m" + color.string + "\"value\"\x1B[39m " + color.word + "option2:\x1B[39m" + color.string + "\"value\"\x1B[39m ...");
            a.push(color.bool + "prettydiff\x1B[39m " + color.word + "source:\x1B[39m" + color.string + "\"myApplication.js\"\x1B[39m " + color.word + "readmethod:\x1B[39m" + color.string + "\"filescreen\"\x1B[39m " + color.word + "mode:\x1B[39m" + color.string + "\"beautify\"\x1B[39m");
            a.push(color.bool + "prettydiff\x1B[39m " + color.word + "source:\x1B[39m" + color.string + "\"old_directory\"\x1B[39m " + color.word + "diff:\x1B[39m" + color.string + "\"new_directory\"\x1B[39m " + color.word + "readmethod:\x1B[39m" + color.string + "\"subdirectory\"\x1B[39m");
            a.push("");
            a.push(versionString);
            a.push("");
            return a
                .join(lf)
                .replace(/\r?\n\*\ \w+\s+-/g, opname)
                .replace(/-\ boolean\ -/g, "- " + color.bool + "boolean\x1B[39m -")
                .replace(/-\ string\ {2,}-/g, "- " + color.string + "string\x1B[39m  -")
                .replace(/-\ number\ {2,}-/g, "- " + color.number + "number\x1B[39m  -")
                .replace(/\r?\n\ {17,}Accepted\ values:/g, lf + "                 " + color.accepted + "Accepted values:\x1B[39m")
                .replace(/Accepted\ values:\\x1B\[39m(\s+\w+,?)+/g, vallist);
        }()),

        //write output to a file
        //executed from fileComplete
        fileWrite      = function pdNodeLocal__fileWrite(data) {
            var dirs      = data
                    .localpath
                    .split(path.sep),
                suffix    = (options.mode === "diff")
                    ? "-diff.html"
                    : "-report.html",
                filename  = dirs[dirs.length - 1],
                count     = 1,
                finalpath = "",
                report    = [
                    "", ""
                ],
                writing   = function pdNodeLocal__fileWrite_writing(ending) {
                    if (data.binary === true) {
                        fs
                            .writeFile(finalpath, data.file, function pdNodeLocal__fileWrite_writing_writeFileBinary(err) {
                                if (err !== null) {
                                    console.log(lf + "Error writing binary output." + lf);
                                    console.log(err);
                                }
                                total[1] += 1;
                                if (options.report === true) {
                                    total[0] -= 1;
                                }
                                if (total[1] === total[0]) {
                                    ender();
                                }
                            });
                    } else if (data.file === "") {
                        fs
                            .writeFile(finalpath + ending, "", function pdNodeLocal__fileWrite_writing_writeFileEmpty(err) {
                                if (err !== null) {
                                    console.log(lf + "Error writing empty output." + lf);
                                    console.log(err);
                                } else if (method === "file") {
                                    console.log(lf + "Empty file successfully written to file.");
                                }
                                total[1] += 1;
                                if (total[1] === total[0]) {
                                    ender();
                                }
                            });
                    } else if (ending.indexOf("-report") === 0) {
                        fs
                            .writeFile(finalpath + ending, report[1], function pdNodeLocal__fileWrite_writing_writeFileReport(err) {
                                if (err !== null) {
                                    console.log(lf + "Error writing report output." + lf);
                                    console.log(err);
                                } else if (method === "file") {
                                    console.log(lf + "Report successfully written to file.");
                                }
                                total[1] += 1;
                                if (total[1] === total[0]) {
                                    ender();
                                }
                            });
                    } else {
                        fs
                            .writeFile(finalpath + ending, report[0], function pdNodeLocal__fileWrite_writing_writeFileText(err) {
                                if (err !== null) {
                                    console.log(lf + "Error writing file output." + lf);
                                    console.log(err);
                                } else if (method === "file") {
                                    console.log(lf + "File successfully written.");
                                }
                                total[1] += 1;
                                if (total[1] === total[0] || (method !== "directory" && method !== "subdirectory")) {
                                    ender();
                                }
                            });
                    }
                },
                files     = function pdNodeLocal__fileWrite_files() {
                    if (data.binary === true) {
                        writing("");
                    } else if (options.mode === "diff" || (options.mode === "beautify" && options.jsscope !== "none")) {
                        writing(suffix);
                    } else {
                        if (options.report === true) {
                            writing(suffix);
                        }
                        writing("");
                    }
                },
                newdir    = function pdNodeLocal__fileWrite_newdir() {
                    fs
                        .mkdir(address.oabspath + dirs.slice(0, dirs.length - 2).join(path.sep), function pdNodeLocal__fileWrite_newdir_callback() {
                            count += 1;
                            if (count < dirs.length + 1) {
                                pdNodeLocal__fileWrite_newdir();
                            } else {
                                files();
                            }
                        });
                };
            options.source = sfiledump[data.index];
            if (options.mode === "diff") {
                finalpath = address.oabspath + path.sep + dirs.join("__") + "__" + filename;
                options.diff = dfiledump[data.index];
            } else {
                finalpath = address.oabspath + dirs.join(path.sep);
            }
            if (data.binary === true) {
                if (dirs.length > 1 && options.mode !== "diff") {
                    newdir();
                } else {
                    files();
                }
                return;
            }
            report = reports();
            if (options.mode === "parse") {
                report[0] = JSON.stringify(report[0]);
            }
            if (options.mode === "diff") {
                report[0].replace(/<strong>Number\ of\ differences:<\/strong>\ <em>\d+<\/em>\ difference/, counter);
            }
            if (report[0].indexOf("Error") === 0) {
                if (data.last === true) {
                    ender();
                }
                return console.log(report[0]);
            }
            if (dirs.length > 1 && options.mode !== "diff") {
                newdir();
            } else {
                files();
            }
        },

        //write output to terminal for diffcli option
        cliWrite       = function pdNodeLocal__cliWrite(output, itempath, last) {
            var a      = 0,
                plural = "",
                pdlen  = output[0].length;
            diffCount[0] += output[output.length - 1];
            diffCount[1] += 1;
            if (options.summaryonly === true) {
                clidata[2].push(itempath);
            } else {
                if (diffCount[0] !== 1) {
                    plural = "s";
                }
                if (options.readmethod === "screen") {
                    console.log(lf + "Screen input with " + diffCount[0] + " difference" + plural);
                } else if (output[5].length === 0) {
                    console.log(lf + colors.filepath.start + itempath + lf + "Line: " + output[0][a] + colors.filepath.end);
                }
                for (a = 0; a < pdlen; a += 1) {
                    if (output[0][a + 1] !== undefined && output[0][a] === output[2][a + 1] && output[2][a] === output[0][a + 1] && output[0][a] !== output[2][a]) {
                        if (options.readmethod === "screen") {
                            console.log(lf + "Line: " + output[0][a] + colors.filepath.end);
                        } else {
                            console.log(lf + colors.filepath.start + itempath + lf + "Line: " + output[0][a] + colors.filepath.end);
                        }
                        if (output[3][a - 2] !== undefined) {
                            console.log(output[3][a - 2]);
                        }
                        if (output[3][a - 1] !== undefined) {
                            console.log(output[3][a - 1]);
                        }
                    }
                    if (output[4][a] === "delete") {
                        console.log(colors.del.lineStart + output[1][a].replace(/\\x1B/g, "\\x1B").replace(/<p(d)>/g, colors.del.charStart).replace(/<\/pd>/g, colors.del.charEnd) + colors.del.lineEnd);
                    } else if (output[4][a] === "insert") {
                        console.log(colors.ins.lineStart + output[3][a].replace(/\\x1B/g, "\\x1B").replace(/<p(d)>/g, colors.ins.charStart).replace(/<\/pd>/g, colors.ins.charEnd) + colors.ins.lineEnd);
                    } else if (output[4][a] === "equal" && a > 1) {
                        console.log(output[3][a]);
                    } else if (output[4][a] === "replace") {
                        console.log(colors.del.lineStart + output[1][a].replace(/\\x1B/g, "\\x1B").replace(/<p(d)>/g, colors.del.charStart).replace(/<\/pd>/g, colors.del.charEnd) + colors.del.lineEnd);
                        console.log(colors.ins.lineStart + output[3][a].replace(/\\x1B/g, "\\x1B").replace(/<p(d)>/g, colors.ins.charStart).replace(/<\/pd>/g, colors.ins.charEnd) + colors.ins.lineEnd);
                    }
                }
            }
            if (last === true) {
                ender();
            }
        },

        //write output to screen
        //executed from fileComplete
        screenWrite    = function pdNodeLocal__screenWrite() {
            var report = [];
            if (options.mode === "diff" && options.diffcli === true) {
                return cliWrite(prettydiff.api(options), "", false);
            }
            if (options.mode === "diff") {
                return console.log(reports()[0]);
            }
            if (options.jsscope !== "none" && options.mode === "beautify" && (options.lang === "javascript" || options.lang === "auto")) {
                return console.log(reports()[0]);
            }
            report = prettydiff.api(options);
            if (options.mode === "parse") {
                report[0] = JSON.stringify(report[0]);
            }
            return console.log(report[0]);
        },

        //generate the diff output
        //for CLI from files
        cliFile        = function pdNodeLocal__cliFile(data) {
            options.source = sfiledump[data.index];
            options.diff   = dfiledump[data.index];
            if (options.source.indexOf("undefined") === 0) {
                options.source = options
                    .source
                    .replace("undefined", "");
            }
            if (options.diff.indexOf("undefined") === 0) {
                options.diff = options
                    .diff
                    .replace("undefined", "");
            }
            if (typeof options.context !== "number" || options.context < 0) {
                console.log(lf + colors.filepath.start + data.localpath + colors.filepath.end);
            }
            cliWrite(prettydiff.api(options), data.localpath, data.last);
        },

        //is a file read operation complete?
        //executed from readLocalFile
        //executed from readHttpFile
        fileComplete   = function pdNodeLocal__fileComplete(data) {
            if (data.type === "diff") {
                dfiledump[data.index] = data.file;
                dState[data.index]    = true;
            } else {
                sfiledump[data.index] = data.file;
                sState[data.index]    = true;
            }
            if (data.index !== sfiledump.length - 1) {
                data.last = false;
            }
            if ((options.mode === "diff" && sState[data.index] === true && dState[data.index] === true) || (options.mode !== "diff" && sState[data.index] === true)) {
                if (sfiledump[data.index] !== dfiledump[data.index]) {
                    if (dfiledump[data.index] === "" || dfiledump[data.index] === "\n") {
                        console.log("Diff file at " + data.localpath + " is \x1B[31mempty\x1B[39m but the source file is not.");
                        diffCount[0] += 1;
                        diffCount[0] += 1;
                    } else if (sfiledump[data.index] === "" || sfiledump[data.index] === "\n") {
                        console.log("Source file at " + data.localpath + " is \x1B[31mempty\x1B[39m but the diff file is not.");
                        diffCount[0] += 1;
                        diffCount[0] += 1;
                    } else if (options.diffcli === true) {
                        cliFile(data);
                    } else if (method === "filescreen") {
                        if (data.type === "diff") {
                            options.diff = data.file;
                        } else {
                            options.source = data.file;
                        }
                        screenWrite();
                    } else if (method === "file" || method === "directory" || method === "subdirectory") {
                        fileWrite(data);
                    }
                    sState[data.index] = false;
                    if (options.mode === "diff") {
                        dState[data.index] = false;
                    }
                } else if (method === "screen" || method === "filescreen") {
                    ender();
                } else {
                    return;
                }
            } else if (data.last === true && data.type !== "diff" && options.diffcli === false && data.binary === false && total[0] === 0) {
                ender();
            }
        },

        //read from a binary file
        readBinaryFile = function pdNodeLocal__readBinaryFile(data) {
            fs
                .open(data.absolutepath, "r", function pdNodeLocal__readBinaryFile_open(err, fd) {
                    var buff = new Buffer(data.size);
                    if (err !== null) {
                        return pdNodeLocal__readBinaryFile(data);
                    }
                    fs
                        .read(fd, buff, 0, data.size, 0, function pdNodeLocal__readBinaryFile_open_read(erra, bytesRead, buffer) {
                            if (erra !== null) {
                                return pdNodeLocal__readBinaryFile(data);
                            }
                            if (bytesRead > 0) {
                                data.file = buffer;
                            }
                            fileComplete(data);
                        });
                });
        },

        //read from a file and determine if text
        readLocalFile  = function pdNodeLocal__readLocalFile(data) {
            var open = function pdNodeLocal__readLocalFile_open() {
                fs
                    .open(data.absolutepath, "r", function pdNodeLocal__readLocalFile_open_callback(err, fd) {
                        var msize = (data.size < 100)
                                ? data.size
                                : 100,
                            buff  = new Buffer(msize);
                        if (err !== null) {
                            return pdNodeLocal__readLocalFile(data);
                        }
                        fs
                            .read(fd, buff, 0, msize, 1, function pdNodeLocal__readLocalFile_open_callback_read(erra, bytes, buffer) {
                                if (erra !== null) {
                                    return pdNodeLocal__readLocalFile(data);
                                }
                                var bstring = buffer.toString("utf8", 0, buffer.length);
                                bstring = bstring.slice(2, bstring.length - 2);
                                if ((/[\u0002-\u0008]|[\u000e-\u001f]/).test(bstring) === true) {
                                    data.binary = true;
                                    readBinaryFile(data);
                                } else {
                                    data.binary = false;
                                    fs.readFile(data.absolutepath, {
                                        encoding: "utf8"
                                    }, function pdNodeLocal__readLocalFile_open_callback_read_readFile(errb, dump) {
                                        if (errb !== null && errb !== undefined) {
                                            return pdNodeLocal__readLocalFile(data);
                                        }
                                        if (data.file === undefined) {
                                            data.file = "";
                                        }
                                        data.file += dump;
                                        fileComplete(data);
                                        return bytes;
                                    });
                                }
                            });
                    });
            };
            if (data.size === undefined) {
                fs
                    .stat(data.absolutepath, function pdNodeLocal__readLocalFile_stat(errx, stat) {
                        if (errx !== null) {
                            if ((typeof errx === "string" && errx.indexOf("no such file or directory") > 0) || (typeof errx === "object" && errx.code === "ENOENT")) {
                                return console.log(errx);
                            }
                            return pdNodeLocal__readLocalFile(data);
                        }
                        data.size = stat.size;
                        if (data.size > 0) {
                            open();
                        } else {
                            data.binary = false;
                            data.file   = "";
                            fileComplete(data);
                        }
                    });
            } else {
                if (data.size > 0) {
                    open();
                } else {
                    data.binary = false;
                    fileComplete(data);
                }
            }
        },

        //resolve file contents from a web address
        //executed from init
        readHttpFile   = function pdNodeLocal__readHttpFile(data) {
            var file = ["", 0];
            http.get(data.absolutepath, function pdNodeLocal__readHttpFile_get(res) {
                file[1] = Number(res.headers["content-length"]);
                res.setEncoding("utf8");
                res.on("data", function pdNodeLocal__readHttpFile_get_response(chunk) {
                    file[0] += chunk;
                    if (file[0].length === file[1]) {
                        data.file      = file[0];
                        options.source = file[0];
                        fileComplete(data);
                    }
                });
            });
        },

        //gather files in directory and sub directories
        //executed from init
        directory      = function pdNodeLocal__directory() {
            //the following four are necessary because you can
            //walk a directory tree from a relative path but you
            //cannot read file contents with a relative path in
            //node at this time
            var sfiles  = {
                    count      : 0,
                    directories: 1,
                    filepath   : [],
                    total      : 0
                },
                dfiles  = {
                    count      : 0,
                    directories: 1,
                    filepath   : [],
                    total      : 0
                },
                readDir = function pdNodeLocal__directory_readDir(start, listtype) {
                    fs
                        .stat(start, function pdNodeLocal__directory_readDir_stat(erra, stat) {
                            var item    = {},
                                dirtest = function pdNodeLocal__directory_readDir_stat_dirtest(itempath, lastitem) {
                                    var pusher = function pdNodeLocal__directory_readDir_stat_dirtest_pusher(itempath) {
                                        if (listtype === "diff") {
                                            dfiles
                                                .filepath
                                                .push(itempath.replace(address.dabspath + path.sep, ""));
                                        } else {
                                            sfiles
                                                .filepath
                                                .push(itempath.replace(address.sabspath + path.sep, ""));
                                        }
                                        item.count += 1;
                                    };
                                    fs.stat(itempath, function pdNodeLocal__directory_readDir_stat_dirtest_stat(errb, stata) {
                                        var preprocess = function pdNodeLocal__directory_readDir_stat_dirtest_stat_preprocess() {
                                            var b      = 0,
                                                length = (options.mode === "diff")
                                                    ? Math.min(sfiles.filepath.length, dfiles.filepath.length)
                                                    : sfiles.filepath.length,
                                                end    = false,
                                                sizer  = function pdNodeLocal__directory_readDir_stat_dirtest_stat_preprocess_sizer(index, type, filename, finalone) {
                                                    fs
                                                        .stat(filename, function pdNodeLocal__directory_readDir_stat_dirtest_stat_preprocess_sizer_stat(errc, statb) {
                                                            var filesize = 0;
                                                            if (errc === null) {
                                                                filesize = statb.size;
                                                            }
                                                            readLocalFile({
                                                                absolutepath: filename,
                                                                index       : index,
                                                                last        : finalone,
                                                                localpath   : filename,
                                                                size        : filesize,
                                                                type        : type
                                                            });
                                                        });
                                                };
                                            sfiles
                                                .filepath
                                                .sort();
                                            if (options.mode === "diff") {
                                                dfiles
                                                    .filepath
                                                    .sort();
                                                for (b = 0; b < length; b += 1) {
                                                    dState.push(false);
                                                    sState.push(false);
                                                    sfiledump.push("");
                                                    dfiledump.push("");
                                                    if (sfiles.filepath[b] === dfiles.filepath[b]) {
                                                        if (b === length - 1) {
                                                            end = true;
                                                        }
                                                        sizer(b, "diff", dfiles.filepath[b], end);
                                                        sizer(b, "source", sfiles.filepath[b], end);
                                                    } else {
                                                        if (sfiles.filepath[b] < dfiles.filepath[b]) {
                                                            if (options.diffcli === true) {
                                                                clidata[0].push(sfiles.filepath[b]);
                                                            }
                                                            if (length === dfiles.filepath.length) {
                                                                length += 1;
                                                            }
                                                            dfiles
                                                                .filepath
                                                                .splice(b, 0, "");
                                                        } else if (dfiles.filepath[b] < sfiles.filepath[b]) {
                                                            if (options.diffcli === true) {
                                                                clidata[1].push(dfiles.filepath[b]);
                                                            }
                                                            if (length === sfiles.filepath.length) {
                                                                length += 1;
                                                            }
                                                            sfiles
                                                                .filepath
                                                                .splice(b, 0, "");
                                                        }
                                                        if (b === length - 1) {
                                                            ender();
                                                        }
                                                    }
                                                }
                                            } else {
                                                if (options.output !== "") {
                                                    total[0] = length;
                                                    if (options.report === true) {
                                                        total[0] += length;
                                                    }
                                                    for (b = 0; b < length; b += 1) {
                                                        if (b === length - 1) {
                                                            end = true;
                                                        }
                                                        if (sfiles.filepath[b] !== undefined) {
                                                            sizer(b, "source", sfiles.filepath[b], end);
                                                        } else {
                                                            total[0] -= 2;
                                                        }
                                                    }
                                                } else {
                                                    ender();
                                                }
                                            }
                                        };
                                        if (errb !== null) {
                                            return console.log(errb);
                                        }
                                        if (stata.isDirectory() === true) {
                                            if (method === "subdirectory") {
                                                item.directories += 1;
                                                pdNodeLocal__directory_readDir(itempath, listtype);
                                                item.count += 1;
                                            }
                                            if (method === "directory") {
                                                item.total       -= 1;
                                                item.directories = 0;
                                            }
                                        } else if (stata.isFile() === true) {
                                            pusher(itempath);
                                        } else {
                                            if (listtype === "diff") {
                                                dfiles.total -= 1;
                                            } else {
                                                sfiles.total -= 1;
                                            }
                                            console.log(itempath + lf + "is an unsupported type");
                                        }
                                        if (lastitem === true && ((options.mode === "diff" && sfiles.count === sfiles.total && dfiles.count === dfiles.total && sfiles.directories === 0 && dfiles.directories === 0) || (options.mode !== "diff" && item.directories === 0 && item.count === item.total))) {
                                            return preprocess();
                                        }
                                    });
                                };
                            if (erra !== null) {
                                return console.log(erra);
                            }
                            if (stat.isDirectory() === true) {
                                fs
                                    .readdir(start, function pdNodeLocal__directory_readDir_stat_readdir(errd, files) {
                                        var x         = 0,
                                            filetotal = files.length;
                                        if (errd !== null || filetotal === 0) {
                                            if (method === "subdirectory") {
                                                if (listtype === "diff") {
                                                    dfiles.directories -= 1;
                                                } else {
                                                    sfiles.directories -= 1;
                                                }
                                            }
                                            if (errd !== null) {
                                                return console.log(errd);
                                            }
                                            return;
                                        }
                                        if (listtype === "diff") {
                                            item = dfiles;
                                        } else {
                                            item = sfiles;
                                        }
                                        item.total += filetotal;
                                        for (x = 0; x < filetotal; x += 1) {
                                            if (x === filetotal - 1) {
                                                item.directories -= 1;
                                                dirtest(start + path.sep + files[x], true);
                                            } else {
                                                dirtest(start + path.sep + files[x], false);
                                            }
                                        }
                                    });
                            } else {
                                return console.log("path: " + start + " is not a directory");
                            }
                        });
                };
            readDir(address.sabspath, "source");
            if (options.mode === "diff") {
                readDir(address.dabspath, "diff");
            }
        };

    //defaults for the options
    (function pdNodeLocal__start() {
        var a         = process
                .argv
                .slice(2),
            b         = 0,
            c         = a.length,
            d         = [],
            e         = [],
            f         = 0,
            alphasort = false,
            outready  = false,
            pdrcpath  = __dirname.replace(/(api)$/, "") + ".prettydiffrc",
            pathslash = function pdNodeLocal__start_pathslash(name, x) {
                var y        = x.indexOf("://"),
                    z        = "",
                    itempath = "",
                    ind      = "",
                    odirs   = [],
                    olen     = 0,
                    basepath = "",
                    makeout  = function pdNodeLocal__start_pathslash_makeout() {
                        basepath = basepath + odirs[olen] + path.sep;
                        fs.mkdir(basepath, function pdNodeLocal__start_pathslash_makeout_mkdir(err) {
                            if (err !== undefined && err !== null && err.code !== "EEXIST") {
                                console.log(err);
                                outready = true;
                            } else if (olen < odirs.length) {
                                olen += 1;
                                pdNodeLocal__start_pathslash_makeout();
                            } else {
                                outready = true;
                            }
                        });
                    },
                    abspath  = function pdNodeLocal__start_pathslash_abspath() {
                        var tree  = cwd.split(path.sep),
                            ups   = [],
                            uplen = 0;
                        if (itempath.indexOf("..") === 0) {
                            ups   = itempath.replace(/\.\.\//g, ".." + path.sep).split(".." + path.sep);
                            uplen = ups.length;
                            do {
                                uplen -= 1;
                                tree.pop();
                            } while (uplen > 1);
                            return tree.join(path.sep) + path.sep + ups[ups.length - 1];
                        }
                        if ((/^([a-z]:(\\|\/))/).test(itempath) === true || itempath.indexOf(path.sep) === 0) {
                            return itempath;
                        }
                        return path.join(cwd, itempath);
                    };
                if (name === "diff") {
                    ind = 0;
                }
                if (name === "output") {
                    ind = 1;
                }
                if (name === "source") {
                    ind = 2;
                }
                if (x.indexOf("http://") === 0 || x.indexOf("https://") === 0) {
                    dir[ind] = 3;
                    return x;
                }
                if (y < 0) {
                    itempath = x.replace(/\\/g, "/");
                } else {
                    z        = x.slice(0, y);
                    x        = x.slice(y + 3);
                    itempath = z + "://" + x.replace(/\\/g, "/");
                }
                fs
                    .stat(itempath, function pdNodeLocal__start_pathslash_stat(err, stat) {
                        if (err !== null) {
                            dir[ind] = -1;
                            return "";
                        }
                        if (stat.isDirectory() === true) {
                            dir[ind] = 1;
                        } else if (stat.isFile() === true) {
                            dir[ind] = 2;
                            if (name === "output") {
                                outready = true;
                            }
                        } else {
                            dir[ind] = -1;
                            if (name === "output") {
                                outready = true;
                            }
                        }
                    });
                if (name === "diff") {
                    address.dabspath = abspath();
                    address.dorgpath = itempath;
                }
                if (name === "output") {
                    itempath = itempath.replace(/\//g, path.sep);
                    address.oabspath = abspath();
                    address.oorgpath = itempath;
                    if (address.oabspath.charAt(address.oabspath.length - 1) !== path.sep) {
                        address.oabspath = address.oabspath + path.sep;
                    }
                    basepath         = address.oabspath.replace(path.sep + address.oorgpath, "");
                    odirs            = address.oorgpath.split(path.sep);
                    makeout();
                }
                if (name === "source") {
                    address.sabspath = abspath();
                    address.sorgpath = itempath;
                }
                return itempath;
            };
        for (b = 0; b < c; b += 1) {
            e = [];
            f = a[b].indexOf(":");
            e.push(a[b].substring(0, f).replace(/(\s+)$/, ""));
            e.push(a[b].substring(f + 1).replace(/^(\s+)/, ""));
            d.push(e);
        }
        c = d.length;
        for (b = 0; b < c; b += 1) {
            if (d[b].length === 2) {
                if (options.version === false && d[b][0] === "" && (d[b][1] === "help" || d[b][1] === "man" || d[b][1] === "manual")) {
                    help = true;
                } else if (help === false && d[b][0] === "" && (d[b][1] === "v" || d[b][1] === "version")) {
                    options.version = true;
                } else if (d[b][0] === "api") {
                    options.api = "node";
                } else if (d[b][0] === "braceline" && d[b][1] === "true") {
                    options.braceline = true;
                } else if (d[b][0] === "bracepadding" && d[b][1] === "true") {
                    options.bracepadding = true;
                } else if ((d[b][0] === "braces" && d[b][1] === "allman") || (d[b][0] === "indent" && d[b][1] === "allman")) {
                    options.braces = "allman";
                } else if (d[b][0] === "color" && (d[b][1] === "canvas" || d[b][1] === "shadow")) {
                    options.color = d[b][1];
                } else if (d[b][0] === "comments" && d[b][1] === "noindent") {
                    options.comments = "noindent";
                } else if (d[b][0] === "commline" && d[b][1] === "true") {
                    options.commline = true;
                } else if (d[b][0] === "conditional" && d[b][1] === "true") {
                    options.conditional = true;
                } else if (d[b][0] === "content" && d[b][1] === "true") {
                    options.content = true;
                } else if (d[b][0] === "context" && isNaN(d[b][1]) === false) {
                    options.context = Number(d[b][1]);
                } else if (d[b][0] === "correct" && d[b][1] === "true") {
                    options.correct = true;
                } else if (d[b][0] === "crlf" && d[b][1] === "true") {
                    options.crlf = true;
                    lf           = "\r\n";
                } else if (d[b][0] === "cssinsertlines" && d[b][1] === "true") {
                    options.cssinsertlines = true;
                } else if (d[b][0] === "csvchar" && d[b][1].length > 0) {
                    options.csvchar = d[b][1];
                } else if (d[b][0] === "diff" && d[b][1].length > 0) {
                    options.diff = pathslash(d[b][0], d[b][1]);
                } else if (d[b][0] === "diffcli" && d[b][1] === "true") {
                    options.diffcli = true;
                } else if (d[b][0] === "diffcomments" && d[b][1] === "true") {
                    options.diffcomments = true;
                } else if (d[b][0] === "difflabel" && d[b][1].length > 0) {
                    options.difflabel = d[b][1];
                } else if (d[b][0] === "diffspaceignore" && d[b][1] === "true") {
                    options.diffspaceignore = true;
                } else if (d[b][0] === "diffview" && d[b][1] === "inline") {
                    options.diffview = "inline";
                } else if (d[b][0] === "dustjs" && d[b][1] === "true") {
                    options.dustjs = true;
                } else if (d[b][0] === "elseline" && d[b][1] === "true") {
                    options.elseline = true;
                } else if (d[b][0] === "endcomma" && d[b][1] === "true") {
                    options.endcomma = true;
                } else if (d[b][0] === "force_indent" && d[b][1] === "true") {
                    options.force_indent = true;
                } else if (d[b][0] === "html" && d[b][1] === "true") {
                    options.html = true;
                } else if (d[b][0] === "inchar" && d[b][1].length > 0) {
                    d[b][1]        = d[b][1]
                        .replace(/\\t/g, "\u0009")
                        .replace(/\\n/g, "\u000a")
                        .replace(/\\r/g, "\u000d")
                        .replace(/\\f/g, "\u000c")
                        .replace(/\\b/g, "\u0008");
                    options.inchar = d[b][1];
                } else if (d[b][0] === "inlevel" && isNaN(d[b][1]) === false) {
                    options.inlevel = Number(d[b][1]);
                } else if (d[b][0] === "insize" && isNaN(d[b][1]) === false) {
                    options.insize = Number(d[b][1]);
                } else if (d[b][0] === "jsscope") {
                    if (d[b][1] === "true") {
                        options.jsscope = "report";
                    } else if (d[b][1] === "report" || d[b][1] === "html") {
                        options.jsscope = d[b][1];
                    } else {
                        options.jsscope = "none";
                    }
                } else if (d[b][0] === "lang" && (d[b][1] === "markup" || d[b][1] === "javascript" || d[b][1] === "css" || d[b][1] === "html" || d[b][1] === "csv" || d[b][1] === "text")) {
                    options.lang = d[b][1];
                    if (d[b][1] === "html") {
                        options.html = true;
                    }
                } else if (d[b][0] === "langdefault" && (d[b][1] === "markup" || d[b][1] === "javascript" || d[b][1] === "css" || d[b][1] === "html" || d[b][1] === "csv")) {
                    options.langdefault = d[b][1];
                } else if (d[b][0] === "methodchain") {
                    if (d[b][1] === "true" || d[b][1] === "chain") {
                        options.methodchain = "chain";
                    } else if (d[b][1] === "none") {
                        options.methodchain = "none";
                    } else {
                        options.methodchain = "indent";
                    }
                } else if (d[b][0] === "miniwrap" && d[b][1] === "true") {
                    options.miniwrap = true;
                } else if (d[b][0] === "mode" && (d[b][1] === "minify" || d[b][1] === "beautify" || d[b][1] === "parse")) {
                    options.mode = d[b][1];
                } else if (d[b][0] === "neverflatten" && d[b][1] === "true") {
                    options.neverflatten = true;
                } else if (d[b][0] === "nocaseindent" && d[b][1] === "true") {
                    options.nocaseindent = true;
                } else if (d[b][0] === "noleadzero" && d[b][1] === "true") {
                    options.noleadzero = true;
                } else if (d[b][0] === "objsort") {
                    if (d[b][1] === "all" || d[b][1] === "none" || d[b][1] === "css" || d[b][1] === "js" || d[b][1] === "markup") {
                        options.objsort = d[b][1];
                    } else if (d[b][1] === "true") {
                        options.objsort = "js";
                    }
                } else if (d[b][0] === "output" && d[b][1].length > 0) {
                    options.output = pathslash(d[b][0], d[b][1]);
                } else if (d[b][0] === "preserve") {
                    if (d[b][1] === "all" || d[b][1] === "none" || d[b][1] === "css" || d[b][1] === "js") {
                        options.preserve = d[b][1];
                    } else if (d[b][1] === "true") {
                        options.preserve = "all";
                    }
                } else if (d[b][0] === "quote" && d[b][1] === "true") {
                    options.quote = true;
                } else if (d[b][0] === "quoteConvert" && (d[b][1] === "single" || d[b][1] === "double")) {
                    options.quoteConvert = d[b][1];
                } else if (d[b][0] === "readmethod") {
                    if (d[b][1] === "auto") {
                        options.readmethod = "auto";
                    }
                    if (d[b][1] === "file") {
                        options.readmethod = "file";
                    }
                    if (d[b][1] === "filescreen") {
                        options.readmethod = "filescreen";
                    }
                    if (d[b][1] === "directory") {
                        options.readmethod = "directory";
                    }
                    if (d[b][1] === "subdirectory") {
                        options.readmethod = "subdirectory";
                    }
                    method = options.readmethod;
                } else if (d[b][0] === "report") {
                    options.output = d[b][1];
                } else if (d[b][0] === "selectorlist" && d[b][1] === "true") {
                    options.selectorlist = true;
                } else if (d[b][0] === "semicolon" && d[b][1] === "true") {
                    options.semicolon = true;
                } else if (d[b][0] === "source" && d[b][1].length > 0) {
                    options.source = pathslash(d[b][0], d[b][1]);
                } else if (d[b][0] === "sourcelabel" && d[b][1].length > 0) {
                    options.sourcelabel = d[b][1];
                } else if (d[b][0] === "space" && d[b][1] === "false") {
                    options.space = false;
                } else if (d[b][0] === "spaceclose" && d[b][1] === "true") {
                    options.spaceclose = true;
                } else if (d[b][0] === "style" && d[b][1] === "noindent") {
                    options.style = "noindent";
                } else if (d[b][0] === "styleguide") {
                    options.styleguide = d[b][1];
                } else if (d[b][0] === "summaryonly" && d[b][1] === "true") {
                    options.summaryonly = true;
                } else if (d[b][0] === "tagmerge" && d[b][1] === "true") {
                    options.tagmerge = true;
                } else if (d[b][0] === "tagsort" && d[b][1] === "true") {
                    options.tagsort = true;
                } else if (d[b][0] === "ternaryline" && d[b][1] === "true") {
                    options.ternaryline = true;
                } else if (d[b][0] === "textpreserve" && d[b][1] === "true") {
                    options.textpreserve = true;
                } else if (d[b][0] === "titanium" && d[b][1] === "true") {
                    options.titanium = true;
                } else if (d[b][0] === "topcoms" && d[b][1] === "true") {
                    options.topcoms = true;
                } else if (d[b][0] === "varword" && (d[b][1] === "each" || d[b][1] === "list")) {
                    options.varword = d[b][1];
                } else if (d[b][0] === "vertical") {
                    if (d[b][1] === "all" || d[b][1] === "none" || d[b][1] === "css" || d[b][1] === "js") {
                        options.vertical = d[b][1];
                    } else if (d[b][1] === "true") {
                        options.vertical = "all";
                    }
                } else if (d[b][0] === "wrap") {
                    if (isNaN(d[b][1]) === true) {
                        options.wrap = 80;
                    } else {
                        options.wrap = Number(d[b][1]);
                    }
                }
            } else if (help === false && options.version === false) {
                if (d[b] === "help" || d[b][0] === "help" || d[b][0] === "man" || d[b][0] === "manual") {
                    help = true;
                } else if (d[b] === "v" || d[b] === "version" || d[b][0] === "v" || d[b][0] === "version") {
                    options.version = true;
                }
            }
        }

        if (options.output === "") {
            outready = true;
        }

        fs
            .stat(pdrcpath, function pdNodeLocal__start_stat(err, stats) {
                var init = function pdNodeLocal__start_stat_init() {
                    var state  = true,
                        status = function pdNodeLocal__start_stat_init_status() {
                            var tempaddy = "";
                            //status codes
                            //-1 is not file or directory
                            //0 is status pending
                            //1 is directory
                            //2 is file
                            //3 is file via http/s
                            //
                            //dir[0] - diff
                            //dir[1] - output
                            //dir[2] - source
                            if (dir[2] === 0) {
                                return;
                            }
                            if (method === "auto") {
                                if (dir[2] === 1) {
                                    method = "subdirectory";
                                } else if (dir[2] > 1) {
                                    if (options.output === "") {
                                        method = "filescreen";
                                    } else {
                                        if (options.output === "" && options.mode !== "diff") {
                                            console.log("");
                                            console.log("\x1B[91mNo output option is specified, so no files written.\x1B[39m");
                                            console.log("");
                                        }
                                        method = "file";
                                        if (options.output === "") {
                                            return console.log("Error: 'readmethod' is value 'file' and argument 'output' is empty");
                                        }
                                    }
                                } else if (dir[2] < 0) {
                                    method = "screen";
                                }
                            }
                            if (dir[2] < 0) {
                                state = false;
                                if (options.readmethod === "screen" && options.mode !== "diff") {
                                    return screenWrite();
                                }
                                if (options.readmethod !== "screen") {
                                    return console.log("source is not a directory or file");
                                }
                            }
                            if (dir[2] === 1 && method !== "directory" && method !== "subdirectory") {
                                state = false;
                                return console.log("source is a directory but readmethod option is not 'auto', 'directory', or 'subd" +
                                        "irectory'");
                            }
                            if (dir[2] > 1) {
                                if (method === "directory" || method === "subdirectory") {
                                    state = false;
                                    return console.log("source is a file but readmethod option is 'directory' or 'subdirectory'");
                                }
                                if (method === "screen") {
                                    method = "filescreen";
                                }
                            }
                            if (options.mode === "diff") {
                                if (dir[0] === 0 || dir[2] === 0) {
                                    return;
                                }
                                if (dir[0] < 0) {
                                    state = false;
                                    if (dir[2] < 0 && options.readmethod === "screen") {
                                        if (options.diffcli === true) {
                                            return cliWrite(prettydiff.api(options), "", false);
                                        }
                                        return screenWrite();
                                    }
                                    return console.log("diff is not a directory or file");
                                }
                                if (dir[0] === 1 && method !== "directory" && method !== "subdirectory") {
                                    state = false;
                                    return console.log("diff is a directory but readmethod option is not 'directory' or 'subdirectory'");
                                }
                                if (dir[0] > 2 && (method === "directory" || method === "subdirectory")) {
                                    state = false;
                                    return console.log("diff is a file but readmethod option is 'directory' or 'subdirectory'");
                                }
                                if (dir[0] > 1 && method === "screen") {
                                    method = "filescreen";
                                }
                                if (dir[0] > 1 && dir[2] > 1 && (method === "file" || method === "filescreen")) {
                                    state = false;
                                    dState.push(false);
                                    sState.push(false);
                                    if (dir[0] === 3) {
                                        readHttpFile({absolutepath: options.diff, index: 0, last: true, localpath: options.diff, type: "diff"});
                                    } else {
                                        tempaddy = options.diff.replace(/(\/|\\)/g, path.sep);
                                        readLocalFile({absolutepath: tempaddy, index: 0, last: true, localpath: tempaddy, type: "diff"});
                                    }
                                    if (dir[2] === 3) {
                                        readHttpFile({absolutepath: options.source, index: 0, last: true, localpath: options.source, type: "source"});
                                    } else {
                                        tempaddy = options.source.replace(/(\/|\\)/g, path.sep);
                                        readLocalFile({absolutepath: tempaddy, index: 0, last: true, localpath: tempaddy, type: "source"});
                                    }
                                    return;
                                }
                                if (dir[0] === 1 && dir[2] === 1 && (method === "directory" || method === "subdirectory")) {
                                    state = false;
                                    return directory();
                                }
                            } else {
                                if (dir[2] > 1 && (method === "file" || method === "filescreen")) {
                                    state = false;
                                    sState.push(false);
                                    if (dir[2] === 3) {
                                        readHttpFile({absolutepath: options.source, index: 0, last: true, localpath: options.source, type: "source"});
                                    } else {
                                        readLocalFile({absolutepath: options.source, index: 0, last: true, localpath: options.source, type: "source"});
                                    }
                                    return;
                                }
                                if (dir[2] === 1 && (method === "directory" || method === "subdirectory")) {
                                    state = false;
                                    return directory();
                                }
                            }
                        },
                        delay  = function pdNodeLocal__start_stat_init_delay() {
                            if (state === true || outready === false) {
                                status();
                                setTimeout(function pdNodeLocal__start_stat_init_delay_setTimeout() {
                                    pdNodeLocal__start_stat_init_delay();
                                }, 50);
                            }
                        };
                    if (alphasort === true) {
                        options.objsort = "all";
                    }
                    if (options.lang === "tss") {
                        options.titanium = true;
                        options.lang     = "javascript";
                    }
                    if (options.mode !== "diff") {
                        options.diffcli     = false;
                        options.summaryonly = false;
                    }
                    if (options.summaryonly === true) {
                        options.diffcli = true;
                    }

                    if (help === true) {
                        return console.log(error);
                    }
                    if (c === 1 && options.version === true) {
                        return console.log(versionString);
                    }
                    if (options.source === "") {
                        return console.log("Error: 'source' argument is empty");
                    }
                    if (options.mode === "diff" && options.diff === "") {
                        return console.log("Error: 'diff' argument is empty");
                    }
                    if ((options.mode === "diff" && options.summaryonly === false) || (options.jsscope !== "none" && options.mode === "beautify")) {
                        options.report = true;
                    }
                    if ((options.output === "" || options.summaryonly === true) && options.mode === "diff") {
                        if (options.readmethod !== "screen") {
                            options.diffcli = true;
                        }
                        if (process.argv.join(" ").indexOf(" context:") === -1) {
                            options.context = 2;
                        }
                    }
                    if (method === "file" && options.output === "" && options.summaryonly === false && options.diffcli === false) {
                        return console.log("Error: 'readmethod' is value 'file' and argument 'output' is empty");
                    }
                    if (options.summaryonly === true) {
                        options.report = false;
                    }
                    if (dir[2] === 0 || outready === false || (options.mode === "diff" && dir[0] === 0)) {
                        delay();
                    } else {
                        status();
                    }
                };

                if (err !== null) {
                    if (c === 0) {
                        help = true;
                    }
                    init();
                } else if (stats.isFile() === true) {
                    fs
                        .readFile(pdrcpath, {
                            encoding: "utf8"
                        }, function pdNodeLocal__start_stat_readFile(error, data) {
                            var s       = options.source,
                                dd      = options.diff,
                                o       = options.output,
                                h       = false,
                                pdrc    = {},
                                pdkeys  = [],
                                eachkey = function pdNodeLocal__start_stat_readFile_eachkey(val) {
                                    if (val !== "help" && val !== "version" && val !== "v" && val !== "man" && val !== "manual") {
                                        b += 1;
                                        if (options[val] !== undefined) {
                                            options[val] = pdrc[val];
                                            if (val === "help" && pdrc[val] === true) {
                                                h = true;
                                                b -= 1;
                                            }
                                        }
                                    }
                                };
                            if (error !== null && error !== undefined) {
                                return init();
                            }
                            if ((/^(\s*\{)/).test(data) === true && (/(\}\s*)$/).test(data) === true) {
                                pdrc   = JSON.parse(data);
                                pdkeys = Object.keys(pdrc);
                                b      = 0;
                                pdkeys.forEach(eachkey);
                                if (b > 0 && h === false) {
                                    help = false;
                                }
                                method = options.readmethod;
                                if (s !== options.source) {
                                    pathslash("source", options.source);
                                }
                                if (dd !== options.diff) {
                                    pathslash("diff", options.diff);
                                }
                                if (o !== options.output) {
                                    pathslash("output", options.output);
                                }
                                init();
                            } else {
                                pdrc = require(pdrcpath);
                                if (pdrc.preset !== undefined) {
                                    options = pdrc.preset(options);
                                    method  = options.readmethod;
                                    if (s !== options.source) {
                                        pathslash("source", options.source);
                                    }
                                    if (dd !== options.diff) {
                                        pathslash("diff", options.diff);
                                    }
                                    if (o !== options.output) {
                                        pathslash("output", options.output);
                                    }
                                    help = false;
                                    if (options.help === true && (process.argv.length < 3 || options.source === undefined || options.source === "")) {
                                        help = true;
                                    }
                                    init();
                                }
                            }
                        });
                } else {
                    init();
                }
                if (c === 0) {
                    help = true;
                }
            });
    }());
}());
