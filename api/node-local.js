/*jslint node:true, stupid:true */
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

Command line API for Prettydiff for local file system only.  This API
makes no requests or connections outside the local file system.

Arguments entered from the command line are separated by spaces and
values are separated from argument names by a colon.  For safety
argument values should always be quoted.

Examples:

> node node-local.js source:"c:\mydirectory\myfile.js" readmethod:"file"
    diff:"c:\myotherfile.js" 
> node node-local.js source:"c:\mydirectory\myfile.js" mode:"beautify"
    readmethod:"file" output:"c:\output\otherfile.js"
*/

(function () {
    "use strict";
    var prettydiff = require('../prettydiff.js'),
        fs = require("fs"),
        sources = [],
        diffs = [],
        slash = fs.existsSync("c:\\") ? "\\" : "/",
        options = {
            source: "",
            diff: "",
            mode: "diff",
            html: false,
            lang: "auto",
            topcoms: false,
            csvchar: ",",
            comments: "indent",
            content: false,
            force_indent: false,
            context: "",
            diffview: "sidebyside",
            insize: 4,
            inchar: " ",
            indent: "",
            quote: false,
            semicolon: false,
            style: "indent",
            sourcelabel: "base",
            difflabel: "new",
            conditional: false,
            diffcomments: false,
            wrap: 0,
            color: "shadow",
            readmethod: "screen",
            output: "",
            report: true
        },
        args = (function () {
            var a = process.argv.slice(2),
                b = 0,
                c = a.length,
                d = [],
                e = [],
                f = 0;
            for (b = 0; b < c; b += 1) {
                e = [];
                f = a[b].indexOf(":");
                e.push(a[b].substring(0, f).replace(/(\s+)$/, "").toLowerCase());
                e.push(a[b].substring(f + 1).replace(/^(\s+)/, "").toLowerCase());
                d.push(e);
            }
            c = d.length;
            for (b = 0; b < c; b += 1) {
                if (d[b].length === 2) {
                    if (d[b][0] === "source" && d[b][1].length > 0) {
                        options.source = d[b][1];
                    }
                    if (d[b][0] === "diff" && d[b][1].length > 0) {
                        options.diff = d[b][1];
                    }
                    if (d[b][0] === "mode" && (d[b][1] === "minify" || d[b][1] === "beautify")) {
                        options.mode = d[b][1];
                    }
                    if (d[b][0] === "html" && d[b][1] === "true") {
                        options.html = true;
                    }
                    if (d[b][0] === "lang" && (d[b][1] === "markup" || d[b][1] === "javascript" || d[b][1] === "css" || d[b][1] === "html" || d[b][1] === "csv" || d[b][1] === "text")) {
                        options.lang = d[b][1];
                        if (d[b][1] === "html") {
                            options.html = true;
                        }
                    }
                    if (d[b][0] === "topcoms" && d[b][1] === "true") {
                        options.topcoms = true;
                    }
                    if (d[b][0] === "csvchar" && d[b][1].length > 0) {
                        options.csvchar = d[b][1];
                    }
                    if (d[b][0] === "comments" && d[b][1] === "noindent") {
                        options.comments = "noindent";
                    }
                    if (d[b][0] === "content" && d[b][1] === "true") {
                        options.content = true;
                    }
                    if (d[b][0] === "force_indent" && d[b][1] === "true") {
                        options.force_indent = true;
                    }
                    if (d[b][0] === "context" && !isNaN(d[b][1])) {
                        options.context = Number(d[b][1]);
                    }
                    if (d[b][0] === "diffview" && d[b][1] === "inline") {
                        options.diffview = "inline";
                    }
                    if (d[b][0] === "insize" && !isNaN(d[b][1])) {
                        options.insize = Number(d[b][1]);
                    }
                    if (d[b][0] === "inchar" && d[b][1].length > 0) {
                        options.inchar = d[b][1];
                    }
                    if (d[b][0] === "indent" && d[b][1] === "allman") {
                        options.indent = "allman";
                    }
                    if (d[b][0] === "quote" && d[b][1] === "true") {
                        options.quote = true;
                    }
                    if (d[b][0] === "semicolon" && d[b][1] === "true") {
                        options.semicolon = true;
                    }
                    if (d[b][0] === "style" && d[b][1] === "noindent") {
                        options.style = "noindent";
                    }
                    if (d[b][0] === "sourcelabel" && d[b][1].length > 0) {
                        options.sourcelabel = d[b][1];
                    }
                    if (d[b][0] === "difflabel" && d[b][1].length > 0) {
                        options.difflabel = d[b][1];
                    }
                    if (d[b][0] === "conditional" && d[b][1] === "true") {
                        options.conditional = true;
                    }
                    if (d[b][0] === "diffcomments" && d[b][1] === "true") {
                        options.diffcomments = true;
                    }
                    if (d[b][0] === "wrap") {
                        if (isNaN(d[b][1])) {
                            options.wrap = 0;
                        } else {
                            options.wrap = Number(d[b][1]);
                        }
                    }
                    if (d[b][0] === "color" && (d[b][1] === "default" || d[b][1] === "coffee" || d[b][1] === "dark" || d[b][1] === "canvas" || d[b][1] === "white")) {
                        options.color = d[b][1];
                    }
                    if (d[b][0] === "readmethod") {
                        if (d[b][1] === "file") {
                            options.readmethod = "file";
                        }
                        if (d[b][1] === "filescreen") {
                            options.readmethod = "filescreen";
                        }
                        if (d[b][1] === "directory") {
                            options.readmethod = "directory";
                        }
                    }
                    if (d[b][0] === "output" && d[b][1].length > 0) {
                        options.output = d[b][1];
                    }
                    if (d[b][0] === "report") {
                        options.output = d[b][1];
                    }
                }
            }
            return a.length;
        }()),
        report = ["", ""],
        reportname = "",
        reports = function () {
            var result = prettydiff.api(options),
                css = {
                    body: "body{font-family:\"Arial\";font-size:10px}h1{float:left;font-size:2em;margin:0 .5em .5em 0}h2{background:#fff;border-style:solid;border-width:.075em;float:left;font-size:1.8em;font-weight:bold;margin:0 .5em .5em 0;padding:0 .2em}p{clear:both;font-size:1.2em;margin:0 0 1em}table.diff{border-collapse:collapse}table.diff tbody{font-family:'Courier New',Courier,'Lucida Console',monospace;font-size:1.1em}table.diff tbody th{font-family:verdana,arial,'Bitstream Vera Sans',helvetica,sans-serif;font-weight:normal;padding:.5em .6em 0 2.4em;text-align:right;vertical-align:top}table.diff thead{font-family:Verdana;text-align:left}table.diff thead{border-bottom-style:solid;border-bottom-width:.1em}table.diff thead th{border-left-style:solid;border-left-width:.1em;padding-left:2em}table.diff tbody td{letter-spacing:.1em;padding:.5em .5em 0;vertical-align:top;white-space:pre}table.diff tbody td em{font-style:normal;margin:0 -.09em;padding:.05em 0}table.diff th.author{border-top-style:solid;border-top-width:.1em;padding:.4em;text-align:right}table.diff .replace em,table.diff .delete em,table.diff .insert em,table.diff .skip,table.diff tbody th,table.diff{border-style:solid;border-width:.1em}.analysis th{text-align:left}.analysis td{text-align:right}.analysis .bad,.analysis .good{font-weight:bold}#doc th{font-weight:bold}#doc td span{display:block}#doc table,.box .body table{border-collapse:collapse;border-style:solid;border-width:.2em;clear:both}#doc table{font-size:1.2em}#doc td,#doc th{border-left-style:solid;border-left-width:.1em;border-top-style:solid;border-top-width:.1em;padding:.5em}#doc em{font-style:normal;font-weight:bold}@media print{p,ul{display:none}div{width:100%}html td{font-size:.8em;white-space:normal}}",
                    sdefault: "html .default,body.default{background:url(\"images/body.gif\") repeat-x #a8b8c8;color:#000}body.default button{background:#dfd;border-color:#030;box-shadow:0 .1em .2em rgba(0,32,0,0.75);color:#030}.default a{color:#f00}.default button:hover{background:#f6fff6}.default button:active{background:#030;color:#dfd}.default #title_text{background:#fff;border-color:#000;box-shadow:0 .15em .3em rgba(0,0,0,0.5);color:#000}.default #introduction h2{border-color:#f00;color:#c00}.default h1 svg{border-color:#600;box-shadow:0 .2em .4em rgba(0,0,0,0.5)}.default h2,.default h3{border-color:#000}.default fieldset{border-color:#caa}.default legend{border-color:#fee;color:#966}.default .button button{background:url(\"images/green.png\") repeat-x 0 100%#dfd}.default .button button:hover{background:#f6fff6}.default .button button:active{background:#030;color:#efe}.default .box{background:#ccc;border-color:#006;box-shadow:0 .4em .8em rgba(0,0,64,0.75)}.default .box button{box-shadow:0 .1em .2em rgba(0,0,64,0.5)}.default .box button.resize{background:#ddf;border-color:#006;color:#006}.default .box button.minimize{background:#ddf;border-color:#006;color:#006}.default .box button.minimize:hover,.default .box button.resize:hover{background:#99f}.default .box button.save{background:#ddf;border-color:#006;color:#006}.default .box button.save:hover{background:#99f}.default .box h3.heading{background:#eef;border-color:#006}.default .box h3.heading:hover{background:#ccf}.default .box .body{background:#d8dde8;border-color:#006;box-shadow:0 0 .4em rgba(0,64,0,0.75)}.default .options{background:url(\"images/backred.gif\") #fee repeat-x 100% 100%;border-color:#600;box-shadow:0 .2em .4em rgba(64,0,0,0.5)}.default .options h2{border-color:#600;box-shadow:0 .1em .2em rgba(102,0,0,0.75)}.default #Beautify h2,.default #Minify h2,.default #diffBase h2,.default #diffNew h2{border-color:#006;box-shadow:0 .1em .2em rgba(0,0,64,0.5)}.default #option_comment{background:#fee;border-color:#600}.default #top em{color:#00f}.default #update{background:#fff;border-color:#000;box-shadow:0 .1em .2em rgba(0,0,0,0.5)}.default .wide,.default .tall,.default #diffBase,.default #diffNew{background:url(\"images/backblue.gif\") #eef repeat-x 100% 100%;border-color:#006;box-shadow:0 .2em .4em rgba(0,0,64,0.5)}.default .file input,.default .labeltext input{border-color:#006}#webtool.default input.unchecked{background:#eef8ff;color:#000}.default .options input[type=text],.default .options select{border-color:#933}.default #beautyoutput,.default #minifyoutput{background:#ddd}.default #diffoutput p em,.default #diffoutput li em{color:#c00}.default .analysis .bad{background-color:#e99;color:#400}.default .analysis .good{background-color:#9e9;color:#040}.default #doc .analysis thead th,.default #doc .analysis th[colspan]{background:#eef}.default div input{border-color:#933}.default textarea{border-color:#339}.default textarea:hover{background:#eef8ff}.default table.diff{border-color:#bbc}.default table.diff tbody th{background:#eed;border-color:#bbc;color:#886}.default table.diff thead{background:#efefef;border-bottom-color:#bbc}.default table.diff thead th{border-left-color:#bbc}.default table.diff .empty{background-color:#ddd}.default table.diff .replace{background-color:#fd8}.default table.diff .replace em{background-color:#ffd;border-color:#963;color:#630}.default table.diff .delete{background-color:#e99}.default table.diff .delete em{background-color:#fdd;border-color:#700;color:#600}.default table.diff .equal{background-color:#fff}.default table.diff .skip{background-color:#efefef;border-color:#aaa #bbc #aaa #aaa}.default table.diff .insert{background-color:#9e9}.default table.diff .insert em{background-color:#efc;border-color:#070;color:#050}.default #doc table,#doc.default table,.default .box .body table{background:#fff;border-color:#669}.default #doc strong,.default .box .body strong{color:#c00}.default .box .body em,.default .box .body #doc em{color:#090}.default table.diff th.author{background:#efefef;border-top-color:#bbc}.default #thirdparties img,.default #diffoutput #thirdparties{border-color:#687888}.default #diffoutput #thirdparties{background:#c8d8e8}.default #doc div,#doc.default div{background:#eef;border-color:#669}.default #doc ol,#doc.default ol{background:#fff;border-color:#669}.default #doc div div,#doc.default div div{background:#fff;border-color:#966}.default #doc th,#doc.default th{background:#fed;border-left-color:#669;border-top-color:#669}.default #doc tr:hover,#doc.default tr:hover{background:#fed}.default #doc em,#doc.default em{color:#060}.default #doc div:hover,#doc.default div:hover{background:#def}.default #doc div div:hover,#doc.default div div:hover,#doc.default div ol:hover{background:#fed}.default #pdsamples li{background:#eef;border-color:#006}.default #pdsamples li div{background:url(\"images/backred.gif\") repeat-x 100% 100%#fee;border-color:#600}.default #pdsamples li div a{color:#009}.default #pdsamples li p a{color:#900}",
                    scoffee: "html .coffee,body.coffee{background:#dcb;color:#321}.coffee a{color:#900}.coffee button{background:#654;border-color:#321;box-shadow:0 .1em .2em rgba(32,0,0,0.75);color:#fed}.coffee button:hover,.coffee button:active{background:#fed;color:#654}.coffee #update,.coffee #title_text{background:#fff8ee;border-color:#600;box-shadow:0 .15em .3em rgba(32,0,0,0.5);color:#321}.coffee #introduction h2{color:#f00}.coffee h1 svg{border-color:#600;box-shadow:0 .2em .4em rgba(0,0,0,0.5)}.coffee h2,.coffee h3{border-color:#600}.coffee fieldset{background:#dcb;border-color:#654}.coffee legend{background:#fed;border-color:#654}.coffee .box{background:#ccc;border-color:#654;box-shadow:0 .4em .8em rgba(64,0,0,0.75)}.coffee .box button{border-color:#600;box-shadow:0 .1em .2em rgba(64,0,0,0.5);color:#600}.coffee .box button.minimize:hover,.coffee .box button.resize:hover,.coffee .box button.save:hover,.coffee .box button.maximize:hover{background:#654;color:#fed}.coffee .box button.resize{background:#c96}.coffee .box button.minimize{background:#eda}.coffee .box button.save{background:#db0}.coffee .box button.maximize{background:#dd8}.coffee .box h3.heading{background:#987;border-color:#600;color:#fed}.coffee .box h3.heading:hover{background:#654}.coffee .box .body{background:#fed;border-color:#654;box-shadow:0 .4em .8em rgba(64,0,0,0.75)}.coffee .options{background:#fed;border-color:#600;box-shadow:0 .4em .8em rgba(64,0,0,0.5)}.coffee .options h2{border-color:#600;box-shadow:0 .1em .2em rgba(64,0,0,0.75)}.coffee #Beautify h2,.coffee #Minify h2,.coffee #diffBase h2,.coffee #diffNew h2{border-color:#600;box-shadow:0 .1em .2em rgba(64,0,0,0.5)}.coffee #option_comment{border-color:#600;box-shadow:0 .1em .2em rgba(64,0,0,0.5);color:#600}.coffee #top em{color:#f00}.coffee .wide,.coffee .tall,.coffee #diffBase,.coffee #diffNew{background:#fed;border-color:#600;box-shadow:0 .2em .4em rgba(64,0,0,0.5)}.coffee .file input,.coffee .labeltext input{border-color:#600}#webtool.coffee input.unchecked{background:#cba;color:#000}.coffee .options input[type=text],.coffee .options select{border-color:#933}.coffee #beautyoutput,.coffee #minifyoutput{background:#dcb}.coffee #diffoutput p em,.coffee #diffoutput li em{color:#900}.coffee .analysis .bad{background-color:#eb9;color:#400}.coffee .analysis .good{background-color:#be9;color:#040}.coffee #doc .analysis thead th,.coffee #doc .analysis th[colspan]{background:#dcb}.coffee div input{border-color:#933}.coffee textarea{background:#fff8ee;border-color:#a66}.coffee textarea:hover{background:#fff}.coffee table.diff{border-color:#966}.coffee table.diff tbody th{background:#edc;border-color:#966;color:#633}.coffee table.diff thead{background:#cba;border-bottom-color:#966}.coffee table.diff thead th{border-left-color:#966}.coffee table.diff .empty{background-color:#ddd}.coffee table.diff .replace{background-color:#fda}.coffee table.diff .replace em{background-color:#ffd;border-color:#963;color:#630}.coffee table.diff .delete{background-color:#ebb}.coffee table.diff .delete em{background-color:#fee;border-color:#700;color:#600}.coffee table.diff .equal{background-color:#fff8ee}.coffee table.diff .skip{background-color:#eee;border-color:#966}.coffee table.diff .insert{background-color:#cec}.coffee table.diff .insert em{background-color:#efc;border-color:#070;color:#050}.coffee #doc table,#doc.coffee table,.coffee .box .body table{background:#fff8ee;border-color:#966}.coffee #doc strong,.coffee .box .body strong{color:#900}.coffee #doc em,.coffee .box .body em,.coffee .box .body #doc em{color:#262}.coffee table.diff th.author{background:#cba;border-top-color:#966}.coffee #diffoutput #thirdparties{background:#edc;border-color:#600}.coffee #doc div,#doc.coffee div{background:#edc;border-color:#966}.coffee #doc ol,#doc.coffee ol{background:#fff8ee;border-color:#966}.coffee #doc div div,#doc.coffee div div{background:#fff;border-color:#966}.coffee #doc th,#doc.coffee th{background:#eed;border-left-color:#966;border-top-color:#966}.coffee #doc tr:hover,#doc.coffee tr:hover{background:#fed}.coffee #doc div:hover,#doc.coffee div:hover{background:#dcb}.coffee #doc div div:hover,#doc.coffee div div:hover,#doc.coffee div ol:hover{background:#dcb}.coffee #pdsamples li{background:#fed;border-color:#600}.coffee #pdsamples li div{background:#dcb;border-color:#654}.coffee #pdsamples li div a{color:#900}.coffee #pdsamples li p a{color:#900}",
                    sdark: "html .dark,body.dark{background:#333;color:#eee}.dark a{color:#9cf}.dark button{background:#9cf;border-color:#036;box-shadow:0 .1em .2em rgba(224,224,255,0.75);color:#036}.dark button:hover,.dark button:active{background:#def}.dark #update,.dark #title_text{background:#def;border-color:#036;box-shadow:0 .1em .2em rgba(224,224,255,0.75);color:#036}.dark h1 svg{border-color:#00c;box-shadow:0 .1em .2em rgba(224,224,255,0.75)}.dark h2,.dark h3{background:#def;border-color:#006;color:#036}.dark fieldset{background:#246;border-color:#036}.dark legend{background:#def;border-color:#036;color:#036}.dark .box{background:#666;border-color:#abc}.dark .box button{border-color:#036;box-shadow:0 0 0 rgba(0,0,0,0);color:#036}.dark .box button.minimize:hover,.dark .box button.resize:hover,.dark .box button.save:hover,.dark .box button.maximize:hover{background:#def}.dark .box button.resize{background:#9cf}.dark .box button.save{background:#7ad}.dark .box button.minimize{background:#9cf}.dark .box button.maximize{background:#bef}.dark .box h3.heading{background:#8ad;border-color:#036;color:#036}.dark .box h3.heading:hover{background:#def}.dark .box .body{background:#abc;border-color:#036;box-shadow:0 0 0 rgba(0,0,0,0);color:#000}.dark .options{background:#024;border-color:#89a;box-shadow:0 .4em .8em rgba(224,224,255,0.5);color:#fff}.dark #Beautify h2,.dark #Minify h2,.dark #diffBase h2,.dark #diffNew h2,.dark .options h2{box-shadow:0 .1em .2em rgba(224,224,255,0.75)}.dark #option_comment{background:#bcd;border-color:#036;color:#036}.dark #top em{color:#f00}.dark .wide,.dark .tall,.dark #diffBase,.dark #diffNew{background:#024;border-color:#89a;box-shadow:0 .1em .2em rgba(224,224,255,0.5)}.dark .file input,.dark .labeltext input{border-color:#036}#webtool.dark input.unchecked{background:#ccc;color:#444}.dark .options input[type=text],.dark .options select{background:#bcd;border-color:#036}.dark #beautyoutput,.dark #minifyoutput{background:#ccc}.dark #diffoutput p em,.dark #diffoutput li em{color:#050}.dark .analysis .bad{background-color:#e99;color:#400}.dark .analysis .good{background-color:#be9;color:#040}.dark #doc .analysis thead th,.dark #doc .analysis th[colspan]{background:#8ac}.dark div input{border-color:#933}.dark textarea{background:#bcd;border-color:#036}.dark textarea:hover{background:#cdf}.dark table.diff{border-color:#036}.dark table.diff tbody th{background:#369;border-color:#036;color:#def}.dark table.diff tbody td{border-color:#036}.dark table.diff thead{background:#036;border-bottom-color:#036;color:#def}.dark table.diff thead th{border-left-color:#abc}.dark table.diff .empty{background-color:#456}.dark table.diff .replace{background-color:#468;color:#def}.dark table.diff .replace em{background-color:#dff;border-color:#036;color:#036}.dark table.diff .delete{background-color:#600;color:#fbb}.dark table.diff .delete em{background-color:#fbb;border-color:#600;color:#600}.dark table.diff .equal{background-color:#024;color:#def}.dark table.diff .skip{background-color:#333;border-color:#036}.dark table.diff .insert{background-color:#696;color:#dfd}.dark table.diff .insert em{background-color:#efc;border-color:#060;color:#050}.dark #doc table,.dark .box .body table{background:#024;border-color:#036;color:#def}.dark #doc strong,.dark .box .body strong{color:#900}.dark #doc em,.dark .box .body em,.dark .box .body #doc em{color:#360}.dark table.diff th.author{background:#036;border-bottom-color:#036;color:#def}.dark #diffoutput #thirdparties{background:#024;border-color:#369}.dark #diffoutput #thirdparties a{color:#00f}.dark #doc div,#doc.dark div{background:#246;border-color:#036}.dark #doc ol,#doc.dark ol{background:#024;border-color:#036}.dark #doc div div,#doc.dark div div{background:#024;border-color:#036}.dark #doc table,#doc.dark table{background:#024;border-color:#036}.dark #doc th,#doc.dark th{background:#468;border-left-color:#036;border-top-color:#036}.dark #doc tr:hover,#doc.dark tr:hover{background:#468}.dark #doc td,#doc.dark td{border-color:#036}.dark #doc div:hover,#doc.dark div:hover{background:#468}.dark #doc div div:hover,#doc.dark div div:hover,#doc.dark div ol:hover{background:#246}.dark #pdsamples li{background:#024;border-color:#89a}.dark #pdsamples li div{background:#444;border-color:#222}.dark #pdsamples li div a{color:#9cf}.dark #pdsamples li p a{color:#ccc}",
                    scanvas: "html .canvas,body.canvas{background:#e8e8e8;color:#666}.canvas a{color:#450}.canvas button{background:#d8d8cf;border-color:#664;box-shadow:0 .1em .2em rgba(128,128,92,0.75);color:#664;text-shadow:.1em .1em .1em #999}.canvas button:hover,.canvas button:active{background:#ffe}.canvas #update,.canvas #title_text{background:#f8f8ee;box-shadow:0 .1em .2em rgba(128,128,92,0.75);color:#464}.canvas h1 svg{border-color:#664;box-shadow:0 .1em .2em rgba(128,128,92,0.75)}.canvas h2,.canvas h3{background:#f8f8ef;border-color:#664;box-shadow:0 .1em .2em rgba(128,128,92,0.75);text-shadow:none}.canvas .wide,.canvas .tall,.canvas #diffBase,.canvas #diffNew{background:#d8d8cf;border-color:#664;box-shadow:0 .2em .4em rgba(128,128,92,0.5);color:#444}.canvas .wide label,.canvas .tall label,.canvas #diffBase label,.canvas #diffNew label{text-shadow:.1em .1em .2em #666}.canvas .options{background:#d8d8cf;border-color:#664;box-shadow:0 .2em .4em rgba(128,128,92,0.5);color:#444;text-shadow:.1em .1em .2em #999}.canvas fieldset{background:#e8e8e8;border-color:#664}.canvas legend{background:#f8f8ef;border-color:#664}.canvas .box{background:#ccc;border-color:#664}.canvas .box .body{background:#e8e8e8;border-color:#664;box-shadow:0 .2em .4em rgba(128,128,92,0.75);color:#666}.canvas .box button{box-shadow:0 .1em .2em rgba(128,128,92,0.75)}.canvas .box button.resize{background:#cfcfd8;border-color:#446;color:#446}.canvas .box button.resize:hover{background:#bbf;border-color:#228;color:#228}.canvas .box button.save{background:#d8cfcf;border-color:#644;color:#644}.canvas .box button.save:hover{background:#fcc;border-color:#822;color:#822}.canvas .box button.minimize{background:#cfcfd8;border-color:#446;color:#446}.canvas .box button.minimize:hover{background:#bbf;border-color:#228;color:#228}.canvas .box button.maximize{background:#cfd8cf;border-color:#464;color:#464}.canvas .box button.maximize:hover{background:#cfc;border-color:#282;color:#282}.canvas .box h3.heading:hover{background:#d8d8cf}.canvas #option_comment{background:#e8e8e8;border-color:#664;color:#444}.canvas #top em{color:#fcc}#webtool.canvas input.unchecked{background:#ccc;color:#333}.canvas input,.canvas select{box-shadow:.1em .1em .2em #999}.canvas .file input,.canvas .labeltext input,.canvas .options input[type=text],.canvas .options select{background:#f8f8f8;border-color:#664}.canvas #beautyoutput,.canvas #minifyoutput{background:#ccc}.canvas #diffoutput p em,.canvas #diffoutput li em{color:#050}.canvas #doc .analysis thead th,.canvas #doc .analysis th[colspan]{background:#c8c8bf}.canvas textarea{background:#f8f8ef;border-color:#664}.canvas textarea:hover{background:#e8e8e8}.canvas table.diff{border-color:#664}.canvas table.diff tbody th{background:#c8c8bf;border-color:#664}.canvas table.diff tbody td{background:#f8f8ef;border-color:#664}.canvas table.diff thead{background:#c8c8bf;border-bottom-color:#664;color:#664}.canvas table.diff thead th{border-left-color:#664}.canvas .analysis .bad{background-color:#ecb;color:#744}.canvas .analysis .good{background-color:#cdb;color:#474}.canvas table.diff .empty{background-color:#ccc}.canvas table.diff .replace{background-color:#dda;color:#660}.canvas table.diff .replace em{background-color:#ffd;border-color:#664;color:#880}.canvas table.diff .delete{background-color:#da9;color:#600}.canvas table.diff .delete em{background-color:#fbc;border-color:#600;color:#933}.canvas table.diff .equal{background-color:#f8f8ef;color:#666}.canvas table.diff .skip{background-color:#eee;border-color:#664}.canvas table.diff .insert{background-color:#bd9;color:#040}.canvas table.diff .insert em{background-color:#efc;border-color:#060;color:#464}.canvas table.diff th.author{background:#f8f8ef;border-bottom-color:#664;color:#666}.canvas #doc table,.canvas .box .body table{background:#f8f8ef;border-color:#664;color:#666}.canvas #doc strong,.canvas .box .body strong{color:#933}.canvas #doc em,.canvas .box .body em,.canvas .box .body #doc em{color:#472}.canvas #diffoutput #thirdparties{background:#c8c8bf;border-color:#664}.canvas #diffoutput #thirdparties a{color:#664}#doc.canvas{color:#444}.canvas #doc div,#doc.canvas div{background:#c8c8bf;border-color:#664}.canvas #doc ol,#doc.canvas ol{background:#e8e8e8;border-color:#664}.canvas #doc div div,#doc.canvas div div{background:#e8e8e8;border-color:#664}.canvas #doc table,#doc.canvas table{background:#f8f8ef;border-color:#664}.canvas #doc th,#doc.canvas th{background:#c8c8bf;border-left-color:#664;border-top-color:#664}.canvas #doc tr:hover,#doc.canvas tr:hover{background:#c8c8bf}.canvas #doc td,#doc.canvas td{border-color:#664}.canvas #doc div:hover,#doc.canvas div:hover{background:#d8d8cf}.canvas #doc div div:hover,#doc.canvas div div:hover,#doc.canvas div ol:hover{background:#f8f8ef}.canvas #pdsamples li{background:#d8d8cf;border-color:#664}.canvas #pdsamples li div{background:#e8e8e8;border-color:#664}.canvas #pdsamples li div a{color:#664}.canvas #pdsamples li p a{color:#450}",
                    sshadow: "html .shadow,body.shadow{background:#222;color:#eee}.shadow a{color:#9cf}.shadow button{background:#456;border-color:#789;box-shadow:0 .2em .4em rgba(0,0,0,1);color:#cde;text-shadow:.1em .1em .1em #000}.shadow button:hover,.shadow button:active{background:#ddd;color:#333;text-shadow:.1em .1em .1em rgba(0,0,0,.5)}.shadow #update,.shadow #title_text{background:#ddd;border-color:#000;color:#222}.shadow h1 svg{border-color:#999;box-shadow:.2em .2em .4em #000}.shadow h2,.shadow h3{background:#eee;border-color:#333;box-shadow:0 .1em .2em rgba(0,0,0,0.75);color:#222;text-shadow:none}.shadow .wide,.shadow .tall,.shadow #diffBase,.shadow #diffNew{background:#666;border-color:#999;color:#ddd}.shadow .wide label,.shadow .tall label,.shadow #diffBase label,.shadow #diffNew label{text-shadow:.1em .1em .2em #000}.shadow textarea{background:#333;border-color:#000;color:#ddd}.shadow textarea:hover{background:#000}.shadow .options{background:#666;border-color:#999;color:#ddd;text-shadow:.1em .1em .2em #000}.shadow fieldset{background:#333;border-color:#999}.shadow legend{background:#eee;border-color:#333;box-shadow:0 .1em .2em rgba(0,0,0,0.75);color:#222;text-shadow:none}.shadow .box{background:#000;border-color:#999;box-shadow:.6em .6em .8em rgba(0,0,0,.75)}.shadow .box .body{background:#333;border-color:#999;color:#ddd}.shadow .box h3{background:#ccc;border-color:#000;box-shadow:.2em .2em .8em #000}.shadow .box button{box-shadow:0 .1em .2em rgba(0,0,0,0.75);text-shadow:.1em .1em .1em rgba(0,0,0,.5)}.shadow .box button.resize{background:#bbf;border-color:#446;color:#446}.shadow .box button.resize:hover{background:#ddf;border-color:#228;color:#228}.shadow .box button.save{background:#d99;border-color:#300;color:#300}.shadow .box button.save:hover{background:#fcc;border-color:#822;color:#822}.shadow .box button.minimize{background:#bbf;border-color:#006;color:#006}.shadow .box button.minimize:hover{background:#eef;border-color:#228;color:#228}.shadow .box button.maximize{background:#9c9;border-color:#030;color:#030}.shadow .box button.maximize:hover{background:#cfc;border-color:#060;color:#060}.shadow .box h3.heading:hover{background:#222;border-color:#ddd;color:#ddd}.shadow #option_comment{background:#333;border-color:#999;color:#ddd}.shadow #option_comment,.shadow input,.shadow select{box-shadow:.1em .1em .2em #000}.shadow input[disabled]{box-shadow:none}.shadow #top em{color:#684}#webtool.shadow input.unchecked{background:#666;color:#ddd}.shadow .file input,.shadow .labeltext input,.shadow .options input[type=text],.shadow .options select{background:#333;border-color:#999;color:#ddd}.shadow .options fieldset span input[type=text]{background:#222;border-color:#333}.shadow #beautyoutput,.shadow #minifyoutput{background:#555;color:#eee}.shadow table.diff tbody th{background:#bbb;border-color:#999;color:#333}.shadow #doc .analysis th[colspan],.shadow table.diff thead,.shadow table.diff thead th,.shadow #doc .analysis thead th{background:#555;border-color:#999;color:#ddd}.shadow table.diff tbody td{background:#666;border-color:#999;color:#ddd}.shadow .analysis .bad{background-color:#400;color:#c66}.shadow .analysis .good{background-color:#040;color:#6a6}.shadow table.diff .empty{background-color:#999}.shadow table.diff .replace{background-color:#664;color:#bb8}.shadow table.diff .replace em{background-color:#440;border-color:#220;color:#cc9}.shadow table.diff .delete{background-color:#300;color:#c66}.shadow table.diff .delete em{background-color:#700;border-color:#c66;color:#f99}.shadow table.diff .equal{background-color:#333;color:#ddd}.shadow table.diff .skip{background-color:#000;border-color:#999}.shadow table.diff .insert{background-color:#040;color:#6c6}.shadow table.diff .insert em{background-color:#363;border-color:#6c0;color:#cfc}.shadow table.diff th.author{background:#555;border-bottom-color:#999;color:#ddd}.shadow table td{border-color:#999}.shadow table.diff,.shadow #doc table,.shadow .box .body table{background:#333;border-color:#999;color:#ddd}.shadow #doc strong,.shadow .box .body strong{color:#b33}.shadow #doc em,.shadow .box .body em,.shadow .box .body #doc em,.shadow #diffoutput p em,.shadow #diffoutput li em{color:#684}.shadow #diffoutput #thirdparties{background:#666;border-color:#999}.shadow #diffoutput #thirdparties a{box-shadow:0 .2em .4em rgba(0,0,0,1);color:#000}#doc.shadow{color:#ddd}#doc.shadow h3 a{color:#00c}.shadow #doc div,#doc.shadow div{background:#666;border-color:#999}.shadow #doc ol,#doc.shadow ol{background:#333;border-color:#999}.shadow #doc div div,#doc.shadow div div{background:#333;border-color:#999}.shadow #doc table,#doc.shadow table{background:#333;border-color:#999}.shadow #doc th,#doc.shadow th{background:#bbb;border-left-color:#999;border-top-color:#999;color:#333}.shadow #doc tr:hover,#doc.shadow tr:hover{background:#555}.shadow #doc div:hover,#doc.shadow div:hover{background:#777}.shadow #doc div div:hover,#doc.shadow div div:hover,#doc.shadow div ol:hover{background:#444}.shadow #textreport{background:#222}.shadow #pdsamples li{background:#666;border-color:#999}.shadow #pdsamples li div{background:#333;border-color:#999}.shadow #pdsamples li div a{color:#789}.shadow #pdsamples li p a{color:#9cf}",
                    swhite: "html .white,body.white{color:#333}body.white button{background:#eee;border-color:#222;box-shadow:0 .1em .2em rgba(64,64,64,0.75);color:#666;text-shadow:.1em .1em .1em #999}.white button:hover,.white button:active{background:#999;color:#eee;text-shadow:.1em .1em .1em #000}.white a{color:#009}.white #title_text{background:#eee;border-color:#333;box-shadow:0 .15em .3em rgba(0,0,0,0.5);color:#333}.white #introduction h2{border-color:#333;color:#333}.white h1 svg{background:#eee;border-color:#333;box-shadow:0 .2em .4em rgba(0,0,0,0.5)}.white h2,.white h3{border-color:#333}.white fieldset{background:#ddd;border-color:#333}.white legend{background:#fff;border-color:#333;color:#333;text-shadow:none}.white .box{background:#666;border-color:#333;box-shadow:0 .4em .8em rgba(64,64,64,0.75)}.white .box button{box-shadow:0 .1em .2em rgba(0,0,0,0.75);text-shadow:.1em .1em .1em rgba(0,0,0,.5)}.white .box button.resize{background:#bbf;border-color:#446;color:#446}.white .box button.resize:hover{background:#ddf;border-color:#228;color:#228}.white .box button.save{background:#d99;border-color:#300;color:#300}.white .box button.save:hover{background:#fcc;border-color:#822;color:#822}.white .box button.minimize{background:#bbf;border-color:#006;color:#006}.white .box button.minimize:hover{background:#eef;border-color:#228;color:#228}.white .box button.maximize{background:#9c9;border-color:#030;color:#030}.white .box button.maximize:hover{background:#cfc;border-color:#060;color:#060}.white .box h3.heading{background:#ddd;border-color:#222;box-shadow:.2em .2em .4em #666}.white .box h3.heading:hover{background:#333;color:#eee}.white .box .body{background:#eee;border-color:#222;box-shadow:0 0 .4em rgba(64,64,64,0.75)}.white .options{background:#eee;border-color:#333;box-shadow:0 .2em .4em rgba(64,64,64,0.5);text-shadow:.1em .1em .1em #999}.white .options h2,.white #Beautify h2,.white #Minify h2,.white #diffBase h2,.white #diffNew h2{background:#fff;border-color:#333;box-shadow:0 .1em .2em rgba(64,64,64,0.75);text-shadow:.1em .1em .1em #ccc}.white #option_comment{background:#ddd;border-color:#333}.white #top em{color:#00f}.white #update{background:#eee;border-color:#333;box-shadow:0 .1em .2em rgba(64,64,64,0.5)}.white .wide,.white .tall,.white #diffBase,.white #diffNew{background:#eee;border-color:#333;box-shadow:0 .2em .4em rgba(64,64,64,0.5)}.white .file input,.white .labeltext input{border-color:#fff}#webtool.white input.unchecked{background:#ccc;color:#666}.white .options input[type=text],.white .options select{border-color:#333}.white #beautyoutput,.white #minifyoutput{background:#ddd}.white #diffoutput p em,.white #diffoutput li em{color:#c00}.white .analysis .bad{background-color:#ebb;color:#400}.white .analysis .good{background-color:#cec;color:#040}.white #doc .analysis thead th,.white #doc .analysis th[colspan]{background:#eef}.white div input{border-color:#333}.white textarea{border-color:#333}.white textarea:hover{background:#eef8ff}.white table.diff{border-color:#333}.white table.diff tbody th{background:#eed;border-color:#bbc;color:#886}.white table.diff thead{background:#ddd;border-bottom-color:#333}.white table.diff thead th{border-left-color:#333}.white table.diff .empty{background-color:#ddd}.white table.diff .replace{background-color:#fea}.white table.diff .replace em{background-color:#ffd;border-color:#963;color:#630}.white table.diff .delete{background-color:#fbb}.white table.diff .delete em{background-color:#fdd;border-color:#700;color:#600}.white table.diff .equal{background-color:#fff}.white table.diff .skip{background-color:#efefef;border-color:#aaa #bbc #aaa #aaa}.white table.diff .insert{background-color:#bfb}.white table.diff .insert em{background-color:#efc;border-color:#070;color:#050}.white table.diff th.author{background:#efefef;border-top-color:#bbc}.white #doc table,.white .box .body table{background:#fff;border-color:#333}.white #doc strong,.white .box .body strong{color:#c00}.white .box .body em,.white .box .body #doc em{color:#090}.white #thirdparties img,.white #diffoutput #thirdparties{border-color:#333}.white #thirdparties img{box-shadow:.2em .2em .4em #999}.white #diffoutput #thirdparties{background:#eee}.white #doc div,#doc.white div{background:#ddd;border-color:#333}.white #doc ol,#doc.white ol{background:#eee;border-color:#333}.white #doc div div,#doc.white div div{background:#eee;border-color:#333}.white #doc table,#doc.white table{background:#fff;border-color:#333}.white #doc th,#doc.white th{background:#ddd;border-left-color:#333;border-top-color:#333}.white #doc tr:hover,#doc.white tr:hover{background:#ddd}.white #doc em,#doc.white em{color:#060}.white #doc div:hover,#doc.white div:hover{background:#ccc}.white #doc div div:hover,#doc.white div div:hover,#doc.white div ol:hover{background:#fff}.white #pdsamples li{background:#eee;border-color:#333}.white #pdsamples li div{background:#ddd;border-color:#333}.white #pdsamples li div a{color:#47a}.white #pdsamples li p a{color:#009}"
                },
                a = ["<?xml version='1.0' encoding='UTF-8' ?><!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'><html xmlns='http://www.w3.org/1999/xhtml' xml:lang='en'><head><title>Pretty Diff - The difference tool</title><meta name='robots' content='index, follow'/> <meta name='DC.title' content='Pretty Diff - The difference tool'/> <link rel='canonical' href='http://prettydiff.com/' type='application/xhtml+xml'/><meta http-equiv='Content-Type' content='application/xhtml+xml;charset=UTF-8'/><meta http-equiv='Content-Style-Type' content='text/css'/><style type='text/css'>"];
            if (result[0].indexOf("Error: ") === 0) {
                return [result[0], ""];
            }
            a.push(css.body);
            a.push(css["s" + options.color]);
            a.push("</style></head><body class='");
            a.push(options.color);
            a.push("'><h1><a href='http://prettydiff.com/'>Pretty Diff - The difference tool</a></h1><div id='doc'>");
            a.push(result[1]);
            a.push("</div>");
            if (options.mode === "diff") {
                a.push("<p>Accessibility note. &lt;em&gt; tags in the output represent character differences per lines compared.</p>");
                a.push(result[0]);
                a.push("</body></html>");
                return [a.join(""), ""];
            }
            a.push("</body></html>");
            return [result[0], a.join("")];
        },
        reportnames = function (x, y) {
            var a = "",
                b = 0,
                c = "",
                d = (options.mode === "diff") ? "-diff.html" : "-report.html";
            if (options.readmethod === "directory") {
                b = x.lastIndexOf(".");
                c = x.substring(b + 1).toUpperCase();
                x = x.substring(0, b);
                return y + slash + x + c + d;
            }
            a = options.output;
            b = a.lastIndexOf(".");
            c = a.substring(b + 1).toUpperCase();
            a = a.substring(0, b);
            return a + c + d;
        },
        error = (function () {
            var a = [];
            a.push("Arguments      - Type    - Definition");
            a.push("-------------------------------------");
            a.push("* source       - string  - The file source for interpretation. This is required.");
            a.push("* help         - string  - This list of argument definitions. The value is");
            a.push("                           unnecessary and is required only to pass in use of");
            a.push("                           the parameter.");
            a.push("");
            a.push("* mode         - string  - The operation to be performed. Defaults to 'diff'.");
            a.push("                 Accepted values: diff, beautify, minify.");
            a.push("");
            a.push("* diff         - string  - The file to be compared to the source file. This is");
            a.push("                           required if mode is 'diff'.");
            a.push("");
            a.push("* output       - string  - The file to store the output. If this argument is");
            a.push("                           absent the output will appear on the command line.");
            a.push("                           If the file specified does not exist it will be");
            a.push("                           created.");
            a.push("");
            a.push("* lang         - string  - The programming language of the source file.");
            a.push("                           Defaults to auto.");
            a.push("                 Accepted values: auto, markup, javascript, css, html, csv, text");
            a.push("* context      - number  - This shortens the diff output by allowing a");
            a.push("                           specified number of equivalent lines between each");
            a.push("                           line of difference. Defaults to an empty string,");
            a.push("                           which nullifies its use.");
            a.push("");
            a.push("* sourcelabel  - string  - This allows for a descriptive label of the source");
            a.push("                           file code of the diff HTML output. Defaults to 'base'");
            a.push("* difflabel    - string  - This allows for a descriptive label for the diff");
            a.push("                           file code of the diff HTML output. Defaults to new'.");
            a.push("");
            a.push("* diffview     - string  - This determines whether the diff HTML output should");
            a.push("                           display as a side-by-side comparison or if the");
            a.push("                           differences should display in a single table column.");
            a.push("                           Defaults to 'sidebyside'.");
            a.push("                 Accepted values: sidebyside, inline");
            a.push("");
            a.push("* topcoms      - boolean - If mode is 'minify' this determines whether comments");
            a.push("                           above the first line of code should be kept. Default");
            a.push("                           is false.");
            a.push("");
            a.push("* csvchar      - string  - The character to be used as a separator if lang is");
            a.push("                           'csv'. Any string combination is accepted. Defaults");
            a.push("                           to a comma ','.");
            a.push("");
            a.push("* insize       - number  - The number of characters to comprise a single");
            a.push("                           indentation. Defaults to '4'.");
            a.push("");
            a.push("* inchar       - string  - The string characters to comprise a single");
            a.push("                           indentation. Any string combination is accepted.");
            a.push("                           Defaults to space ' '.");
            a.push("");
            a.push("* indent       - string  - If lang is 'javascript' and mode is 'beautify' this");
            a.push("                           determines if opening curly braces will exist on the");
            a.push("                           same line as their condition or be forced onto a new");
            a.push("                           line. Defaults to 'knr'.");
            a.push("                 Accepted values: knr, allman");
            a.push("");
            a.push("* quote        - boolean - If true and mode is 'diff' then all single quote");
            a.push("                           characters will be replaced by double quote");
            a.push("                           characters in both the source and diff file input so");
            a.push("                           as to eliminate some differences from the diff");
            a.push("                           report HTML output.");
            a.push("");
            a.push("* semicolon    - boolean - If true and mode is 'diff' and lang is 'javascript'");
            a.push("                           all semicolon characters that immediately preceed");
            a.push("                           any white space containing a new line character will");
            a.push("                           be removed so as to elimate some differences from");
            a.push("                           the diff report HTML output.");
            a.push("");
            a.push("* comments     - string  - If mode is 'beautify' this will determine whether");
            a.push("                           comments should always start at position 0 of each");
            a.push("                           line or if comments should be indented according to");
            a.push("                           sthe code. Default is 'indent'.");
            a.push("                 Accepted values: indent, noindent");
            a.push("");
            a.push("* style        - string  - If mode is 'beautify' and lang is 'markup' or 'html'");
            a.push("                           this will determine whether the contents of script");
            a.push("                           and style tags should always start at position 0 of");
            a.push("                           each line or if such content should be indented");
            a.push("                           starting from the opening script or style tag.");
            a.push("                           Default is 'indent'.");
            a.push("                 Accepted values: indent, noindent");
            a.push("");
            a.push("* html         - boolean - If lang is 'markup' this will provide an override so");
            a.push("                           that some tags are treated as singletons and not");
            a.push("                           start tags, such as '<br>' opposed to '<br/>'.");
            a.push("");
            a.push("* content      - boolean - If true and mode is 'diff' this will normalize all");
            a.push("                           string literals in JavaScript to 'text' and all");
            a.push("                           content in markup to 'text' so as to eliminate some");
            a.push("                           differences from the HTML diff report. Default is");
            a.push("                           false.");
            a.push("");
            a.push("* force_indent - boolean - If lang is 'markup' this will force indentation upon");
            a.push("                           all content and tags without regard for the creation");
            a.push("                           of new text nodes. Default is false.");
            a.push("");
            a.push("* conditional  - boolean - If true then conditional comments used by Internet");
            a.push("                           Explorer are preserved at minification of markup.");
            a.push("                           Default is false.");
            a.push("");
            a.push("* diffcomments - boolean - If true then comments will be preserved so that both");
            a.push("                           code and comments are compared by the diff engine.");
            a.push("");
            a.push("* output       - string  - The location of the output file. If the file does");
            a.push("                           not exist it will be created. If this argument is");
            a.push("                           missing output will print to screen.");
            a.push("");
            a.push("* color        - string  - The color scheme of the reports. Default is shadow.");
            a.push("                 Accepted values: default, coffee, dark, canvas, shadow, white");
            a.push("");
            a.push("* readmethod   - string  - The readmethod determines if operating with IO from");
            a.push("                           command line or IO from files.  Default value is");
            a.push("                           'screen':");
            a.push("                           * screen - reads from screen and outputs to screen");
            a.push("                           * file - reads a file and outputs to a file");
            a.push("                               - file requires use of option 'output'");
            a.push("                           * filescreen - reads a file and writes to screen");
            a.push("                           * directory - process all files in a directory");
            a.push("                               - directory requires use of option 'output'");
            a.push("                 Accepted values: screen, file, directory");
            a.push("");
            a.push("* output       - string  - The path of the directory, if readmethod is value");
            a.push("                           'directory', or path and name of the file to write");
            a.push("                           the output.  If the directory path or file exists it");
            a.push("                           will be over written else it will be created.");
            a.push("* report       - boolean - Determines whether a report file should be created.");
            a.push("                           The default value is true.  If false reports will be");
            a.push("                           suppressed for 'beautify' and 'minify' modes if");
            a.push("                           readmethod is 'file' or 'directory'.");
            a.push("");
            return a.join("\n");
        }());
    if (args === 0) {
        return console.log(error);
    }
    if (options.source === "") {
        return console.log("Error: 'source' argument is empty");
    }
    if (options.mode === "diff") {
        if (options.diff === "") {
            return console.log("Error: 'diff' argument is empty");
        }
        options.report = true;
    }
    if (options.readmethod === "file" && options.output === "") {
        return console.log("Error: 'readmethod' is value 'file' and argument 'output' is empty");
    }
    if (options.readmethod === "screen") {
        report = prettydiff.api(options);
        return console.log(report[0]);
    }
    if (options.readmethod === "filescreen") {
        options.source = fs.readFileSync(options.source, "utf8");
        if (options.mode === "diff") {
            options.diff = fs.readFileSync(options.diff, "utf8");
        }
        report = reports();
        return console.log(report[0]);
    }
    if (options.readmethod === "file") {
        options.source = fs.readFileSync(options.source, "utf8");
        if (options.mode === "diff") {
            options.diff = fs.readFileSync(options.diff, "utf8");
        }
        report = reports();
        reportname = reportnames();
        if (report[0].indexOf("Error: ") === 0) {
            return console.log(report[0]);
        }
        if (options.mode !== "diff") {
            fs.writeFile(options.output, report[0], function (err) {
                if (err) {
                    console.log("\nError writing code output.\n");
                    return console.log(err);
                }
                console.log("\nCode successfully written to file.");
            });
            if (options.report === true) {
                return fs.writeFile(reportname, report[1], function (err) {
                    if (err) {
                        console.log("\nError writing report output.\n");
                        return console.log(err);
                    }
                    console.log("\nReport successfully written to file.");
                });
            }
        }
        fs.writeFile(reportname, report[0], function (err) {
            if (err) {
                console.log("\nError writing report output.\n");
                return console.log(err);
            }
            console.log("\nReport successfully written to file.");
        });
    }
    if (options.readmethod === "directory") {
        sources = fs.readdirSync(options.source);
        if (options.mode === "diff") {
            diffs = fs.readdirSync(options.diff);
            (function () {
                var a = Math.min(sources.length, diffs.length),
                    b = 0;
                for (b = 0; b < a; b += 1) {
                    if (sources[b] !== diffs[b]) {
                        if (sources[b] > diffs[b]) {
                            diffs.splice(b, 1);
                        } else {
                            sources.splice(b, 1);
                        }
                        b -= 1;
                    }
                }
            }());
            return (function () {
                var a = sources.length,
                    b = 0,
                    c = options.source,
                    d = options.diff,
                    e = options.output,
                    f = fs.existsSync(e),
                    g = 0,
                    h = (a > 0) ? "s" : "";
                if (f === false) {
                    fs.mkdirSync(e);
                }
                for (b = 0; b < a; b += 1) {
                    options.source = fs.readFileSync(c + slash + sources[b], "utf8");
                    options.diff = fs.readFileSync(d + slash + diffs[b], "utf8");
                    g += options.source.length;
                    g += options.diff.length;
                    report = reports();
                    reportname = reportnames(sources[b], e);
                    fs.writeFileSync(reportname, report[0], "utf8");
                }
                console.log("\n\nOperation complete. " + a + " comparison" + h + " performed at a total character size of " + g + ".");
            }());
        }
        (function () {
            var a = sources.length,
                b = 0,
                c = options.source,
                d = options.output,
                e = fs.existsSync(d),
                f = 0,
                g = /\.txt/i,
                h = (a > 0) ? "s" : "",
                i = a;
            if (e === false) {
                fs.mkdirSync(d);
            }
            for (b = 0; b < a; b += 1) {
                options.output = d + slash + sources[b];
                options.source = fs.readFileSync(c + slash + sources[b], "utf8");
                if (g.test(source[b]) === true) {
                    i -= 1;
                    fs.writeFileSync(options.output, options.source, "utf8");
                } else {
                    f += options.source.length;
                    report = reports();
                    reportname = reportnames(sources[b], d);
                    fs.writeFileSync(options.output, report[0], "utf8");
                    if (options.report === true) {
                        fs.writeFileSync(reportname, report[1], "utf8");
                    }
                }
            }
            console.log("\n\nOperation complete. " + a + " file" + h + " processed at a total character size of " + f + ".");
        }());
    }
}());