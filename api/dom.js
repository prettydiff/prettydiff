/*prettydiff.com api.topcoms: true*/
/*jslint nomen: true */
/*global edition, document, localStorage, window, prettydiff, markup_beauty, cleanCSS, jsmin, csvbeauty, csvmin, markupmin, jspretty, diffview, XMLHttpRequest, location, ActiveXObject, FileReader, navigator, setTimeout, codeMirror*/
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
var exports = "",
    _gaq    = [],
    pd      = {};

(function dom__init() {
    "use strict";

    if (typeof prettydiff === "function") {
        pd.application = prettydiff;
    }

    //test for web browser features for progressive enhancement
    pd.test               = {
        //test for localStorage and assign the result of the test
        ls      : (typeof localStorage === "object" && localStorage !== null && typeof localStorage.getItem === "function" && typeof localStorage.hasOwnProperty === "function") ? true : false,
        //check for native JSON support
        json    : (JSON === undefined) ? false : true,
        //test for support of the file api
        fs      : (typeof FileReader === "function" && typeof new FileReader().readAsText === "function") ? true : false,
        //check of native AJAX support
        xhr     : (typeof XMLHttpRequest === "function" || typeof XMLHttpRequest === "object" || typeof ActiveXObject === "function"),
        //get the lowercase useragent string
        agent   : (typeof navigator === "object") ? navigator.userAgent.toLowerCase() : "",
        //some operations should not occur as the page is initially loading
        load    : true,
        //stores keypress state to avoid execution of pd.recycle from certain key combinations
        keypress: false,
        //supplement to ensure keypress is returned to false only after other keys other than ctrl are released
        keystore: [],
        //CodeMirror will only render correctly if the parent container is visible, this test solves for this problem
        render  : {
            diff: false,
            beau: false,
            minn: false
        },
        //If the output is too large the report must open and minimize in a single step
        filled  : {
            beau: false,
            diff: false,
            minn: false,
            stat: false
        },
        //delect if CodeMirror is supported
        cm      : (location.href.toLowerCase().indexOf("codemirror=false") < 0 && (typeof codeMirror === "object" || typeof codeMirror === "function")) ? true : false
    };

    //global color property so that HTML generated reports know which
    //CSS theme to apply
    pd.color              = "white";

    //stores data for the comment string
    pd.commentString      = [];

    //statistical usage data
    pd.stat               = {
        visit : 0,
        usage : 0,
        fdate : "",
        avday : "1",
        diff  : 0,
        beau  : 0,
        minn  : 0,
        markup: 0,
        js    : 0,
        css   : 0,
        csv   : 0,
        text  : 0,
        pdate : "",
        large : 0
    };

    //bounce allows the Google Analytics code to know that interaction
    //on the page is not a bounced visit
    pd.bounce             = true;

    //shorthand for document.getElementById method
    pd.$$                 = function dom__$$(x) {
        if (document.getElementById === undefined) {
            return;
        }
        return document.getElementById(x);
    };

    //shared DOM nodes
    pd.o                  = {
        addNo       : pd.$$("additional_no"),
        addOps      : pd.$$("addOptions"),
        addYes      : pd.$$("additional_yes"),
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
        displayTall : pd.$$("difftall"),
        displayWide : pd.$$("diffwide"),
        jsscope     : pd.$$("jsscope-yes"),
        lang        : pd.$$("language"),
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
            beau: {
                box: pd.$$("beaureport")
            },
            diff: {
                box: pd.$$("diffreport")
            },
            minn: {
                box: pd.$$("minnreport")
            },
            stat: {
                box: pd.$$("statreport")
            }
        },
        save        : pd.$$("diff-save")
    };
    pd.o.report.beau.body = (pd.o.report.beau.box === null) ? null : pd.o.report.beau.box.getElementsByTagName("div")[0];
    pd.o.report.diff.body = (pd.o.report.diff.box === null) ? null : pd.o.report.diff.box.getElementsByTagName("div")[0];
    pd.o.report.minn.body = (pd.o.report.minn.box === null) ? null : pd.o.report.minn.box.getElementsByTagName("div")[0];
    pd.o.report.stat.body = (pd.o.report.stat.box === null) ? null : pd.o.report.stat.box.getElementsByTagName("div")[0];

    //the various CSS color themes
    pd.css                = {
        core    : "body{font-family:\"Arial\";font-size:10px;overflow-y:scroll;}#samples #dcolorScheme{position:relative;z-index:1000}#apireturn textarea{font-size:1.2em;height:50em;width:100%}button{border-radius:.9em;display:block;font-weight:bold;width:100%}div .button{text-align:center}div button{display:inline-block;font-weight:bold;margin:1em 0;padding:1em 2em}button:hover{cursor:pointer}#introduction{clear:both;margin:0 0 0 5.6em;position:relative;top:-2.75em}#introduction ul{clear:both;height:3em;margin:0 0 0 -5.5em;overflow:hidden;width:100em}#introduction li{clear:none;display:block;float:left;font-size:1.4em;margin:0 4.95em -1em 0}#introduction li li{font-size:1em;margin-left:2em}#introduction .information,#webtool #introduction h2{left:-90em;position:absolute;top:0;width:10em}#introduction h2{float:none}#displayOps{float:right;font-size:1.5em;font-weight:bold;margin-right:1em;width:22.5em}#displayOps.default{position:static}#displayOps.maximized{margin-bottom:-2em;position:relative}#displayOps li{clear:none;display:block;float:left;list-style:none;margin:2em 0 0;text-align:right;width:9em}h1{float:left;font-size:2em;margin:0 .5em .5em 0}#hideOptions{margin-left:5em;padding:0}#title_text{border-style:solid;border-width:.05em;display:block;float:left;font-size:1em;margin-left:.55em;padding:.1em}h1 svg,h1 img{border-style:solid;border-width:.05em;float:left;height:2em;width:2em}h1 span{font-size:.5em}h2,h3{background:#fff;border-style:solid;border-width:.075em;display:inline-block;font-size:1.8em;font-weight:bold;margin:0 .5em .5em 0;padding:0 .2em}#doc h3{margin-top:.5em}h3{font-size:1.6em}h4{font-size:1.4em}fieldset{border-radius:.9em;clear:both;margin:3.5em 0 -2em;padding:0 0 0 1em}legend{border-style:solid;border-width:.1em;font-size:1.2em;font-weight:bold;margin-left:-.25em}.button{margin:1em 0;text-align:center}.button button{display:block;font-size:2em;height:1.5em;margin:0 auto;padding:0;width:50%}#diffreport{right:57.8em}#beaureport{right:38.8em}#minnreport{right:19.8em}#statreport{right:.8em}#statreport .body p,#statreport .body li,#statreport .body h3{font-size:1.2em}#statreport .body h3{margin-top:0}#statreport .body ul{margin-top:1em}#reports{height:4em}#reports h2{display:none}.box{border-style:solid;border-width:0;left:auto;margin:0;padding:0;position:absolute;z-index:10}.box button{border-radius:0;border-style:solid;border-width:.1em;display:block;float:right;font-family:'Lucida Console','Trebuchet MS','Arial';height:1.75em;padding:0;position:absolute;right:0;text-align:center;top:0;width:1.75em;z-index:7}.box button.resize{border-width:.05em;cursor:se-resize;font-size:1.667em;font-weight:normal;height:.8em;line-height:.5em;margin:-.85em 0 0;position:absolute;right:.05em;top:100%;width:.85em}.box button.minimize{margin:.35em 4em 0 0}.box button.maximize{margin:.35em 1.75em 0 0}.box button.save{margin:.35em 6.25em 0 0}.box .buttons{float:right;margin:0}.box h3.heading{cursor:pointer;float:left;font-size:1em;height:3em;margin:0 0 -3.2em;position:relative;width:17em;z-index:6}.box h3.heading span{display:block;font-size:1.8em;padding:.25em 0 0 .5em}.box .body{clear:both;height:20em;margin-top:-.1em;overflow:scroll;padding:4.25em 1em 1em;position:relative;right:0;top:0;width:75em;z-index:5}.options{border-radius:0 0 .9em .9em;clear:both;margin-bottom:1em;padding:1em 1em 3.5em;width:auto}label{display:inline;font-size:1.4em}ol li{font-size:1.4em;list-style-type:decimal}ol li li{font-size:1em}body#doc ol li{font-size:1.1em}ul{margin:-1.4em 0 2em;padding:0}ul li{list-style-type:none}li{clear:both;margin:1em 0 1em 3em}li h4{display:inline;float:left;margin:.4em 0;text-align:left;width:14em}p{clear:both;font-size:1.2em;margin:0 0 1em}#option_comment{height:2.5em;margin-bottom:-1.5em;width:100%}.difflabel{display:block;height:0}#beau-other-span,#diff-other-span{text-indent:-200em;width:0}.options p span{display:block;float:left;font-size:1.2em}#top{min-width:80em}#top em{font-weight:bold}#update{clear:left;float:right;font-weight:bold;padding:.5em;position:absolute;right:1em;top:11em}#announcement{height:2.5em;margin:0 -5em -4.75em;width:27.5em}#textreport{width:100%}#options{float:left;margin:0;width:19em}#options label{width:auto}#options p{clear:both;font-size:1em;margin:0;padding:0}#options p span{clear:both;float:none;height:2em;margin:0 0 0 2em}#csvchar{width:11.8em}#language,#csvchar,#colorScheme{margin:0 0 1em 2em}#codeInput{margin-left:22.5em}#Beautify.wide p,#Beautify.tall p.file,#Minify.wide p,#Minify.tall p.file{clear:none;float:none}#diffops p,#miniops p,#beauops p{clear:both;font-size:1em;padding-top:1em}#options p strong,#diffops p strong,#miniops p strong,#beauops p strong,#options .label,#diffops .label,#miniops .label,#beauops .label{display:block;float:left;font-size:1.2em;font-weight:bold;margin-bottom:1em;width:17.5em}input[type=\"radio\"]{margin:0 .25em}input[type=\"file\"]{box-shadow:none}select{border-style:inset;border-width:.1em;width:11.85em}.options input,.options label{border-style:none;display:block;float:left}.options span label{margin-left:.4em;white-space:nowrap;width:12em}.options p span label{font-size:1em}#webtool .options input[type=text]{margin-right:1em;width:11.6em}#webtool .options input[type=text],div input,textarea{border-style:inset;border-width:.1em}textarea{display:inline-block;height:10em;margin:0}strong label{font-size:1em;width:inherit}strong.new{background:#ff6;font-style:italic}#miniops span strong,#diffops span strong,#beauops span strong{display:inline;float:none;font-size:1em;width:auto}#Beautify .input label,#Beautify .output label,#Minify .input label,#Minify .output label{display:block;font-size:1.05em;font-weight:bold}#beautyinput,#minifyinput,#baseText,#newText,#beautyoutput,#minifyoutput{font-size:1em}.clear{clear:both;display:block}.wide,.tall,#diffBase,#diffNew{border-radius:0 0 .9em .9em;margin-bottom:1em}#diffBase,#diffNew{padding:1em}#diffBase p,#diffNew p{clear:none;float:none}#diffBase.wide textarea,#diffNew.wide textarea{height:10.1em}.wide,.tall{padding:1em 1.25em 0}#diff .addsource{cursor:pointer;margin-bottom:1em;padding:0}#diff .addsource input{display:block;float:left;margin:.5em .5em -1.5em}#diff .addsource label{cursor:pointer;display:inline-block;font-size:1.2em;padding:.5em .5em .5em 2em}.wide label{float:none;margin-right:0;width:100%}.wide #beautyinput,.wide #minifyinput,.wide #beautyoutput,.wide #minifyoutput{height:14.8em;margin:0;width:99.5%}.tall .input{clear:none;float:left}.tall .output{clear:none;float:right;margin-top:-2.4em}.tall .input,.tall .output{width:49%}.tall .output label{text-align:right}.tall .input textarea{height:31.7em}.tall .output textarea{height:34em}.tall textarea{margin:0 0 -.1em;width:100%}.wide{width:auto}#diffBase.difftall,#diffNew.difftall{margin-bottom:1.3em;padding:1em 1% .9em;width:47.5%}#diffBase.difftall{float:left}#diffNew.difftall{float:right}.file input,.labeltext input{display:inline-block;margin:0 .7em 0 0;width:16em}.labeltext,.file{font-size:.9em;font-weight:bold;margin-bottom:1em}.difftall textarea{height:30.6em;margin-bottom:.5em}#diffBase textarea,#diffNew textarea{width:99.5%}.input,.output{margin:0}#diffBase.wide,#diffNew.wide{padding:.8em 1em}#diffBase.wide{margin-bottom:1.2em}#diffoutput{width:100%}#diffoutput p em,#diffoutput li em,.analysis .bad,.analysis .good{font-weight:bold}#diffoutput ul{font-size:1.2em;margin-top:1em}#diffoutput ul li{display:list-item;list-style-type:disc}.analysis th{text-align:left}.analysis td{text-align:right}#doc ul{margin-top:1em}#doc ul li{font-size:1.2em}body#doc ul li{font-size:1.1em}#doc ol li span{display:block;margin-left:2em}.diff,.beautify{border-style:solid;border-width:.2em;display:inline-block;font-family:'Courier New',Courier,'Lucida Console',monospace;margin:0 1em 1em 0;padding:0;position:relative}.beautify .data em{display:inline-block;font-style:normal;font-weight:bold;padding-top:.5em}.diff .skip{border-style:none none solid;border-width:0 0 .1em}.diff li,.diff p,.diff h3,.beautify li{font-size:1.1em}.diff .diff-left,.diff .diff-right{display:table-cell}.diff .diff-left{border-style:none none none solid;border-width:0 0 0 .1em}.diff .diff-right{border-style:none none none solid;border-width:0 0 0 .1em;margin-left:-.1em;min-width:16.5em;right:0;top:0}.diff-right .data ol{min-width:16.5em}.diff-right .data{border-style:none solid none none;border-width:0 .1em 0 0;width:100%}.diff-right .data li{min-width:16.5em}.diff ol,.beautify ol{display:table-cell;margin:0;padding:0}.diff li,.beautify li{border-style:none none solid;border-width:0 0 .1em;display:block;line-height:1.2;list-style-type:none;margin:0;padding-bottom:0;padding-right:.5em}.diff li{padding-top:.5em}.beautify .count li{padding-top:.5em}@media screen and (-webkit-min-device-pixel-ratio:0) {.beautify .count li{padding-top:.546em}}#doc .beautify .count li.fold{color:#900;cursor:pointer;font-weight:bold;padding-left:.5em}.diff .count,.beautify .count{border-style:solid;border-width:0 .1em 0 0;font-weight:normal;padding:0;text-align:right}.diff .count li,.beautify .count li{padding-left:2em}.diff .data,.beautify .data{text-align:left;white-space:pre}.diff .data li,.beautify .data li{padding-left:.5em;white-space:pre}#webtool .diff h3{border-style:none solid solid;border-width:0 .1em .2em;box-shadow:none;display:block;font-family:Verdana;margin:0 0 0 -.1em;padding:.2em 2em;text-align:left}.diff li em{font-style:normal;margin:0 -.09em;padding:.05em 0}.diff p.author{border-style:solid;border-width:.2em .1em .1em;margin:0;overflow:hidden;padding:.4em;text-align:right}#dcolorScheme{float:right;margin:-2em 0 0 0}#dcolorScheme label{display:inline-block;font-size:1em;margin-right:1em}body#doc{font-size:.8em;max-width:80em}#doc th{font-weight:bold}#doc td span{display:block}#doc table,.box .body table{border-collapse:collapse;border-style:solid;border-width:.2em;clear:both}#doc table{font-size:1.2em}body#doc table{font-size:1em}#doc td,#doc th{border-left-style:solid;border-left-width:.1em;border-top-style:solid;border-top-width:.1em;padding:.5em}#doc em,.box .body em{font-style:normal;font-weight:bold}#doc div{margin-bottom:2em}#doc div div{clear:both;margin-bottom:1em}#doc h2{font-size:1.6em;margin:.5em .5em .5em 0}#doc ol{clear:both}#doc_contents li{font-size:1.75em;margin:1em 0 0}#doc_contents ol ol li{font-size:.75em;list-style:lower-alpha;margin:.5em 0 0}#doc_contents ol{padding-bottom:1em}#doc #doc_contents ol ol{background-color:inherit;border-style:none;margin:.25em .3em 0 0;padding-bottom:0}#doc_contents a{text-decoration:none}#diffoutput #thirdparties li{display:inline-block;list-style-type:none}#thirdparties a{border-style:none;display:block;height:4em;text-decoration:none}button,fieldset,.box h3.heading,.box .body,.options,.diff .replace em,.diff .delete em,.diff .insert em,.wide,.tall,#diffBase,#diffNew,#doc div,#doc div div,#doc ol,#option_comment,#update,#thirdparties img,#diffoutput #thirdparties{border-style:solid;border-width:.1em}#apitest p{clear:both;padding-top:.75em}#apitest label,#apitest select,#apitest input,#apitest textarea{float:left}#apitest label{width:20em}#apitest select,#apitest input,#apitest textarea{width:30em}#pdsamples{list-style-position:inside;margin:-12em 0 0 0;padding:0;position:relative;z-index:10}#pdsamples li{border-radius:1em;border-style:solid;border-width:.1em;margin:0 0 3em;padding:1em}#pdsamples li div{border-radius:1em;border-style:solid;border-width:.1em;margin:0;padding:1em}#pdsamples li p{display:inline-block;font-size:1em;margin:0}#pdsamples li p a{display:block;margin:0 0 1em 2em}#pdsamples li ul{margin:0 0 0 2em}#samples #pdsamples li li{background:none transparent;border-style:none;display:list-item;list-style:disc outside;margin:0;padding:.5em}#modalSave span{background:#000;display:block;left:0;opacity:.5;position:absolute;top:0;z-index:9000}#modalSave p{background:#eee;color:#333;font-size:3em;padding:1em;position:absolute;text-align:center;top:10em;width:25em;z-index:9001}#modalSave p em{display:block;font-size:.75em;margin-top:1em}#modalSave p strong{color:#c00;font-weight:bold}@media print{p,.options,#Beautify,#Minify,#diff,ul{display:none}div{width:100%}html td{font-size:.8em;white-space:normal}}",
        sdefault: "html body.default,body.default{background:url(\"images/body.gif\") repeat-x #a8b8c8;color:#000}body.default button{background:#dfd;border-color:#030;box-shadow:0 .1em .2em rgba(0,32,0,0.75);color:#030}.default a{color:#f00}.default button:hover{background:#f6fff6}.default button:active{background:#030;color:#dfd}.default #title_text{background:#fff;border-color:#000;box-shadow:0 .15em .3em rgba(0,0,0,0.5);color:#000}.default #introduction h2{border-color:#f00;color:#c00}.default h1 svg{border-color:#600;box-shadow:0 .2em .4em rgba(0,0,0,0.5)}.default h2,.default h3{border-color:#000}.default fieldset{border-color:#caa}.default legend{border-color:#fee;color:#966}.default .button button{background:url(\"images/green.png\") repeat-x 0 100%#dfd}.default .button button:hover{background:#f6fff6}.default .button button:active{background:#030;color:#efe}.default .box{background:#ccc;border-color:#006;box-shadow:0 .4em .8em rgba(0,0,64,0.75)}.default .box button{box-shadow:0 .1em .2em rgba(0,0,64,0.5)}.default .box button.resize{background:#ddf;border-color:#006;color:#006}.default .box button.minimize{background:#ddf;border-color:#006;color:#006}.default .box button.minimize:hover,.default .box button.resize:hover{background:#99f}.default .box button.save{background:#ddf;border-color:#006;color:#006}.default .box button.save:hover{background:#99f}.default .box h3.heading{background:#eef;border-color:#006}.default .box h3.heading:hover{background:#ccf}.default .box .body{background:#d8dde8;border-color:#006;box-shadow:0 0 .4em rgba(0,64,0,0.75)}.default .options{background:url(\"images/backred.gif\") #fee repeat-x 100% 100%;border-color:#600;box-shadow:0 .2em .4em rgba(64,0,0,0.5)}.default .options h2{border-color:#600;box-shadow:0 .1em .2em rgba(102,0,0,0.75)}.default #Beautify h2,.default #Minify h2,.default #diffBase h2,.default #diffNew h2{border-color:#006;box-shadow:0 .1em .2em rgba(0,0,64,0.5)}.default #option_comment{background:#fee;border-color:#600}.default #top em{color:#00f}.default #update{background:#fff;border-color:#000;box-shadow:0 .1em .2em rgba(0,0,0,0.5)}.default .wide,.default .tall,.default #diffBase,.default #diffNew{background:url(\"images/backblue.gif\") #eef repeat-x 100% 100%;border-color:#006;box-shadow:0 .2em .4em rgba(0,0,64,0.5)}.default .file input,.default .labeltext input{border-color:#006}#webtool.default input.unchecked{background:#eef8ff;color:#000}.default .options input[type=text],.default .options select{border-color:#933}.default #beautyoutput,.default #minifyoutput{background:#ddd}.default #diffoutput p em,.default #diffoutput li em{color:#c00}.default .analysis .bad{background-color:#e99;color:#400}.default .analysis .good{background-color:#9e9;color:#040}.default #doc .analysis thead th,.default #doc .analysis th[colspan]{background:#eef}.default div input{border-color:#933}.default textarea{border-color:#339}.default textarea:hover{background:#eef8ff}.default .diff,.default .diff-right,.default .diff-right .data,.default .diff-left{border-color:#669}.default .diff .count{background:#eed;border-color:#bbc;color:#664}.default .diff .count .empty{color:#eed}.default .diff .count li{background:#eed;border-color:#aa8;color:#886}.default .diff h3{background:#efefef;border-color:#669 #669 #bbc}.default .diff .empty{background-color:#ddd;border-color:#ccc}.default .diff .replace{background-color:#fd8;border-color:#cb6}#webtool.default .diff .replace em{background-color:#ffd;border-color:#963;color:#630}.default .diff .delete{background-color:#e99;border-color:#b88}#webtool.default .diff .delete em{background-color:#fdd;border-color:#700;color:#600}.default .diff .equal{background-color:#fff;border-color:#ddd}.default .diff .skip{background-color:#efefef;border-color:#ccc}.default .diff .insert{background-color:#9e9;border-color:#6c6}#webtool.default .diff .insert em{background-color:#efc;border-color:#070;color:#050}.default #doc table,.default .box .body table{background:#fff;border-color:#669}.default #doc strong,.default .box .body strong{color:#c00}.default .box .body em,.default .box .body #doc em{color:#090}.default .diff p.author{background:#efefef;border-color:#bbc #669 #669}.default #thirdparties img,.default #diffoutput #thirdparties{border-color:#687888}.default #diffoutput #thirdparties{background:#c8d8e8}.default #doc div,#doc.default div{background:#eef;border-color:#669}.default #doc ol,#doc.default ol{background:#fff;border-color:#669}.default #doc div div,#doc.default div div{background:#fff;border-color:#966}.default #doc table,#doc.default table{background:#fff;border-color:#669}.default #doc th,#doc.default th{background:#fed;border-left-color:#669;border-top-color:#669}.default #doc tr:hover,#doc.default tr:hover{background:#fed}#doc.default em{color:#060}.default #doc div:hover,#doc.default div:hover{background:#def}.default #doc div div:hover,#doc.default div div:hover,#doc.default div ol:hover{background:#fed}.default #pdsamples li{background:#eef;border-color:#006}.default #pdsamples li div{background:url(\"images/backred.gif\") repeat-x 100% 100%#fee;border-color:#600}.default #pdsamples li div a{color:#009}.default #pdsamples li p a{color:#900}",
        scanvas : "html .canvas,body.canvas{background:#e8e8e8;color:#666}.canvas a{color:#450}.canvas button{background:#d8d8cf;border-color:#664;box-shadow:0 .1em .2em rgba(128,128,92,0.75);color:#664;text-shadow:.05em .05em .1em #999}.canvas button:hover,.canvas button:active{background:#ffe}.canvas #update,.canvas #title_text{background:#f8f8ee;box-shadow:0 .1em .2em rgba(128,128,92,0.75);color:#464}.canvas h1 svg{border-color:#664;box-shadow:0 .1em .2em rgba(128,128,92,0.75)}.canvas h2,.canvas h3{background:#f8f8ef;border-color:#664;box-shadow:0 .1em .2em rgba(128,128,92,0.75);text-shadow:none}.canvas .wide,.canvas .tall,.canvas #diffBase,.canvas #diffNew{background:#d8d8cf;border-color:#664;box-shadow:0 .2em .4em rgba(128,128,92,0.5);color:#444}.canvas .wide label,.canvas .tall label,.canvas #diffBase label,.canvas #diffNew label{text-shadow:.05em .05em .1em #aaa}.canvas .options{background:#d8d8cf;border-color:#664;box-shadow:0 .2em .4em rgba(128,128,92,0.5);color:#444;text-shadow:.05em .05em .1em #999}.canvas fieldset{background:#e8e8e8;border-color:#664}.canvas legend{background:#f8f8ef;border-color:#664}.canvas .box{background:#ccc;border-color:#664}.canvas .box .body{background:#e8e8e8;border-color:#664;box-shadow:0 .2em .4em rgba(128,128,92,0.75);color:#666}.canvas .box button{box-shadow:0 .1em .2em rgba(128,128,92,0.75)}.canvas .box button.resize{background:#cfcfd8;border-color:#446;color:#446}.canvas .box button.resize:hover{background:#bbf;border-color:#228;color:#228}.canvas .box button.save{background:#d8cfcf;border-color:#644;color:#644}.canvas .box button.save:hover{background:#fcc;border-color:#822;color:#822}.canvas .box button.minimize{background:#cfcfd8;border-color:#446;color:#446}.canvas .box button.minimize:hover{background:#bbf;border-color:#228;color:#228}.canvas .box button.maximize{background:#cfd8cf;border-color:#464;color:#464}.canvas .box button.maximize:hover{background:#cfc;border-color:#282;color:#282}.canvas .box h3.heading:hover{background:#d8d8cf}.canvas #option_comment{background:#e8e8e8;border-color:#664;color:#444}.canvas #top em{color:#fcc}#webtool.canvas input.unchecked{background:#ccc;color:#333}.canvas input,.canvas select{box-shadow:.1em .1em .2em #999}.canvas .file input,.canvas .labeltext input,.canvas .options input[type=text],.canvas .options select{background:#f8f8f8;border-color:#664}.canvas #beautyoutput,.canvas #minifyoutput{background:#ccc}.canvas #diffoutput p em,.canvas #diffoutput li em{color:#050}.canvas #doc .analysis thead th,.canvas #doc .analysis th[colspan]{background:#c8c8bf}.canvas textarea{background:#f8f8ef;border-color:#664}.canvas textarea:hover{background:#e8e8e8}.canvas .diff,.canvas ol,.canvas .diff p.author,.canvas .diff h3,.canvas .diff-right,.canvas .diff-left{border-color:#664}.canvas .diff .count{background:#c8c8bf}.canvas .diff .count .empty{background:#c8c8bf;border-color:#664;color:#c8c8bf}.canvas .diff .data{background:#f8f8ef}.canvas .diff h3{background:#c8c8bf;color:#664}.canvas .analysis .bad{background-color:#ecb;color:#744}.canvas .analysis .good{background-color:#cdb;color:#474}.canvas .diff .empty{background-color:#ccc;border-color:#bbb}.canvas .diff .replace{background-color:#dda;border-color:#cc8;color:#660}#webtool.canvas .diff .replace em{background-color:#ffd;border-color:#664;color:#880}.canvas .diff .delete{background-color:#da9;border-color:#c87;color:#600}#webtool.canvas .diff .delete em{background-color:#fdc;border-color:#600;color:#933}.canvas .diff .equal{background-color:#f8f8ef;border-color:#ddd;color:#666}.canvas .diff .skip{background-color:#eee;border-color:#ccc}.canvas .diff .insert{background-color:#bd9;border-color:#9c7;color:#040}#webtool.canvas .diff .insert em{background-color:#efc;border-color:#060;color:#464}.canvas .diff p.author{background:#ddc;color:#666}.canvas #doc table,.canvas .box .body table{background:#f8f8ef;border-color:#664;color:#666}.canvas #doc strong,.canvas .box .body strong{color:#933}.canvas .box .body em,.canvas .box .body #doc em{color:#472}.canvas #diffoutput #thirdparties{background:#c8c8bf;border-color:#664}.canvas #diffoutput #thirdparties a{color:#664}#doc.canvas{color:#444}.canvas #doc div,#doc.canvas div{background:#c8c8bf;border-color:#664}.canvas #doc ol,#doc.canvas ol{background:#e8e8e8;border-color:#664}.canvas #doc div div,#doc.canvas div div{background:#e8e8e8;border-color:#664}.canvas #doc table,#doc.canvas table{background:#f8f8ef;border-color:#664}.canvas #doc th,#doc.canvas th{background:#c8c8bf;border-left-color:#664;border-top-color:#664}.canvas #doc tr:hover,#doc.canvas tr:hover{background:#c8c8bf}.canvas #doc td,#doc.canvas td{border-color:#664}.canvas #doc div:hover,#doc.canvas div:hover{background:#d8d8cf}.canvas #doc div div:hover,#doc.canvas div div:hover,#doc.canvas div ol:hover{background:#f8f8ef}.canvas #pdsamples li{background:#d8d8cf;border-color:#664}.canvas #pdsamples li div{background:#e8e8e8;border-color:#664}.canvas #pdsamples li div a{color:#664}.canvas #pdsamples li p a{color:#450}",
        sshadow : "html .shadow,body.shadow{background:#222;color:#eee}.shadow a{color:#f90}.shadow a:hover{color:#c30}.shadow button{background:#630;border-color:#600;box-shadow:0 .2em .4em rgba(0,0,0,1);color:#f90;text-shadow:.1em .1em .1em #000}.shadow button:hover,.shadow button:active{background:#300;border-color:#c00;color:#fc0;text-shadow:.1em .1em .1em rgba(0,0,0,.5)}.shadow #title_text{border-color:#222;color:#eee}.shadow #update{background:#ddd;border-color:#000;color:#222}.shadow h1 svg{border-color:#222;box-shadow:.2em .2em .4em #000}.shadow h2,.shadow h3{background-color:#666;border-color:#666;box-shadow:none;color:#ddd;padding-left:0;text-shadow:none}.shadow .wide,.shadow .tall,.shadow #diffBase,.shadow #diffNew{background:#666;border-color:#999;color:#ddd}.shadow .wide label,.shadow .tall label,.shadow #diffBase label,.shadow #diffNew label{text-shadow:.1em .1em .1em #333}.shadow textarea{background:#333;border-color:#000;color:#ddd}.shadow textarea:hover{background:#000}.shadow .options{background:#666;border-color:#999;color:#ddd;text-shadow:.1em .1em .2em #333}.shadow fieldset{background:#333;border-color:#999}.shadow legend{background:#eee;border-color:#333;box-shadow:0 .1em .2em rgba(0,0,0,0.75);color:#222;text-shadow:none}.shadow .box{background:#000;border-color:#999;box-shadow:.6em .6em .8em rgba(0,0,0,.75)}.shadow .box .body{background:#333;border-color:#999;color:#ddd}.shadow .box h3{background:#ccc;border-color:#333;box-shadow:.2em .2em .8em #000;color:#222}.shadow .box h3.heading:hover{background:#222;border-color:#ddd;color:#ddd}.shadow .box button{box-shadow:0 .1em .2em rgba(0,0,0,0.75);text-shadow:.1em .1em .1em rgba(0,0,0,.5)}.shadow .box button.resize{background:#bbf;border-color:#446;color:#446}.shadow .box button.resize:hover{background:#ddf;border-color:#228;color:#228}.shadow .box button.save{background:#d99;border-color:#300;color:#300}.shadow .box button.save:hover{background:#fcc;border-color:#822;color:#822}.shadow .box button.minimize{background:#bbf;border-color:#006;color:#006}.shadow .box button.minimize:hover{background:#eef;border-color:#228;color:#228}.shadow .box button.maximize{background:#9c9;border-color:#030;color:#030}.shadow .box button.maximize:hover{background:#cfc;border-color:#060;color:#060}.shadow #option_comment{background:#333;border-color:#999;color:#ddd}.shadow #option_comment,.shadow input,.shadow select{box-shadow:.1em .1em .2em #000}.shadow input[disabled]{box-shadow:none}.shadow #top em{color:#684}#webtool.shadow input.unchecked{background:#666;color:#ddd}.shadow .file input,.shadow .labeltext input,.shadow .options input[type=text],.shadow .options select{background:#333;border-color:#999;color:#ddd}.shadow .options fieldset span input[type=text]{background:#222;border-color:#333}.shadow #beautyoutput,.shadow #minifyoutput{background:#555;color:#eee}.shadow #doc .analysis th[colspan],.shadow .diff h3,.shadow #doc .analysis thead th{background:#555;border-color:#999;color:#ddd}.shadow .analysis .bad{background-color:#400;color:#c66}.shadow .analysis .good{background-color:#040;color:#6a6}.shadow .diff,.shadow .diff div,.shadow .diff p,.ahadow .diff ol,.shadow .diff li,.shadow .diff .count li,.shadow .diff-right .data{border-color:#999}.shadow .diff .diff-right{border-color:#999 #999 #999 #333}.shadow .diff .count{background:#bbb;color:#333}.shadow .diff .data{background:#333;color:#ddd}.shadow .diff .empty{background-color:#999;border-color:#888}.shadow .diff .replace{background-color:#664;border-color:#707050;color:#bb8}.shadow .diff .count .empty{background:#bbb;color:#bbb}#webtool.shadow .diff .replace em{background-color:#440;border-color:#220;color:#cc9}.shadow .diff .delete{background-color:#300;border-color:#400;color:#c66}#webtool.shadow .diff .delete em{background-color:#700;border-color:#c66;color:#f99}.shadow .diff .equal{background-color:#333;border-color:#404040;color:#ddd}.shadow .diff .skip{background-color:#000;border-color:#555}.shadow .diff .insert{background-color:#040;border-color:#005000;color:#6c6}#webtool.shadow .diff .insert em{background-color:#363;border-color:#6c0;color:#cfc}.shadow .diff p.author{background:#555;border-color:#999;color:#ddd}.shadow table td{border-color:#999}.shadow .diff,.shadow #doc table,.shadow .box .body table{background:#333;border-color:#999;color:#ddd}.shadow #doc strong,.shadow .box .body strong{color:#b33}.shadow .box .body em,.shadow .box .body #doc em,.shadow #diffoutput p em,.shadow #diffoutput li em{color:#684}.shadow #diffoutput #thirdparties{background:#666;border-color:#999}.shadow #diffoutput #thirdparties a{box-shadow:0 .2em .4em rgba(0,0,0,1);color:#000}#doc.shadow{color:#ddd}#doc.shadow h3 a{color:#f90}.shadow #doc div,#doc.shadow div{background:#666;border-color:#999}.shadow #doc ol,#doc.shadow ol{background:#333;border-color:#999}.shadow #doc div div,#doc.shadow div div{background:#333;border-color:#999}.shadow #doc table,#doc.shadow table{background:#333;border-color:#999}.shadow #doc th,#doc.shadow th{background:#bbb;border-left-color:#999;border-top-color:#999;color:#333}.shadow #doc tr:hover,#doc.shadow tr:hover{background:#555}.shadow #doc div:hover,#doc.shadow div:hover{background:#777}.shadow #doc div div:hover,#doc.shadow div div:hover,#doc.shadow div ol:hover{background:#444}.shadow #textreport{background:#222}.shadow #pdsamples li{background:#666;border-color:#999}.shadow #pdsamples li div{background:#333;border-color:#999}.shadow #pdsamples li p a{color:#f90}.shadow #pdsamples li p a:hover{color:#fc0}",
        swhite  : "html .white,body.white{color:#333}body.white button{background:#eee;border-color:#222;box-shadow:0 .1em .2em rgba(64,64,64,0.75);color:#666;text-shadow:.05em .05em .1em #ccc}.white button:hover,.white button:active{background:#999;color:#eee;text-shadow:.1em .1em .1em #333}.white a{color:#009}.white #title_text{border-color:#fff;color:#333}.white #introduction h2{border-color:#999;color:#333}.white h1 svg{background:#eee;border-color:#999;box-shadow:0 .1em .2em rgba(150,150,150,0.5)}.white h2,.white h3{background:#eee;border-color:#eee;box-shadow:none;padding-left:0;text-shadow:none}.white fieldset{background:#ddd;border-color:#999}.white legend{background:#fff;border-color:#999;color:#333;text-shadow:none}.white .box{background:#666;border-color:#999;box-shadow:0 .4em .8em rgba(64,64,64,0.75)}.white .box button{box-shadow:0 .1em .2em rgba(0,0,0,0.75);text-shadow:.1em .1em .1em rgba(0,0,0,.5)}.white .box button.resize{background:#bbf;border-color:#446;color:#446}.white .box button.resize:hover{background:#ddf;border-color:#228;color:#228}.white .box button.save{background:#d99;border-color:#300;color:#300}.white .box button.save:hover{background:#fcc;border-color:#822;color:#822}.white .box button.minimize{background:#bbf;border-color:#006;color:#006}.white .box button.minimize:hover{background:#eef;border-color:#228;color:#228}.white .box button.maximize{background:#9c9;border-color:#030;color:#030}.white .box button.maximize:hover{background:#cfc;border-color:#060;color:#060}.white .box h3.heading{background:#ddd;border-color:#888;box-shadow:.2em .2em .4em #666}.white .box h3.heading:hover{background:#333;color:#eee}.white .box .body{background:#eee;border-color:#888;box-shadow:0 0 .4em rgba(64,64,64,0.75)}.white .options{background:#eee;border-color:#999;box-shadow:0 .2em .4em rgba(64,64,64,0.5);text-shadow:.05em .05em .1em #ccc}.white .options h2,.white #Beautify h2,.white #Minify h2,.white #diffBase h2,.white #diffNew h2{background:#eee;border-color:#eee;box-shadow:none;text-shadow:none}.white #option_comment{background:#ddd;border-color:#999}.white #top em{color:#00f}.white #update{background:#eee;border-color:#999;box-shadow:0 .1em .2em rgba(64,64,64,0.5)}.white .wide,.white .tall,.white #diffBase,.white #diffNew{background:#eee;border-color:#999;box-shadow:0 .2em .4em rgba(64,64,64,0.5)}.white .file input,.white .labeltext input{border-color:#fff}#webtool.white input.unchecked{background:#ccc;color:#666}.white .options input[type=text],.white .options select{border-color:#999}.white #beautyoutput,.white #minifyoutput{background:#ddd}.white #diffoutput p em,.white #diffoutput li em{color:#c00}.white .analysis .bad{background-color:#ebb;color:#400}.white .analysis .good{background-color:#cec;color:#040}.white #doc .analysis thead th,.white #doc .analysis th[colspan]{background:#eef}.white div input{border-color:#999}.white textarea{border-color:#999}.white textarea:hover{background:#eef8ff}.white .diff,.white .diff ol,.white .diff .diff-left,.white .diff .diff-right,.white h3,.white p.author{border-color:#999}.white .diff .count li{background:#eed;border-color:#bbc;color:#886}.white .diff h3{background:#ddd;border-bottom-color:#bbc}.white .diff .empty{background-color:#ddd;border-color:#ccc}.white .diff .replace{background-color:#fea;border-color:#dd8}#webtool.white .diff .replace em{background-color:#ffd;border-color:#963;color:#630}.white .diff .delete{background-color:#fbb;border-color:#eaa}#webtool.white .diff .delete em{background-color:#fdd;border-color:#700;color:#600}.white .diff .equal{background-color:#fff;border-color:#eee}.white .diff .skip{background-color:#efefef;border-color:#ddd}.white .diff .insert{background-color:#bfb;border-color:#aea}#webtool.white .diff .insert em{background-color:#efc;border-color:#070;color:#050}.white .diff p.author{background:#efefef;border-top-color:#bbc}.white #doc table,.white .box .body table{background:#fff;border-color:#999}.white #doc strong,.white .box .body strong{color:#c00}.white .box .body em,.white .box .body #doc em{color:#090}.white #thirdparties img,.white #diffoutput #thirdparties{border-color:#999}.white #thirdparties img{box-shadow:.2em .2em .4em #999}.white #diffoutput #thirdparties{background:#eee}.white #doc div,#doc.white div{background:#ddd;border-color:#999}.white #doc ol,#doc.white ol{background:#eee;border-color:#999}.white #doc div div,#doc.white div div{background:#eee;border-color:#999}.white #doc table,#doc.white table{background:#fff;border-color:#999}.white #doc th,#doc.white th{background:#ddd;border-left-color:#999;border-top-color:#999}.white #doc tr:hover,#doc.white tr:hover{background:#ddd}#doc.white em{color:#060}.white #doc div:hover,#doc.white div:hover{background:#ccc}.white #doc div div:hover,#doc.white div div:hover,#doc.white div ol:hover{background:#fff}.white #pdsamples li{background:#eee;border-color:#999}.white #pdsamples li div{background:#ddd;border-color:#999}.white #pdsamples li div a{color:#47a}.white #pdsamples li p a{color:#009}"
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
            lineNumbers      : true,
            indentUnit       : 4,
            foldGutter       : true,
            gutters          : [
                "CodeMirror-linenumbers", "CodeMirror-foldgutter"
            ],
            tabSize          : 4,
            theme            : "white",
            showTrailingSpace: true,
            matchTags        : true,
            matchBrackets    : true,
            mode             : "javascript"
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
            lineNumbers      : true,
            indentUnit       : 4,
            foldGutter       : true,
            gutters          : [
                "CodeMirror-linenumbers", "CodeMirror-foldgutter"
            ],
            tabSize          : 4,
            theme            : "white",
            showTrailingSpace: true,
            matchTags        : true,
            matchBrackets    : true,
            mode             : "javascript"
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
            lineNumbers      : true,
            indentUnit       : 4,
            foldGutter       : true,
            gutters          : [
                "CodeMirror-linenumbers", "CodeMirror-foldgutter"
            ],
            tabSize          : 4,
            theme            : "white",
            showTrailingSpace: true,
            matchTags        : true,
            matchBrackets    : true,
            mode             : "javascript"
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
            lineNumbers      : true,
            indentUnit       : 4,
            foldGutter       : true,
            gutters          : [
                "CodeMirror-linenumbers", "CodeMirror-foldgutter"
            ],
            tabSize          : 4,
            theme            : "white",
            showTrailingSpace: true,
            matchTags        : true,
            matchBrackets    : true,
            mode             : "javascript",
            readOnly         : true
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
            lineNumbers      : true,
            indentUnit       : 4,
            foldGutter       : true,
            gutters          : [
                "CodeMirror-linenumbers", "CodeMirror-foldgutter"
            ],
            tabSize          : 4,
            theme            : "white",
            showTrailingSpace: true,
            matchTags        : true,
            matchBrackets    : true,
            mode             : "javascript"
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
            lineNumbers      : true,
            indentUnit       : 4,
            foldGutter       : true,
            gutters          : [
                "CodeMirror-linenumbers", "CodeMirror-foldgutter"
            ],
            tabSize          : 4,
            theme            : "white",
            showTrailingSpace: true,
            matchTags        : true,
            matchBrackets    : true,
            mode             : "javascript",
            readOnly         : true
        });
        //language detection
        pd.auto        = function dom__auto(a) {
            var b     = [],
                c     = 0,
                d     = 0,
                join  = "",
                flaga = false,
                flagb = false;
            if (a === undefined || (/^(\s*#)/).test(a) === true) {
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
                if ((/^(\s*\{)/).test(a) === true && (/(\}\s*)$/).test(a) && a.indexOf(",") !== -1) {
                    return "javascript";
                }
                if ((/((\}?(\(\))?\)*;?\s*)|([a-z0-9]("|')?\)*);?(\s*\})*)$/i).test(a) === true && ((/(var\s+[a-z]+[a-zA-Z0-9]*)/).test(a) === true || (/(\=\s*function)|(\s*function\s+(\w*\s+)?\()/).test(a) === true || a.indexOf("{") === -1 || (/^(\s*if\s+\()/).test(a) === true)) {
                    if (a.indexOf("(") > -1 || a.indexOf("=") > -1 || (a.indexOf(";") > -1 && a.indexOf("{") > -1) || pd.mode !== "diff") {
                        return "javascript";
                    }
                    return "text";
                }
                if ((/^(\s*[\$\.#@a-z0-9])|^(\s*\/\*)|^(\s*\*\s*\{)/i).test(a) === true && (/^(\s*if\s*\()/).test(a) === false && a.indexOf("{") !== -1 && (/\=\s*(\{|\[|\()/).test(join) === false && ((/(\+|\-|\=|\*|\?)\=/).test(join) === false || ((/\=+('|")?\)/).test(a) === true && (/;\s*base64/).test(a) === true)) && (/function(\s+\w+)*\s*\(/).test(join) === false) {
                    if ((/^(\s*return;?\s*\{)/).test(a) === true && (/(\};?\s*)$/).test(a) === true) {
                        return "javascript";
                    }
                    return "css";
                }
                if (pd.mode === "diff") {
                    return "text";
                }
                return "javascript";
            }
            if (((/(>[\w\s:]*)?<(\/|\!)?[\w\s:\-\[]+/).test(a) === true && (/^([\s\w]*<)/).test(a) === true && (/(>[\s\w]*)$/).test(a) === true) || ((/^(\s*<s((cript)|(tyle)))/i).test(a) === true && (/(<\/s((cript)|(tyle))>\s*)$/i).test(a) === true)) {
                if ((/^(\s*<\!doctype html>)/i).test(a) === true || (/^(\s*<html)/i).test(a) === true || ((/^(\s*<\!DOCTYPE\s+((html)|(HTML))\s+PUBLIC\s+)/).test(a) === true && (/XHTML\s+1\.1/).test(a) === false && (/XHTML\s+1\.0\s+(S|s)((trict)|(TRICT))/).test(a) === false)) {
                    return "html";
                }
                return "markup";
            }
            if (pd.mode === "diff") {
                return "text";
            }
            return "javascript";
        };
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
            node        = this,
            diffRight   = node.parentNode,
            diff        = diffRight.parentNode,
            subOffset   = 0,
            counter     = pd.colSliderProperties[0],
            data        = pd.colSliderProperties[1],
            width       = pd.colSliderProperties[2],
            total       = pd.colSliderProperties[3],
            offset      = (pd.colSliderProperties[4]),
            min         = 0,
            max         = data - 1,
            status      = "ew",
            minAdjust   = min + 15,
            maxAdjust   = max - 15,
            withinRange = false,
            diffLeft    = diffRight.previousSibling,
            drop        = function DOM_colSliderGrab_drop(f) {
                f = f || window.event;
                f.preventDefault();
                node.style.cursor    = status + "-resize";
                document.onmousemove = null;
                document.onmouseup   = null;
            },
            boxmove     = function DOM_colSliderGrab_boxmove(f) {
                f = f || window.event;
                f.preventDefault();
                subOffset = offset - f.clientX;
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
                document.onmouseup = drop;
            };
        event.preventDefault();
        if (typeof pd.o === "object" && pd.o.report.diff.box !== null) {
            offset += pd.o.report.diff.box.offsetLeft;
            offset -= pd.o.report.diff.body.scrollLeft;
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
        document.onmousemove     = boxmove;
        document.onmousedown     = null;
    };

    //allows visual folding of function in the JSPretty jsscope HTML
    //output
    pd.beaurows            = [];
    pd.beaufold            = function dom__beaufold() {
        var self  = this,
            title = self.getAttribute("title").split("line "),
            min   = Number(title[1].substr(0, title[1].indexOf(" "))),
            max   = Number(title[2]),
            a     = 0,
            b     = "";
        if (self.innerHTML.charAt(0) === "-") {
            for (a = min; a < max; a += 1) {
                pd.beaurows[0][a].style.display = "none";
                pd.beaurows[1][a].style.display = "none";
            }
            self.innerHTML = "+" + self.innerHTML.substr(1);
        } else {
            for (a = min; a < max; a += 1) {
                pd.beaurows[0][a].style.display = "block";
                pd.beaurows[1][a].style.display = "block";
                if (pd.beaurows[0][a].getAttribute("class") === "fold" && pd.beaurows[0][a].innerHTML.charAt(0) === "+") {
                    b = pd.beaurows[0][a].getAttribute('title');
                    b = b.substring(b.indexOf('to line ') + 1);
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
            parent     = {},
            h3         = "",
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
                }
                if (lang === "html") {
                    lang = "htmlembedded";
                } else if (lang === "css") {
                    lang = "text/x-scss";
                } else if (lang === "markup") {
                    lang = "xml";
                }
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
            },
            execOutput = function dom__recycle_execOutput() {
                var diffList         = [],
                    button           = {},
                    buttons          = {},
                    presumedLanguage = "";

                node      = pd.$$("showOptionsCallOut");
                pd.zIndex += 1;
                if (pd.o.announce !== null && pd.o.announce.innerHTML !== pd.o.announcetext && api.lang === "auto") {
                    pd.o.announce.style.color = "#00f";
                    presumedLanguage          = output[1].split("Presumed language is <em>")[1];
                    if (api.mode === "beautify" && presumedLanguage !== undefined) {
                        if (presumedLanguage !== undefined) {
                            presumedLanguage        = presumedLanguage.substring(0, presumedLanguage.indexOf("</em>"));
                            pd.o.announce.innerHTML = "Language is set to <strong>auto</strong>. Presumed language is <em>" + presumedLanguage + "</em>.";
                            presumedLanguage        = presumedLanguage.toLowerCase();
                        }
                    } else {
                        presumedLanguage = lang;
                        if (lang === "javascript") {
                            lang = "JavaScript";
                        } else if (lang === "text") {
                            lang = "plain text";
                        } else if (lang !== "markup") {
                            lang = lang.toUpperCase();
                        }
                        pd.o.announce.innerHTML = "Language is set to <strong>auto</strong>. Presumed language is <em>" + lang + "</em>.";
                    }
                }
                if (api.mode === "beautify") {
                    if (pd.o.codeBeauOut !== null) {
                        if (pd.test.cm === true) {
                            pd.cm.beauOut.setValue(output[0]);
                        } else {
                            pd.o.codeBeauOut.value = output[0];
                        }
                    }
                    if (pd.o.announce !== null && pd.o.announce.innerHTML !== pd.o.announcetext) {
                        if (api.lang === "markup" || presumedLanguage === "markup" || presumedLanguage === "html" || presumedLanguage === "xhtml" || presumedLanguage === "xml" || presumedLanguage === "jstl") {
                            lang = (function () {
                                var a      = 0,
                                    p      = output[1].split("<p><strong>"),
                                    length = p.length;
                                for (a = 0; a < length; a += 1) {
                                    if (p[a].indexOf(" more ") > -1 && p[a].indexOf("start tag") > -1 && p[a].indexOf("end tag") > -1) {
                                        return "Notice: " + p[a].substring(0, p[a].indexOf("<"));
                                    }
                                }
                                return "";
                            }());
                            if (lang !== "") {
                                pd.o.announce.style.color = "#c00";
                                pd.o.announce.innerHTML   = lang;
                            }
                        }
                    }
                    if (pd.o.report.beau.box !== null) {
                        if (output[1] !== "") {
                            if (autotest === true) {
                                output[1] = output[1].replace("seconds </em></p>", "seconds </em></p> <p>Language is set to <strong>auto</strong>. Presumed language is <em>" + api.lang + "</em>.</p>");
                                api.lang  = "auto";
                            }
                            pd.o.report.beau.body.innerHTML    = output[1];
                            pd.o.report.beau.box.style.zIndex  = pd.zIndex;
                            pd.o.report.beau.box.style.display = "block";
                        }
                        if (output[1].length > 125000) {
                            pd.test.filled.beau = true;
                        } else {
                            pd.test.filled.beau = false;
                        }
                        parent = pd.o.report.beau.box.getElementsByTagName("p")[0];
                        h3     = pd.o.report.beau.box.getElementsByTagName("h3")[0].style.width;
                        if (api.jsscope === true && (api.lang === "auto" || api.lang === "javascript") && output[0].indexOf("Error:") !== 0) {
                            if (api.lang === "auto" && presumedLanguage === "") {
                                presumedLanguage = output[1].split("Presumed language is <em>")[1];
                                presumedLanguage = presumedLanguage.substring(0, presumedLanguage.indexOf("</em>"));
                            }
                            if (presumedLanguage.toLowerCase() === "javascript" || api.lang === "javascript") {
                                pd.top(pd.o.report.beau.box);
                                pd.o.report.beau.box.style.display = "block";
                                if (parent.innerHTML.indexOf("save") < 0) {
                                    if (parent.style === undefined || parent.style.display === "block") {
                                        pd.o.report.beau.box.getElementsByTagName("h3")[0].style.width = (Number(h3.substr(0, h3.length - 2)) - 3) + "em";
                                    }
                                    if (pd.test.agent.indexOf("firefox") > -1 || (pd.test.agent.indexOf("opera") > -1 && pd.test.agent.indexOf("blink") < 0)) {
                                        button = document.createElement("a");
                                        button.setAttribute("href", "#");
                                        button.innerHTML = "<button class='save' title='Save output.'>S</button>";
                                    } else {
                                        button = document.createElement("button");
                                        button.setAttribute("class", "save");
                                        button.setAttribute("title", "Save output.");
                                        button.innerHTML = "S";
                                    }
                                    parent.insertBefore(button, parent.firstChild);
                                    button.onclick = function dom__recycle_beauSave() {
                                        var that = this;
                                        pd.save(that);
                                    };
                                }
                                button = pd.o.report.beau.box.getElementsByTagName("p")[0];
                                if (pd.o.report.beau.body.style.display === "none") {
                                    buttons = button.getElementsByTagName("button");
                                    if (buttons[0].getAttribute("class") === "save") {
                                        button = buttons[1];
                                    } else {
                                        button = buttons[0];
                                    }
                                    button.click(button.onclick, 1, button);
                                }
                                pd.o.report.beau.box.style.top   = (pd.settings.beaureport.top / 10) + "em";
                                pd.o.report.beau.box.style.right = "auto";
                                diffList                         = pd.o.report.beau.body.getElementsByTagName("ol");
                                if (diffList.length > 0) {
                                    pd.beaurows[0] = diffList[0].getElementsByTagName("li");
                                    pd.beaurows[1] = diffList[1].getElementsByTagName("li");
                                }
                                (function () {
                                    var a = 0,
                                        b = pd.beaurows[0].length;
                                    for (a = 0; a < b; a += 1) {
                                        if (pd.beaurows[0][a].getAttribute("class") === "fold") {
                                            pd.beaurows[0][a].onclick = pd.beaufold;
                                        }
                                    }
                                }());
                            } else {
                                if (parent.innerHTML.indexOf("save") > -1) {
                                    if (parent.style === undefined || parent.style.display === "block") {
                                        pd.o.report.beau.box.getElementsByTagName("h3")[0].style.width = (Number(h3.substr(0, h3.length - 2)) + 3) + "em";
                                    }
                                    parent.removeChild(parent.firstChild);
                                }
                                pd.beaurows = [];
                            }
                        } else {
                            if (parent.innerHTML.indexOf("save") > -1) {
                                if (parent.style === undefined || parent.style.display === "block") {
                                    pd.o.report.beau.box.getElementsByTagName("h3")[0].style.width = (Number(h3.substr(0, h3.length - 2)) + 3) + "em";
                                }
                                parent.removeChild(parent.firstChild);
                            }
                            pd.beaurows = [];
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
                if (api.mode === "diff" && pd.o.report.diff.box !== null) {
                    if (pd.o.announce !== null && pd.o.announce.innerHTML !== pd.o.announcetext && api.lang !== "auto") {
                        pd.o.announce.innerHTML = "";
                    }
                    if (autotest === true) {
                        output[1] = output[1].replace("seconds </em></p>", "seconds </em></p> <p>Language is set to <strong>auto</strong>. Presumed language is <em>" + api.lang + "</em>.</p>");
                        api.lang  = "auto";
                    }
                    buttons = pd.o.report.diff.box.getElementsByTagName("p")[0].getElementsByTagName("button");
                    if (output[0].length > 125000) {
                        pd.test.filled.diff = true;
                    } else {
                        pd.test.filled.diff = false;
                    }
                    if ((/^(<p><strong>Error:<\/strong> Please try using the option labeled ((&lt;)|<)em((&gt;)|>)Plain Text \(diff only\)((&lt;)|<)\/em((&gt;)|>)\.)/).test(output[0])) {
                        pd.o.report.diff.body.innerHTML = "<p><strong>Error:</strong> Please try using the option labeled <em>Plain Text (diff only)</em>. <span style='display:block'>The input does not appear to be markup, CSS, or JavaScript.</span></p>";
                    } else {
                        pd.o.report.diff.body.innerHTML = output[1] + output[0];
                    }
                    if (buttons[1].parentNode.style.display === "none") {
                        pd.minimize(buttons[1].onclick, 1, buttons[1]);
                    }
                    if (pd.o.report.diff.body.innerHTML.toLowerCase().indexOf("<textarea") === -1) {
                        diffList = pd.o.report.diff.body.getElementsByTagName("ol");
                        (function () {
                            var cells = diffList[0].getElementsByTagName("li"),
                                len   = cells.length,
                                a     = 0;
                            for (a = 0; a < len; a += 1) {
                                if (cells[a].getAttribute("class") === "fold") {
                                    cells[a].onclick = pd.difffold;
                                }
                            }
                        }());
                        if (api.diffview === "sidebyside") {
                            if (diffList.length < 3 || diffList[0] === null || diffList[1] === null || diffList[2] === null) {
                                pd.colSliderProperties = [
                                    0, 0, 0, 0, 0
                                ];
                            } else {
                                pd.colSliderProperties  = [
                                    diffList[0].clientWidth, diffList[1].clientWidth, diffList[2].parentNode.clientWidth, diffList[2].parentNode.parentNode.clientWidth, diffList[2].parentNode.offsetLeft - diffList[2].parentNode.parentNode.offsetLeft
                                ];
                                diffList[2].onmousedown = pd.colSliderGrab;
                            }
                        }
                    }
                    if (pd.o.save !== null && pd.o.save.checked === true) {
                        if (buttons[0].parentNode.nodeName.toLowerCase() === "a") {
                            pd.save(buttons[0].parentNode);
                        } else {
                            pd.save(buttons[0]);
                        }
                    }
                    if (pd.test.ls === true) {
                        pd.stat.diff += 1;
                        node         = pd.$$("stdiff");
                        if (node !== null) {
                            node.innerHTML = pd.stat.diff;
                        }
                    }
                    if (pd.o.report.diff.box !== null) {
                        pd.o.report.diff.box.style.top     = (pd.settings.diffreport.top / 10) + "em";
                        pd.o.report.diff.box.style.display = "block";
                    }
                }
                if (api.mode === "minify") {
                    if (pd.o.announce !== null && pd.o.announce.innerHTML !== pd.o.announcetext && api.lang !== "auto") {
                        pd.o.announce.innerHTML = "";
                    }
                    if (output[0].length > 125000) {
                        pd.test.filled.min = true;
                    } else {
                        pd.test.filled.min = false;
                    }
                    if (pd.o.codeMinnOut !== null) {
                        if (pd.test.cm === true) {
                            pd.cm.minnOut.setValue(output[0]);
                        } else {
                            pd.o.codeMinnOut.value = output[0];
                        }
                    }
                    if (pd.o.report.minn.box !== null) {
                        if (autotest === true) {
                            output[1] = output[1].replace("seconds </em</p>", "seconds </em</p> <p>Language is set to <strong>auto</strong>. Presumed language is <em>" + api.lang + "</em>.</p>");
                            api.lang  = "auto";
                        }
                        pd.o.report.minn.body.innerHTML    = output[1];
                        pd.o.report.minn.box.style.zIndex  = pd.zIndex;
                        pd.o.report.minn.box.style.display = "block";
                    }
                    if (pd.test.ls === true) {
                        pd.stat.minn += 1;
                        node         = pd.$$("stminn");
                        if (node !== null) {
                            node.innerHTML = pd.stat.minn;
                        }
                    }
                }
                if (pd.test.ls === true) {
                    (function dom__recycle_stats() {
                        var lango = {},
                            size  = 0;
                        if (api.lang === "auto" && typeof output[1] === "string") {
                            lango = (/Language set to <strong>auto<\/strong>\. Presumed language is <em>\w+<\/em>\./).exec(output[1]);
                            if (lango !== null) {
                                lang = lango.toString();
                                lang = lang.substring(lang.indexOf("<em>") + 4, lang.indexOf("</em>"));
                                if (lang === "JavaScript" || lang === "JSON") {
                                    pd.stat.js += 1;
                                    node       = pd.$$("stjs");
                                    if (node !== null) {
                                        node.innerHTML = pd.stat.js;
                                    }
                                } else if (lang === "CSS") {
                                    pd.stat.css += 1;
                                    node        = pd.$$("stcss");
                                    if (node !== null) {
                                        node.innerHTML = pd.stat.css;
                                    }
                                } else if (lang === "HTML" || lang === "markup") {
                                    pd.stat.markup += 1;
                                    node           = pd.$$("stmarkup");
                                    if (node !== null) {
                                        node.innerHTML = pd.stat.markup;
                                    }
                                }
                            }
                        } else if (api.lang === "csv") {
                            pd.stat.csv += 1;
                            node        = pd.$$("stcsv");
                            if (node !== null) {
                                node.innerHTML = pd.stat.csv;
                            }
                        } else if (api.lang === "text") {
                            pd.stat.text += 1;
                            node         = pd.$$("sttext");
                            if (node !== null) {
                                node.innerHTML = pd.stat.text;
                            }
                        } else if (api.lang === "javascript") {
                            pd.stat.js += 1;
                            node       = pd.$$("stjs");
                            if (node !== null) {
                                node.innerHTML = pd.stat.js;
                            }
                        } else if (api.lang === "markup" || api.lang === "html") {
                            pd.stat.markup += 1;
                            node           = pd.$$("stmarkup");
                            if (node !== null) {
                                node.innerHTML = pd.stat.markup;
                            }
                        } else if (api.lang === "css") {
                            pd.stat.css += 1;
                            node        = pd.$$("stcss");
                            if (node !== null) {
                                node.innerHTML = pd.stat.css;
                            }
                        }
                        if (api.mode === "diff" && api.diff.length > api.source.length) {
                            size = api.diff.length;
                        } else {
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
        if (typeof event === "object" && event.type === "keyup") {
            //jsscope does not get the convenience of keypress execution, because its overhead is costly
            node = pd.$$("jsscope-yes");
            //do not execute keypress from alt, home, end, or arrow keys
            if ((node !== null && node.checked === true && pd.mode === "beau") || event.altKey === true || event.keyCode === 16 || event.keyCode === 18 || event.keyCode === 35 || event.keyCode === 36 || event.keyCode === 37 || event.keyCode === 38 || event.keyCode === 39 || event.keyCode === 40) {
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
        api.lang    = (pd.o.lang === null) ? "javascript" : (pd.o.lang.nodeName.toLowerCase() === "select") ? pd.o.lang[pd.o.lang.selectedIndex].value.toLowerCase() : pd.o.lang.value.toLowerCase();
        node        = pd.$$("csvchar");
        api.csvchar = (node === null || node.value.length === 0) ? "," : node.value;
        api.api     = "dom";

        //determine options based upon mode of operations
        if (pd.mode === "beau") {
            if (pd.application === undefined) {
                if (api.lang === "markup" || api.lang === "html" || api.lang === "xml" || api.lang === "jstl") {
                    pd.application = markup_beauty;
                } else if (api.lang === "csv") {
                    pd.application = csvbeauty;
                } else if (api.lang === "css" || api.lang === "scss") {
                    pd.application = cleanCSS;
                } else {
                    pd.application = jspretty;
                }
            }
            (function dom__recycle_beautify() {
                var comments    = pd.$$("incomment-no"),
                    chars       = pd.$$("beau-space"),
                    emptyLines  = {},
                    elseline    = {},
                    forceIndent = {},
                    html        = {},
                    indent      = {},
                    jscorrect   = {},
                    jsscope     = {},
                    jsspace     = {},
                    offset      = {},
                    quantity    = pd.$$("beau-quan"),
                    style       = {},
                    wrap        = {};
                if (pd.o.codeBeauIn !== null) {
                    if (pd.test.cm === true) {
                        api.source = pd.cm.beauIn.getValue();
                    } else {
                        api.source = pd.o.codeBeauIn.value;
                    }
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
                    emptyLines   = pd.$$("jslines-no");
                    elseline     = pd.$$("jselseline-yes");
                    indent       = pd.$$("jsindent-all");
                    jscorrect    = pd.$$("jscorrect-yes");
                    jsscope      = pd.$$("jsscope-yes");
                    jsspace      = pd.$$("jsspace-no");
                    offset       = pd.$$("jsinlevel");
                    api.correct  = (jscorrect === null || jscorrect.checked === false) ? false : true;
                    api.elseline = (elseline === null || elseline.checked === false) ? false : true;
                    api.indent   = (indent === null || indent.checked === false) ? "knr" : "allman";
                    api.inlevel  = (offset === null || isNaN(offset.value) === true) ? 0 : Number(offset.value);
                    api.jsscope  = (jsscope === null || jsscope.checked === false) ? false : true;
                    api.preserve = (emptyLines === null || emptyLines.checked === false) ? true : false;
                    api.space    = (jsspace === null || jsspace.checked === false) ? true : false;
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
                    pd.application = markupmin;
                } else if (api.lang === "csv") {
                    pd.application = csvmin;
                } else {
                    pd.application = jsmin;
                }
            }
            (function dom__recycle_minify() {
                var conditional = pd.$$("conditionalm-yes"),
                    html        = pd.$$("htmlm-yes"),
                    topcoms     = pd.$$("topcoms-yes"),
                    obfuscate   = pd.$$("obfuscate-yes");
                if (pd.o.codeMinnIn !== null) {
                    pd.o.codeMinnIn = pd.$$("minifyinput");
                    if (pd.test.cm === true) {
                        api.source = pd.cm.minnIn.getValue();
                    } else {
                        api.source = pd.o.codeMinnIn.value;
                    }
                }
                api.conditional = (conditional === null || conditional.checked === false) ? false : true;
                api.html        = (html === null || html.checked === false) ? false : true;
                api.topcoms     = (topcoms === null || topcoms.checked === false) ? false : true;
                api.obfuscate   = (obfuscate === null || obfuscate.checked === false) ? false : true;
            }());
            api.mode = "minify";
        }
        if (pd.mode === "diff") {
            if (typeof prettydiff !== "function") {
                pd.application = diffview;
            }
            if (typeof pd.application !== "function") {
                return;
            }
            api.jsscope = false;
            (function dom__recycle_diff() {
                var baseLabel   = pd.$$("baselabel"),
                    comments    = pd.$$("diffcommentsy"),
                    chars       = pd.$$("diff-space"),
                    conditional = {},
                    content     = pd.$$("diffcontentn"),
                    context     = pd.$$("contextSize"),
                    elseline    = {},
                    forceIndent = {},
                    html        = {},
                    indent      = pd.$$("jsindentd-all"),
                    inline      = pd.$$("inline"),
                    newLabel    = pd.$$("newlabel"),
                    preserve    = {},
                    quantity    = pd.$$("diff-quan"),
                    quote       = pd.$$("diffquoten"),
                    style       = {},
                    semicolon   = pd.$$("diffscolonn"),
                    space       = {},
                    wrap        = {};
                pd.o.codeDiffBase = pd.$$("baseText");
                pd.o.codeDiffNew  = pd.$$("newText");
                api.content       = (content === null || content.checked === false) ? false : true;
                api.context       = (context !== null && context.value !== "" && isNaN(context.value) === false) ? Number(context.value) : "";
                api.diffcomments  = (comments !== null && comments.checked === true) ? true : false;
                api.difflabel     = (newLabel === null) ? "new" : newLabel.value;
                api.diffview      = (inline === null || inline.checked === false) ? "sidebyside" : "inline";
                api.indent        = (indent === null || indent.checked === false) ? "knr" : "allman";
                api.insize        = (quantity === null || isNaN(quantity.value) === true) ? 4 : Number(quantity.value);
                api.quote         = (quote === null || quote.checked === false) ? false : true;
                api.semicolon     = (semicolon === null || semicolon.checked === false) ? false : true;
                api.sourcelabel   = (baseLabel === null) ? "base" : baseLabel.value;
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
                    elseline     = pd.$$("jselselined-yes");
                    preserve     = pd.$$("jslinesd-no");
                    space        = pd.$$("jsspaced-no");
                    api.elseline = (elseline === null || elseline.checked === false) ? false : true;
                    api.preserve = (preserve === null || preserve.checked === false) ? false : true;
                    api.space    = (space === null || space.checked === false) ? true : false;
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
                        var protocolRemove = (api.diff.indexOf("file:///") === 0) ? api.diff.split(":///")[1] : api.diff.split("://")[1],
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
                                            if (pd.test.cm === true && api.lang === "auto") {
                                                cmlang();
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
                            xhr.open("GET", "proxy.php?x=" + api.diff.replace(/(\s*)$/, "").replace(/%26/g, "&").replace(/%3F/, "?"), true);
                            xhr.send();
                        }
                    }());
                }
            }());
        }
        if (pd.test.ls === true) {
            if (pd.o.report.stat.box !== null) {
                pd.stat.usage += 1;
                node          = pd.$$("stusage");
                if (node !== null) {
                    node.innerHTML = pd.stat.usage;
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
                var protocolRemove = (api.source.indexOf("file:///") === 0) ? api.source.split(":///")[1] : api.source.split("://")[1],
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
                                    if (pd.test.cm === true && api.lang === "auto") {
                                        cmlang();
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
                    xhr.open("GET", "proxy.php?x=" + api.source.replace(/(\s*)$/, "").replace(/%26/g, "&").replace(/%3F/, "?"), true);
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
                        if (pd.test.cm === true && api.lang === "auto") {
                            cmlang();
                            api.lang = lang;
                            output   = pd.application(api);
                            api.lang = "auto";
                        } else {
                            output = pd.application(api);
                        }
                        execOutput();
                    }, 50);
                }
                if (api.mode === "minify") {
                    setTimeout(function () {
                        api.source = pd.cm.minnIn.getValue();
                        if (pd.test.cm === true && api.lang === "auto") {
                            cmlang();
                            api.lang = lang;
                            output   = pd.application(api);
                            api.lang = "auto";
                        } else {
                            output = pd.application(api);
                        }
                        execOutput();
                    }, 50);
                }
            } else {
                if (pd.test.cm === true && api.lang === "auto") {
                    cmlang();
                    api.lang = lang;
                    output   = pd.application(api);
                    api.lang = "auto";
                } else {
                    output = pd.application(api);
                }
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
        if (typeof event !== "object" || event.type !== "keydown" || event.keyCode !== 9 || typeof x.selectionStart !== "number" || typeof x.selectionEnd !== "number") {
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

    //intelligently raise the z-index of the report windows
    pd.top                 = function dom__top(x) {
        var indexListed = pd.zIndex,
            indexes     = [
                (pd.o.report.diff.box === null) ? 0 : Number(pd.o.report.diff.box.style.zIndex), (pd.o.report.beau.box === null) ? 0 : Number(pd.o.report.beau.box.style.zIndex), (pd.o.report.minn.box === null) ? 0 : Number(pd.o.report.minn.box.style.zIndex), (pd.o.report.stat.box === null) ? 0 : Number(pd.o.report.stat.box.style.zIndex)
            ],
            indexMax    = Math.max(indexListed, indexes[0], indexes[1], indexes[2], indexes[3]) + 1;
        pd.zIndex      = indexMax;
        x.style.zIndex = indexMax;
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
                reader.readAsText(files[a], "UTF-8");
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
            switch (color) {
            case "default":
                logoColor = "234";
                break;
            case "canvas":
                logoColor = "664";
                break;
            case "shadow":
                logoColor = "999";
                break;
            case "white":
                logoColor = "666";
                break;
            default:
                logoColor = "000";
                break;
            }
            logo.style.borderColor = "#" + logoColor;
            logo.getElementsByTagName("g")[0].setAttribute("fill", "#" + logoColor);
        }
        pd.options(x);
    };

    //minimize report windows to the default size and location
    pd.minimize            = function dom__minimize(e, steps, node) {
        var x         = node || this,
            parent    = x.parentNode,
            box       = parent.parentNode,
            finale    = 0,
            hideOps   = (pd.$$("hideOptions") !== null && pd.$$("hideOptions").innerHTML.replace(/\s+/g, " ") === "Show Options") ? true : false,
            body      = box.getElementsByTagName("div")[0],
            heading   = box.getElementsByTagName("h3")[0],
            id        = box.getAttribute("id"),
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
                    pd.settings[id].width  = 750;
                    pd.settings[id].height = 200;
                    leftTarget             = 20;
                    topTarget              = topLocal;
                    widthTarget            = 75;
                    heightTarget           = 20;
                }
                if (topTarget < 1) {
                    topTarget = 1.5;
                }
                widthTarget  = widthTarget - 0.3;
                heightTarget = heightTarget - 3.55;
                if (step === 1) {
                    boxLocal.style.left    = leftTarget + "em";
                    boxLocal.style.top     = topTarget + "em";
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
                    width        = bodyLocal.clientWidth / 10,
                    height       = bodyLocal.clientHeight / 10,
                    incL         = (((window.innerWidth / 10) - finalLocal - 17) - leftLocal) / step,
                    incT         = (((pd.settings[id].topmin / 10) - topLocal) / step),
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
                            if (hideOps === true) {
                                boxLocal.style.top = "-1000em";
                            }
                            boxLocal.style.left  = "auto";
                            boxLocal.style.right = finalLocal + "em";
                            pd.options(boxLocal);
                            return false;
                        }
                    };
                shrink();
                return false;
            };
        buttonRes.style.display = "block";
        if (box === pd.o.report.diff.box) {
            if (pd.test.filled.diff === true) {
                step = 1;
            }
            finale = 57.8;
        }
        if (box === pd.o.report.beau.box) {
            if (pd.test.filled.beau === true) {
                step = 1;
            }
            finale = 38.8;
        }
        if (box === pd.o.report.minn.box) {
            if (pd.test.filled.minn === true) {
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
            if (pd.settings[id].topmin < 35 && hideOps === false) {
                pd.settings[id].topmin = box.parentNode.offsetTop;
            }
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
            if (pd.settings[id].topmin < 15) {
                pd.settings[id].topmin = 15;
            }
            growth();
            x.innerHTML = "\u035f";
        }
        return false;
    };

    //maximize report window to available browser window
    pd.maximize            = function dom__maximize() {
        var x       = this,
            parent  = x.parentNode,
            save    = (parent.innerHTML.indexOf("save") > -1) ? true : false,
            box     = parent.parentNode,
            heading = box.getElementsByTagName("h3")[0],
            body    = box.getElementsByTagName("div")[0],
            top     = (document.body.parentNode.scrollTop > document.body.scrollTop) ? document.body.parentNode.scrollTop : document.body.scrollTop,
            left    = (document.body.parentNode.scrollLeft > document.body.scrollLeft) ? document.body.parentNode.scrollLeft : document.body.scrollLeft,
            id      = box.getAttribute("id"),
            buttons = x.parentNode.getElementsByTagName("button"),
            resize  = buttons[buttons.length - 1];
        pd.top(box);

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
                    heading.style.width = (((bodyWidth + (f.clientX - body.mouseX)) / 10) - 9.8) + "em";
                } else {
                    heading.style.width = (((bodyWidth + (f.clientX - body.mouseX)) / 10) - 6.8) + "em";
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
            diffstring = "];(function(){var cells=document.getElementsByTagName('ol')[0].getElemensByTagName('li'),len=cells.length,a=0;for(a=0;a<len;a+=1){if(cells[a].getAttribute('class')==='fold'){cells[a].onclick=pd.difffold;}}if(d.length>3){d[2].onmousedown=pd.colSliderGrab;}}());pd.difffold=function dom__difffold(){var self=this,title=self.getAttribute('title').split('line '),min=Number(title[1].substr(0,title[1].indexOf(' '))),max=Number(title[2]),a=0,b=0,inner=self.innerHTML,lists=[],parent=self.parentNode.parentNode,listnodes=(parent.getAttribute('class'==='diff'))?parent.getElementsByTagName('ol'):parent.parentNode.getElementsByTagName('ol'),listLen=listnodes.length;for(a=0;a<listLen;a+=1){lists.push(listnodes[a].getElementsByTagName('li'));}max=(max>=lists[0].length)?lists[0].length:max;if(inner.charAt(0)===' - '){self.innerHTML='+'+inner.substr(1);for(a=min;a<max;a+=1){for(b=0;b<listLen;b+=1){lists[b][a].style.display='none';}}}else{self.innerHTML=' - '+inner.substr(1);for(a=min;a<max;a+=1){for(b=0;b<listLen;b+=1){lists[b][a].style.display='block';}}}};pd.colSliderProperties=[d[0].clientWidth,d[1].clientWidth,d[2].parentNode.clientWidth,d[2].parentNode.parentNode.clientWidth,d[2].parentNode.offsetLeft-d[2].parentNode.parentNode.offsetLeft,];pd.colSliderGrab=function dom__colSliderGrab(e){var e=e||window.event,node=this,diffRight=node.parentNode,diff=diffRight.parentNode,subOffset=0,counter=pd.colSliderProperties[0],data=pd.colSliderProperties[1],width=pd.colSliderProperties[2],total=pd.colSliderProperties[3],offset=(pd.colSliderProperties[4]),min=0,max=data-1,status='ew',minAdjust=min+15,maxAdjust=max-15,withinRange=false,diffLeft=diffRight.previousSibling,drop=function DOM_colSliderGrab_drop(f){f=f||window.event;f.preventDefault();node.style.cursor=status+'-resize';document.onmousemove=null;document.onmouseup=null;},boxmove=function DOM_colSliderGrab_boxmove(f){f=f||window.event;f.preventDefault();subOffset=offset-f.clientX;if(subOffset>minAdjust&&subOffset<maxAdjust){withinRange=true;}if(withinRange===true&&subOffset>maxAdjust){diffRight.style.width=((total-counter-2)/10)+'em';status='e';}else if(withinRange===true&&subOffset<minAdjust){diffRight.style.width=(width/10)+'em';status='w';}else if(subOffset<max&&subOffset>min){diffRight.style.width=((width+subOffset)/10)+'em';status='ew';}document.onmouseup=drop;};e.preventDefault();if(typeof pd.o==='object'&&pd.o.report.diff.box!==null){offset+=pd.o.report.diff.box.offsetLeft;offset-=pd.o.report.diff.body.scrollLeft;}else{subOffset=(document.body.parentNode.scrollLeft>document.body.scrollLeft)?document.body.parentNode.scrollLeft:document.body.scrollLeft;offset-=subOffset;}offset+=node.clientWidth;node.style.cursor='ew-resize';diff.style.width=(total/10)+'em';diff.style.display='inline-block';if(diffLeft.nodeType!==1){do{diffLeft=diffLeft.previousSibling;}while(diffLeft.nodeType!==1);}diffLeft.style.display='block';diffRight.style.width=(diffRight.clientWidth/10)+'em';diffRight.style.position='absolute';document.onmousemove=boxmove;document.onmousedown=null;};",
            beaustring = "var data=document.getElementById('pd-jsscope'),pd={};pd.beaurows=[];pd.beaurows[0]=data.getElementsByTagName('ol')[0].getElementsByTagName('li');pd.beaurows[1]=data.getElementsByTagName('ol')[1].getElementsByTagName('li');pd.beaufold=function dom__beaufold(){var self=this,title=self.getAttribute('title').split('line '),min=Number(title[1].substr(0,title[1].indexOf(' '))),max=Number(title[2]),a=0,b='';if(self.innerHTML.charAt(0)==='-'){for(a=min;a<max;a+=1){pd.beaurows[0][a].style.display='none';pd.beaurows[1][a].style.display='none';}self.innerHTML='+'+self.innerHTML.substr(1);}else{for(a=min;a<max;a+=1){pd.beaurows[0][a].style.display='block';pd.beaurows[1][a].style.display='block';if(pd.beaurows[0][a].getAttribute('class')==='fold'&&pd.beaurows[0][a].innerHTML.charAt(0)==='+'){b=pd.beaurows[0][a].getAttribute('title');b=b.substring('to line ');a=Number(b)-1;}}self.innerHTML='-'+self.innerHTML.substr(1);}};(function(){var len=pd.beaurows[0].length,a=0;for(a=0;a<len;a+=1){if(pd.beaurows[0][a].getAttribute('class')==='fold'){pd.beaurows[0][a].onclick=pd.beaufold;}}}());",
            span       = pd.$$("inline"),
            inline     = (span === null || span.checked === false) ? false : true,
            type       = "";

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
            if (top === pd.o.report.diff.box) {
                classQuote = (bodyInner.indexOf("<div class='diff'") > -1) ? "<div class='diff'" : "<div class=\"diff\"";
                content    = bodyInner.split(classQuote);
                build.push(content[0]);
                build.push("<p>Accessibility note. &lt;em&gt; tags in the output represent character differences per lines compared.</p></div>");
                build.push(classQuote);
                build.push(content[1]);
                if (inline === false) {
                    build.push("<script type='");
                    build.push(type);
                    build.push("'><![CDATA[");
                    build.push("var pd={};pd.colSliderProperties=[");
                    build.push(pd.colSliderProperties[0]);
                    build.push(",");
                    build.push(pd.colSliderProperties[1]);
                    build.push(",");
                    build.push(pd.colSliderProperties[2]);
                    build.push(",");
                    build.push(pd.colSliderProperties[3]);
                    build.push(",");
                    build.push(pd.colSliderProperties[4]);
                    build.push(diffstring);
                    build.push("]]></script>");
                }
            } else if (top === pd.o.report.beau.box) {
                classQuote = (bodyInner.indexOf("<div class='beautify' id='pd-jsscope'>") > -1) ? "<div class='beautify' id='pd-jsscope'>" : "<div class=\"beautify\" id=\"pd-jsscope\">";
                content    = bodyInner.split(classQuote);
                build.push(content[0]);
                build.push("<p>Accessibility note. &lt;em&gt; tags in the output represent presentation for variable coloring and scope.</p></div>");
                build.push(classQuote);
                build.push(content[1]);
                build.push("<script type='");
                build.push(type);
                build.push("'><![CDATA[");
                build.push(beaustring);
                build.push("]]></script>");
            }
            build.push("</body></html>");
            x.setAttribute("href", "data:text/prettydiff;charset=utf-8," + encodeURIComponent(build.join("")));
            x.onclick = null;
            x.click();
            x.onclick = function dom__save_rebind() {
                var that = this;
                pd.save(that);
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
            lastChild.setAttribute("onclick", "this.parentNode.removeChild(this)");
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
            pd.o.report.diff.body.innerHTML = "<p><strong>Error:</strong> Please try using the option labeled <em>Plain Text (diff only)</em>. <span style='display:block'>The input does not appear to be markup, CSS, or JavaScript.</span></p>";
            return;
        }
        if (x.innerHTML === "S") {
            if (bodyInner !== "") {
                if (top === pd.o.report.diff.box) {
                    pd.o.save.checked = true;
                    classQuote        = (bodyInner.indexOf("<div class='diff'") > -1) ? "<div class='diff'" : "<div class=\"diff\"";
                    content           = bodyInner.split(classQuote);
                    classQuote        = classQuote + content[1];
                    bodyInner         = content[0];
                    build.push(bodyInner);
                    build.push(" <p>This is the generated output. Please copy the text output, paste into a text file, and save as a &quot;.html&quot; file.</p> <textarea rows='40' cols='80' id='textreport'>");
                    build.push("&lt;?xml version='1.0' encoding='UTF-8' ?&gt;&lt;!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'&gt;&lt;html xmlns='http://www.w3.org/1999/xhtml' xml:lang='en'&gt;&lt;head&gt;&lt;title&gt;Pretty Diff - The difference tool&lt;/title&gt;&lt;meta name='robots' content='index, follow'/&gt; &lt;meta name='DC.title' content='Pretty Diff - The difference tool'/&gt; &lt;link rel='canonical' href='http://prettydiff.com/' type='application/xhtml+xml'/&gt;&lt;meta http-equiv='Content-Type' content='application/xhtml+xml;charset=UTF-8'/&gt;&lt;meta http-equiv='Content-Style-Type' content='text/css'/&gt;&lt;style type='text/css'&gt;" + pd.css.core + pd.css["s" + pd.color] + "&lt;/style&gt;&lt;/head&gt;&lt;body class='" + pd.color + "' id='webtool'&gt;&lt;h1&gt;&lt;a href='http://prettydiff.com/'&gt;Pretty Diff - The difference tool&lt;/a&gt;&lt;/h1&gt;&lt;div id='doc'&gt;");
                    build.push(bodyInner.replace(/\&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;"));
                    build.push("&lt;p&gt;Accessibility note. &amp;lt;em&amp;gt; tags in the output represent character differences per lines compared.&lt;/p&gt;&lt;/div&gt;");
                    build.push(classQuote.replace(/\&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;"));
                    if (inline === false) {
                        build.push("&lt;script type='");
                        build.push(type);
                        build.push("'&gt;&lt;![CDATA[");
                        build.push("var pd={};pd.colSliderProperties=[");
                        build.push(pd.colSliderProperties[0]);
                        build.push(",");
                        build.push(pd.colSliderProperties[1]);
                        build.push(",");
                        build.push(pd.colSliderProperties[2]);
                        build.push(",");
                        build.push(pd.colSliderProperties[3]);
                        build.push(",");
                        build.push(pd.colSliderProperties[4]);
                        build.push(diffstring);
                        build.push("]]&gt;&lt;/script&gt;");
                    }
                } else if (top === pd.o.report.beau.box) {
                    classQuote = (bodyInner.indexOf("<div class='beautify' id='pd-jsscope'>") > -1) ? "<div class='beautify' id='pd-jsscope'>" : "<div class=\"beautify\" id=\"pd-jsscope\">";
                    content    = bodyInner.split(classQuote);
                    classQuote = classQuote + content[1];
                    bodyInner  = content[0];
                    build.push(bodyInner);
                    build.push(" <p>This is the generated output. Please copy the text output, paste into a text file, and save as a &quot;.html&quot; file.</p> <textarea rows='40' cols='80' id='textreport'>");
                    build.push("&lt;?xml version='1.0' encoding='UTF-8' ?&gt;&lt;!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'&gt;&lt;html xmlns='http://www.w3.org/1999/xhtml' xml:lang='en'&gt;&lt;head&gt;&lt;title&gt;Pretty Diff - The difference tool&lt;/title&gt;&lt;meta name='robots' content='index, follow'/&gt; &lt;meta name='DC.title' content='Pretty Diff - The difference tool'/&gt; &lt;link rel='canonical' href='http://prettydiff.com/' type='application/xhtml+xml'/&gt;&lt;meta http-equiv='Content-Type' content='application/xhtml+xml;charset=UTF-8'/&gt;&lt;meta http-equiv='Content-Style-Type' content='text/css'/&gt;&lt;style type='text/css'&gt;" + pd.css.core + pd.css["s" + pd.color] + "&lt;/style&gt;&lt;/head&gt;&lt;body class='" + pd.color + "' id='webtool'&gt;&lt;h1&gt;&lt;a href='http://prettydiff.com/'&gt;Pretty Diff - The difference tool&lt;/a&gt;&lt;/h1&gt;&lt;div id='doc'&gt;");
                    build.push(bodyInner.replace(/\&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;"));
                    build.push("&lt;p&gt;Accessibility note. &amp;lt;em&amp;gt; tags in the output represent presentation for variable coloring and scope.&lt;/p&gt;&lt;/div&gt;");
                    build.push(classQuote.replace(/\&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;"));
                    build.push("&lt;script type='");
                    build.push(type);
                    build.push("'&gt;&lt;![CDATA[");
                    build.push(beaustring);
                    build.push("]]&gt;&lt;/script&gt;");
                }
                build.push("&lt;/body&gt;&lt;/html&gt;</textarea>");
            }
            x.innerHTML = "H";
            x.setAttribute("title", "Convert output to rendered HTML.");
        } else {
            classQuote = "<p>This is the generated output. Please copy the text output, paste into a text file, and save as a \".html\" file.</p>";
            if (bodyInner !== "") {
                bodyInner = bodyInner.replace(/ xmlns\="http:\/\/www\.w3\.org\/1999\/xhtml"/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
                content   = bodyInner.split(classQuote);
                build.push(content[0]);
                if (top === pd.o.report.diff.box) {
                    classQuote = (content[1].indexOf("<div class='diff'") > -1) ? "<div class='diff'" : "<div class=\"diff\"";
                    if (pd.colSliderProperties.length === 0 && x.innerHTML === "S" && inline === true) {
                        content                = pd.o.report.diff.body.getElementsByTagName("ol");
                        pd.colSliderProperties = [
                            content[0].clientWidth, content[1].clientWidth, content[2].parentNode.clientWidth, content[2].parentNode.parentNode.clientWidth, content[2].parentNode.offsetLeft - content[2].parentNode.parentNode.offsetLeft
                        ];
                    }
                } else if (top === pd.o.report.beau.box) {
                    classQuote = (content[1].indexOf("<div class='beautify' id='pd-jsscope'>") > -1) ? "<div class='beautify' id='pd-jsscope'>" : "<div class=\"beautify\" id=\"pd-jsscope\">";
                }
                content[1] = content[1].substring(content[1].indexOf(classQuote) + classQuote.length, content[1].length);
                if (content[1].indexOf("<script") > -1) {
                    content[1] = classQuote + (content[1].substring(0, content[1].indexOf("<script")));
                } else {
                    content[1] = classQuote + (content[1].substring(0, content[1].indexOf("</body")));
                }
                build.push(content[1]);
            }
            x.innerHTML = "S";
            x.setAttribute("title", "Convert report to text that can be saved.");
        }
        body.innerHTML = build.join("");
        pd.options(x.parentNode);
    };

    //basic drag and drop for the report windows
    pd.grab                = function dom__grab(e, x) {
        var box        = x.parentNode,
            parent     = box.getElementsByTagName("p")[0],
            save       = (parent.innerHTML.indexOf("save") > -1) ? true : false,
            minifyTest = (parent.style.display === "none") ? true : false,
            minButton  = (save === true) ? box.getElementsByTagName("button")[1] : box.getElementsByTagName("button")[0],
            body       = box.lastChild,
            heading    = box.firstChild,
            boxLeft    = box.offsetLeft,
            boxTop     = box.offsetTop,
            filled     = ((box === pd.o.report.diff.box && pd.test.filled.diff === true) || (box === pd.o.report.beau.box && pd.test.filled.beau === true) || (box === pd.o.report.minn.box && pd.test.filled.minn === true) || (box === pd.o.report.stat.box && pd.test.filled.stat === true)) ? true : false,
            drop       = function dom__grab_drop() {
                var innerHeight  = window.innerHeight,
                    headingWidth = box.getElementsByTagName("h3")[0].clientWidth;
                boxLeft              = box.offsetLeft;
                boxTop               = box.offsetTop;
                document.onmousemove = null;
                document.onmouseup   = null;
                if (boxTop < 10) {
                    box.style.top = "1em";
                }
                if (boxTop > (innerHeight - 40)) {
                    box.style.top = ((innerHeight - 40) / 10) + "em";
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
                box.style.right    = "auto";
                box.style.left     = ((boxLeft + (f.clientX - box.mouseX)) / 10) + "em";
                box.style.top      = ((boxTop + (f.clientY - box.mouseY)) / 10) + "em";
                document.onmouseup = drop;
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
            minButton.click(e);
            return false;
        }
        pd.top(box);
        e.preventDefault();
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
        body.style.opacity   = ".5";
        heading.style.top    = (box.clientHeight / 20) + "0em";
        box.style.height     = ".1em";
        box.mouseX           = e.clientX;
        box.mouseY           = e.clientY;
        document.onmousemove = boxmove;
        document.onmousedown = null;
        pd.options(box);
        return false;
    };

    //shows and hides the additional options
    pd.additional          = function dom__additional() {
        var x = this;
        if (pd.o.addOps === null) {
            return;
        }
        if (x === pd.o.addNo) {
            pd.o.addOps.style.display = "none";
        } else if (x === pd.o.addYes) {
            pd.o.addOps.style.display = "block";
        }
        pd.options(x);
    };

    //resizes the pretty diff comment onmouseover
    pd.comment             = function dom__comment(node, over) {
        var pageWidth  = Math.floor(pd.o.page.clientWidth / 13),
            textLength = 0;
        if (node === undefined || node.nodeName === undefined || node.nodeName.toLowerCase() !== "textarea") {
            over = false;
            node = pd.$$("option_comment");
            if (node === null) {
                return;
            }
        }
        if (over === true) {
            textLength              = node.value.length;
            node.style.height       = Math.ceil((textLength / 1.6) / pageWidth) + ".5em";
            node.style.marginBottom = "-" + Math.ceil((textLength / 1.6) / pageWidth) + ".5em";
            node.style.paddingTop   = "1em";
            node.style.position     = "relative";
            node.style.width        = (pageWidth - 4.7) + "em";
            node.style.zIndex       = "500";
        } else {
            node.style.height       = "2.5em";
            node.style.marginBottom = "-1.5em";
            node.style.paddingTop   = "0em";
            node.style.position     = "static";
            node.style.width        = "100%";
            node.style.zIndex       = "1";
        }
    };

    //toggle between tool modes and vertical/horizontal orientation of
    //textareas
    pd.prettyvis           = function dom__prettyvis(x) {
        var a           = (x.nodeType === 1) ? x : this,
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
            } else {
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
            pd.hideBeauOut();
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
        if (a === pd.o.displayWide) {
            if (pd.o.codeMinnIn !== null) {
                pd.o.codeMinnIn.removeAttribute("style");
            }
            if (pd.o.codeMinnOut !== null) {
                pd.o.codeMinnOut.removeAttribute("style");
            }
            if (pd.o.codeBeauIn !== null) {
                pd.o.codeBeauIn.removeAttribute("style");
            }
            if (pd.o.codeBeauOut !== null) {
                pd.o.codeBeauOut.removeAttribute("style");
            }
            if (pd.o.codeDiffNew !== null) {
                pd.o.codeDiffNew.removeAttribute("style");
            }
            if (pd.o.diffBase !== null) {
                pd.o.diffBase.setAttribute("class", "wide");
                pd.o.diffBase.style.height = "auto";
            }
            if (pd.o.diffNew !== null) {
                pd.o.diffNew.setAttribute("class", "wide");
                pd.o.diffNew.style.height = "auto";
            }
            if (pd.o.beau !== null) {
                pd.o.beau.setAttribute("class", "wide");
            }
            if (pd.o.minn !== null) {
                pd.o.minn.setAttribute("class", "wide");
            }
            pd.hideBeauOut();
        }
        if (a === pd.o.displayTall) {
            node = pd.$$("options");
            if (pd.o.codeMinnIn !== null) {
                pd.o.codeMinnIn.removeAttribute("style");
            }
            if (pd.o.codeMinnOut !== null) {
                pd.o.codeMinnOut.removeAttribute("style");
            }
            if (pd.o.codeBeauIn !== null) {
                pd.o.codeBeauIn.removeAttribute("style");
            }
            if (pd.o.codeBeauOut !== null) {
                pd.o.codeBeauOut.removeAttribute("style");
            }
            if (pd.o.codeBeauOut !== null) {
                pd.o.codeBeauOut.removeAttribute("style");
            }
            if (pd.o.codeDiffNew !== null) {
                pd.o.codeDiffNew.removeAttribute("style");
            }
            if (pd.o.diffBase !== null) {
                pd.o.diffBase.setAttribute("class", "difftall");
                if (node !== null) {
                    pd.o.diffBase.style.height = ((node.clientHeight / 12) + 6.5) + "em";
                }
            }
            if (pd.o.diffNew !== null) {
                pd.o.diffNew.setAttribute("class", "difftall");
                if (node !== null) {
                    pd.o.diffNew.style.height = ((node.clientHeight / 12) + 6.5) + "em";
                }
            }
            if (pd.o.beau !== null) {
                pd.o.beau.setAttribute("class", "tall");
            }
            if (pd.o.minn !== null) {
                pd.o.minn.setAttribute("class", "tall");
            }
            pd.hideBeauOut();
        }
        if (a.nodeType === undefined || (a === pd.o.displayWide && pd.o.displayWide.checked === false) || (a === pd.o.displayTall && pd.o.displayTall.checked === false)) {
            return;
        }
        pd.options(a);
    };

    //alters available options depending upon language selection
    pd.codeOps             = function dom__codeOps(node) {
        var x    = (node.nodeType === 1) ? node : this,
            lang = "",
            xml  = (x.getElementsByTagName("option")[x.selectedIndex].innerHTML === "XML" || x.getElementsByTagName("option")[x.selectedIndex].innerHTML === "JSTL") ? true : false,
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
        if (pd.o.addYes !== null && pd.o.addOps !== null && pd.o.addYes.checked === true) {
            pd.o.addOps.style.display = "block";
        }
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
                if (pd.o.addOps !== null && lang === "csv") {
                    pd.o.minnOps.style.display = "none";
                    pd.o.addOps.style.display  = "none";
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
            pd.hideBeauOut();
        }
        pd.options(x);
    };

    pd.hideBeauOut         = function dom__hideBeauOut() {
        var node    = {},
            wide    = pd.$$("diffwide"),
            state   = (pd.o.jsscope === null || pd.o.jsscope.checked === false) ? false : true,
            restore = function dom__hideBeauOut_restore() {
                pd.o.codeBeauOut.parentNode.style.display = "block";
                if (pd.o.codeBeauIn !== null) {
                    node = pd.o.codeBeauIn.parentNode;
                    if (node !== null) {
                        if (wide !== null && wide.checked === true) {
                            node.parentNode.setAttribute("class", "wide");
                        }
                        if (node.parentNode.getAttribute("class") === "tall") {
                            node.style.width = "49%";
                            if (pd.test.load === false && pd.test.cm === false && pd.o.maxInputs.innerHTML.replace(/\s+/g, "").toLowerCase() === "maximizeinputs") {
                                pd.o.codeBeauIn.style.height = "31.7em";
                            }
                        } else {
                            node.style.width             = "100%";
                            pd.o.codeBeauIn.style.height = "14.8em";
                        }
                    }
                    pd.o.codeBeauIn.onkeyup   = pd.recycle;
                    pd.o.codeBeauIn.onkeydown = function dom_hideBeauOut_bindBeauInDown(e) {
                        var event = e || window.event;
                        if (pd.test.cm === false) {
                            pd.fixtabs(event, pd.o.codeBeauIn);
                        }
                        pd.keydown(event);
                    };
                }
            };
        if (pd.o.codeBeauOut === null) {
            return;
        }
        if (pd.o.lang === null || pd.o.lang.value === "auto" || pd.o.lang.value === "javascript") {
            if (state === true) {
                pd.o.codeBeauOut.parentNode.style.display = "none";
                if (pd.o.codeBeauIn !== null) {
                    node             = pd.o.codeBeauIn.parentNode;
                    node.style.width = "100%";
                    if (pd.o.maxInputs.innerHTML.replace(/\s+/g, "").toLowerCase() === "maximizeinputs") {
                        pd.o.codeBeauIn.style.height = "31.7em";
                    }
                    if (pd.test.cm === true) {
                        pd.o.codeBeauIn.onkeyup = function dom__hideBeauOut_langkey() {
                            pd.langkey(pd.cm.beauIn);
                        };
                    }
                }
            } else {
                restore();
            }
        } else {
            restore();
        }
    };

    //provides interaction to simulate a text input into a radio button
    //set with appropriate accessibility response
    pd.indentchar          = function dom__indentchar() {
        var x         = this,
            beauChar  = pd.$$("beau-char"),
            diffChar  = pd.$$("diff-char"),
            beauOther = pd.$$("beau-other"),
            diffOther = pd.$$("diff-other");
        if (pd.mode === "beau" && x === beauChar && beauOther !== null && x === beauChar) {
            beauOther.checked = true;
        } else if (pd.mode === "diff" && x === diffChar && diffOther !== null && x === diffChar) {
            diffOther.checked = true;
        }
        if (beauChar !== null && pd.mode === "beau") {
            if (beauOther !== null && beauOther.checked === true) {
                beauChar.setAttribute("class", "checked");
                if (beauChar.value === "Click me for custom input") {
                    beauChar.value = "";
                }
            } else {
                beauChar.setAttribute("class", "unchecked");
                if (beauChar.value === "") {
                    beauChar.value = "Click me for custom input";
                }
            }
        }
        if (diffChar !== null && pd.mode === "diff") {
            if (diffOther !== null && diffOther.checked === true) {
                diffChar.setAttribute("class", "checked");
                if (diffChar.value === "Click me for custom input") {
                    diffChar.value = "";
                }
            } else {
                diffChar.setAttribute("class", "unchecked");
                if (diffChar.value === "") {
                    diffChar.value = "Click me for custom input";
                }
            }
        }
        if (x === diffChar && diffOther !== null) {
            pd.options(diffOther);
        }
        if (x === beauChar && beauOther !== null) {
            pd.options(beauOther);
        }
        if (pd.test.cm === true) {
            if (pd.mode === "diff") {
                if (x === pd.$$("diff-tab")) {
                    pd.cm.diffBase.setOption("indentWithTabs", true);
                    pd.cm.diffNew.setOption("indentWithTabs", true);
                } else {
                    pd.cm.diffBase.setOption("indentWithTabs", false);
                    pd.cm.diffNew.setOption("indentWithTabs", false);
                }
            }
            if (pd.mode === "beau") {
                if (x === pd.$$("beau-tab")) {
                    pd.cm.beauIn.setOption("indentWithTabs", true);
                    pd.cm.beauOut.setOption("indentWithTabs", true);
                } else {
                    pd.cm.beauIn.setOption("indentWithTabs", false);
                    pd.cm.beauOut.setOption("indentWithTabs", false);
                }
            }
            if (pd.mode === "minn") {
                if (x === pd.$$("minn-tab")) {
                    pd.cm.beauIn.setOption("indentWithTabs", true);
                    pd.cm.beauOut.setOption("indentWithTabs", true);
                } else {
                    pd.cm.beauIn.setOption("indentWithTabs", false);
                    pd.cm.beauOut.setOption("indentWithTabs", false);
                }
            }
        }
        pd.options(x);
    };

    //store tool changes into localStorage to maintain state
    pd.options             = function dom__options(x) {
        var item   = (x.nodeType === 1) ? x : this,
            node   = item.nodeName.toLowerCase(),
            name   = item.getAttribute("name"),
            type   = item.getAttribute("type"),
            id     = item.getAttribute("id"),
            classy = item.getAttribute("class"),
            h3     = {},
            body   = {};
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
        if (pd.test.json === true) {
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
                        "api.inchar", "\"\n\""
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
                        "api.inchar", "\"\t\""
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
                        "api.html", "html-no"
                    ];
                }
                if (id === "htmld-yes" || id === "html-yes" || id === "htmln-yes") {
                    data = [
                        "api.html", "html-yes"
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
                if (id === "jsinlevel") {
                    data = [
                        "api.inlevel", "\"" + item.value + "\""
                    ];
                }
                if (id === "jslinesd-no" || id === "jslines-no") {
                    data = [
                        "api.jslines", "false"
                    ];
                }
                if (id === "jslinesd-yes" || id === "jslines-yes") {
                    data = [
                        "api.jslines", "true"
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
                if (id === "topcoms") {
                    data = [
                        "api.topcoms", "true"
                    ];
                }
                if (id === "topcoms-no") {
                    data = [
                        "api.topcoms", "false"
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
                    pd.o.comment.innerHTML = "/*prettydiff.com " + pd.commentString[0] + " */";
                } else {
                    pd.o.comment.innerHTML = "/*prettydiff.com " + pd.commentString.join(", ") + " */";
                }
                if (pd.test.ls === true && pd.test.json === true) {
                    localStorage.commentString = JSON.stringify(pd.commentString);
                }
            }());
        }
    };

    //maximize textareas and hide options
    pd.hideOptions         = function dom__hideOptions() {
        var button = pd.$$("hideOptions"),
            node   = {},
            fgroup = pd.$$("functionGroup"),
            height = 0,
            text   = "";
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
            if (pd.o.report.diff.box !== null) {
                pd.o.report.diff.box.style.top = "-1000em";
            }
            if (pd.o.report.beau.box !== null) {
                pd.o.report.beau.box.style.top = "-1000em";
            }
            if (pd.o.report.minn.box !== null) {
                pd.o.report.minn.box.style.top = "-1000em";
            }
            if (pd.o.report.stat.box !== null) {
                pd.o.report.stat.box.style.top = "-1000em";
            }
            node = pd.$$("diffoutput");
            if (node !== null) {
                node.style.display = "none";
            }
            node = pd.$$("options");
            if (node !== null) {
                node.style.display = "none";
            }
            node = pd.$$("codeInput");
            if (node !== null) {
                node.style.marginLeft = "0em";
            }
            height = window.innerHeight;
            node   = pd.$$("displayOps");
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
            node = pd.$$("diffBase");
            if (node !== null) {
                node.style.marginTop = "-4em";
            }
            node = pd.$$("diffNew");
            if (node !== null) {
                node.style.marginTop = "-4em";
            }
            node = pd.$$("Beautify");
            if (node !== null) {
                node.style.marginTop = "-4em";
                height               += 40;
            }
            if (pd.o.codeBeauIn !== null) {
                pd.o.codeBeauIn.style.height       = ((height / 12) - 5.95) + "em";
                pd.o.codeBeauIn.style.marginBottom = "1em";
            }
            if (pd.o.codeBeauOut !== null) {
                pd.o.codeBeauOut.style.height       = ((height / 12) - 3.65) + "em";
                pd.o.codeBeauOut.style.marginBottom = "1em";
            }
            node = pd.$$("Minify");
            if (node !== null) {
                node.style.marginTop = "-4em";
                height               += 40;
            }
            if (pd.o.codeMinnIn !== null) {
                pd.o.codeMinnIn.style.height       = ((height / 12) - 9.3) + "em";
                pd.o.codeMinnIn.style.marginBottom = "1em";
            }
            if (pd.o.codeMinnOut !== null) {
                pd.o.codeMinnOut.style.height       = ((height / 12) - 7) + "em";
                pd.o.codeMinnOut.style.marginBottom = "1em";
            }
            node = pd.$$("codeInput");
            if (node !== null && fgroup !== null) {
                fgroup.parentNode.removeChild(fgroup);
                fgroup.setAttribute("class", "append");
                node.insertBefore(fgroup, node.firstChild);
            }
            node = button.parentNode;
            if (node.nodeName.toLowerCase() === "li") {
                node = node.parentNode;
            }
            node.style.position     = "relative";
            node.style.marginBottom = "0em";
            button.innerHTML        = "Show Options";
            button.setAttribute("title", "Click on this button to see additional options and settings.");
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
        if (pd.$$("codeInput") !== null && fgroup !== null) {
            node = pd.$$("language");
            fgroup.parentNode.removeChild(fgroup);
            fgroup.removeAttribute("class");
            if (node !== null) {
                node = node.parentNode;
                node.parentNode.insertBefore(fgroup, node);
            } else {
                node = pd.$$("difftall");
                if (node !== null) {
                    node = node.parentNode;
                    node.parentNode.insertBefore(fgroup, node);
                } else {
                    node = pd.$$("additional_yes");
                    node = node.parentNode;
                    node.parentNode.insertBefore(fgroup, node);
                }
            }
        }
        node = pd.$$("top");
        if (node !== null) {
            node.style.display = "block";
        }
        if (pd.o.report.diff.box !== null && pd.o.report.diff.box.offsetTop < 0) {
            pd.o.report.diff.box.style.top = "auto";
        }
        if (pd.o.report.beau.box !== null && pd.o.report.beau.box.offsetTop < 0) {
            pd.o.report.beau.box.style.top = "auto";
        }
        if (pd.o.report.minn.box !== null && pd.o.report.minn.box.offsetTop < 0) {
            pd.o.report.minn.box.style.top = "auto";
        }
        if (pd.o.report.stat.box !== null && pd.o.report.stat.box.offsetTop < 0) {
            pd.o.report.stat.box.style.top = "auto";
        }
        node = pd.$$("diffoutput");
        if (node !== null) {
            node.style.display = "block";
        }
        node = pd.$$("options");
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
        if (pd.o.displayWide !== null && pd.o.displayWide.checked === true) {
            pd.prettyvis(pd.o.displayWide);
        }
        button.setAttribute("title", "Clicking this button will visually hide everything except for textarea elements and one 'Execute' button.");
        pd.options(button);
        return false;
    };

    //reset tool to default configuration
    pd.reset               = function dom__reset() {
        delete localStorage.codeBeautify;
        delete localStorage.codeDiffBase;
        delete localStorage.codeDiffNew;
        delete localStorage.codeMinify;
        delete localStorage.commentString;
        delete localStorage.settings;
        delete localStorage.stat;
        pd.o.modeDiff.click();
        location.reload();
    };

    //alter tool on page load in reflection to saved state
    (function dom__load() {
        var a           = 0,
            inputs      = [],
            inputsLen   = 0,
            id          = "",
            name        = "",
            type        = "",
            node        = {},
            buttons     = {},
            title       = {},
            statdump    = [],
            langtest    = (pd.o.lang !== null && pd.o.lang.nodeName.toLowerCase() === "select") ? true : false,
            lang        = (pd.o.lang !== null) ? "auto" : ((langtest === true) ? pd.o.lang[pd.o.lang.selectedIndex].value : ((pd.o.lang === null) ? "text" : pd.o.lang.value)),
            hideBeauOut = function dom__load_hideBeauOut() {
                pd.hideBeauOut();
                pd.options(this);
            },
            thirdparty  = function dom__load_thirdparty() {
                var that = this,
                    href = that.getAttribute("href");
                window.open(href, 'thirdparty');
                return false;
            },
            resize      = function dom__load_resize(e) {
                var that = this;
                pd.resize(e, that);
            },
            save        = function dom__load_save() {
                var that = this;
                pd.save(that);
            },
            grab        = function dom__load_grab(e) {
                var that = this;
                pd.grab(e, that);
            },
            top         = function dom__load_top() {
                var that = this;
                pd.top(that.parentNode);
            },
            page        = (pd.o.page === null) ? "" : pd.o.page.getAttribute("id"),
            backspace   = function dom__load_backspace(event) {
                var aa = event || window.event,
                    bb = aa.srcElement || aa.target;
                if (aa.keyCode === 8) {
                    if (bb.nodeName === "textarea" || (bb.nodeName === "input" && (bb.getAttribute("type") === "text" || bb.getAttribute("type") === "password"))) {
                        return true;
                    }
                    return false;
                }
            };
        if (pd.o.announce !== null) {
            pd.o.announcetext = pd.o.announce.innerHTML;
        }
        if (page === "webtool") {
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
            document.onkeypress           = backspace;
            document.onkeydown            = backspace;
            pd.zIndex                     = 10;
            pd.mode                       = "diff";
            pd.settings                   = {};
            pd.settings.diffreport        = {};
            pd.settings.beaureport        = {};
            pd.settings.minnreport        = {};
            pd.settings.statreport        = {};
            pd.settings.diffreport.topmin = pd.o.report.diff.box.offsetTop;
            pd.settings.beaureport.topmin = pd.o.report.beau.box.offsetTop;
            pd.settings.minnreport.topmin = pd.o.report.minn.box.offsetTop;
            pd.settings.statreport.topmin = pd.o.report.stat.box.offsetTop;
            pd.keypress                   = {
                state   : false,
                keys    : [],
                date    : {},
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
                delete localStorage.bl;
                delete localStorage.nl;
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
                    statdump       = localStorage.statdata.split("|");
                    pd.stat.visit  = statdump[0];
                    pd.stat.usage  = statdump[1];
                    pd.stat.fdate  = statdump[2];
                    pd.stat.diff   = statdump[4];
                    pd.stat.beau   = statdump[5];
                    pd.stat.minn   = statdump[6];
                    pd.stat.markup = statdump[7];
                    pd.stat.js     = statdump[8];
                    pd.stat.css    = statdump[9];
                    pd.stat.csv    = statdump[10];
                    pd.stat.text   = statdump[11];
                    if (statdump[12] === "NaN") {
                        pd.stat.large = statdump[13];
                    } else if (isNaN(statdump[12]) === false) {
                        pd.stat.large = statdump[12];
                    }
                    pd.stat.visit = Number(pd.stat.visit) + 1;
                    if (pd.stat.fdate === "") {
                        pd.stat.fdate = new Date().toLocaleDateString();
                    }
                    pd.stat.avdate = (((Date.now() - Date.parse(statdump[2])) / 86400000) / Number(statdump[0])).toFixed(2);
                }
                if (pd.test.json === true) {
                    if (localStorage.commentString !== undefined) {
                        pd.commentString = JSON.parse(localStorage.commentString);
                    }
                    if (localStorage.settings !== undefined) {
                        pd.settings = JSON.parse(localStorage.settings);
                    }
                    if (localStorage.stat !== undefined) {
                        if (statdump.length === 0) {
                            pd.stat       = JSON.parse(localStorage.stat);
                            pd.stat.visit = Number(pd.stat.visit) + 1;
                            if (pd.stat.fdate === "") {
                                pd.stat.fdate = new Date().toLocaleDateString();
                            }
                            pd.stat.avdate = (((Date.now() - Date.parse(pd.stat.fdate)) / 86400000) / Number(statdump[0])).toFixed(2);
                        }
                        node = pd.$$("stvisit");
                        if (node !== null) {
                            node.innerHTML = pd.stat.visit;
                        }
                        node = pd.$$("stusage");
                        if (node !== null) {
                            node.innerHTML = pd.stat.usage;
                        }
                        node = pd.$$("stfdate");
                        if (node !== null) {
                            node.innerHTML = pd.stat.fdate;
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
                pd.o.codeBeauIn.onkeyup   = function dom__load_bindBeauInUp(e) {
                    var event = e || window.event;
                    pd.recycle(event);
                };
                pd.o.codeBeauIn.onkeydown = function dom__load_bindBeauInDown(e) {
                    var event = e || window.event;
                    if (pd.test.cm === false) {
                        pd.fixtabs(event, pd.o.codeBeauIn);
                    }
                    pd.keydown(event);
                };
            }
            if (pd.o.codeMinnIn !== null) {
                pd.o.codeMinnIn.onkeyup   = function dom__load_bindMinnInUp(e) {
                    var event = e || window.event;
                    pd.recycle(event);
                };
                pd.o.codeMinnIn.onkeydown = function dom__load_bindMinnInDown(e) {
                    var event = e || window.event;
                    if (pd.test.cm === false) {
                        pd.fixtabs(event, pd.o.codeMinnIn);
                    }
                    pd.keydown(event);
                };
            }
            if (pd.o.codeDiffBase !== null) {
                if (pd.test.cm === true) {
                    pd.o.codeDiffBase.onkeyup = function dom__load_bindAutoDiffBase() {
                        pd.langkey(pd.cm.diffBase);
                    };
                } else {
                    pd.o.codeDiffBase.onkeydown = pd.fixtabs;
                }
            }
            if (pd.o.codeDiffNew !== null) {
                if (pd.test.cm === true) {
                    pd.o.codeDiffNew.onkeyup = function dom__load_bindAutoDiffNew() {
                        pd.langkey(pd.cm.diffNew);
                    };
                } else {
                    pd.o.codeDiffNew.onkeydown = pd.fixtabs;
                }
            }
            if (pd.o.report.diff.box !== null) {
                if (pd.test.fs === true) {
                    pd.o.report.diff.box.ondragover  = pd.filenull;
                    pd.o.report.diff.box.ondragleave = pd.filenull;
                    pd.o.report.diff.box.ondrop      = pd.filedrop;
                }
                pd.o.report.diff.body.onclick = top;
                title                         = pd.o.report.diff.box.getElementsByTagName("h3")[0];
                title.onmousedown             = grab;
                if (pd.settings.diffreport.min === false) {
                    buttons               = pd.o.report.diff.box.getElementsByTagName("p")[0];
                    buttons.style.display = "block";
                    title.style.cursor    = "move";
                    if (buttons.innerHTML.indexOf("save") > 0) {
                        buttons.getElementsByTagName("button")[1].innerHTML = "\u035f";
                        title.style.width                                   = ((pd.settings.diffreport.width / 10) - 9.75) + "em";
                    } else {
                        buttons.getElementsByTagName("button")[0].innerHTML = "\u035f";
                        title.style.width                                   = ((pd.settings.diffreport.width / 10) - 6.75) + "em";
                    }
                    if (pd.settings.diffreport.top < 15) {
                        pd.settings.diffreport.top = 15;
                    }
                    pd.o.report.diff.box.style.right    = "auto";
                    pd.o.report.diff.box.style.left     = (pd.settings.diffreport.left / 10) + "em";
                    pd.o.report.diff.box.style.top      = (pd.settings.diffreport.top / 10) + "em";
                    pd.o.report.diff.body.style.width   = (pd.settings.diffreport.width / 10) + "em";
                    pd.o.report.diff.body.style.height  = (pd.settings.diffreport.height / 10) + "em";
                    pd.o.report.diff.body.style.display = "block";
                }
            }
            if (pd.o.report.beau.box !== null) {
                if (pd.test.fs === true) {
                    pd.o.report.beau.box.ondragover  = pd.filenull;
                    pd.o.report.beau.box.ondragleave = pd.filenull;
                    pd.o.report.beau.box.ondrop      = pd.filedrop;
                }
                pd.o.report.beau.body.onclick = top;
                title                         = pd.o.report.beau.box.getElementsByTagName("h3")[0];
                title.onmousedown             = grab;
                buttons                       = pd.o.report.beau.box.getElementsByTagName("p")[0];
                node                          = pd.$$("jsscope-yes");
                if (node !== null && node.checked === true) {
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
                if (pd.settings.beaureport.min === false) {
                    buttons.style.display = "block";
                    title.style.cursor    = "move";
                    if (buttons.innerHTML.indexOf("save") > 0) {
                        buttons.getElementsByTagName("button")[1].innerHTML = "\u035f";
                        title.style.width                                   = ((pd.settings.beaureport.width / 10) - 9.75) + "em";
                    } else {
                        buttons.getElementsByTagName("button")[0].innerHTML = "\u035f";
                        title.style.width                                   = ((pd.settings.beaureport.width / 10) - 6.75) + "em";
                    }
                    if (pd.settings.beaureport.top < 15) {
                        pd.settings.beaureport.top = 15;
                    }
                    pd.o.report.beau.box.style.right    = "auto";
                    pd.o.report.beau.box.style.left     = (pd.settings.beaureport.left / 10) + "em";
                    pd.o.report.beau.box.style.top      = (pd.settings.beaureport.top / 10) + "em";
                    pd.o.report.beau.body.style.width   = (pd.settings.beaureport.width / 10) + "em";
                    pd.o.report.beau.body.style.height  = (pd.settings.beaureport.height / 10) + "em";
                    pd.o.report.beau.body.style.display = "block";
                }
            }
            if (pd.o.report.minn.box !== null) {
                if (pd.test.fs === true) {
                    pd.o.report.minn.box.ondragover  = pd.filenull;
                    pd.o.report.minn.box.ondragleave = pd.filenull;
                    pd.o.report.minn.box.ondrop      = pd.filedrop;
                }
                pd.o.report.minn.body.onclick = top;
                title                         = pd.o.report.minn.box.getElementsByTagName("h3")[0];
                title.onmousedown             = grab;
                if (pd.settings.minnreport.min === false) {
                    buttons               = pd.o.report.minn.box.getElementsByTagName("p")[0];
                    buttons.style.display = "block";
                    title.style.cursor    = "move";
                    if (buttons.innerHTML.indexOf("save") > 0) {
                        buttons.getElementsByTagName("button")[1].innerHTML = "\u035f";
                        title.style.width                                   = ((pd.settings.minnreport.width / 10) - 9.75) + "em";
                    } else {
                        buttons.getElementsByTagName("button")[0].innerHTML = "\u035f";
                        title.style.width                                   = ((pd.settings.minnreport.width / 10) - 6.75) + "em";
                    }
                    if (pd.settings.minnreport.top < 15) {
                        pd.settings.minnreport.top = 15;
                    }
                    pd.o.report.minn.box.style.right    = "auto";
                    pd.o.report.minn.box.style.left     = (pd.settings.minnreport.left / 10) + "em";
                    pd.o.report.minn.box.style.top      = (pd.settings.minnreport.top / 10) + "em";
                    pd.o.report.minn.body.style.width   = (pd.settings.minnreport.width / 10) + "em";
                    pd.o.report.minn.body.style.height  = (pd.settings.minnreport.height / 10) + "em";
                    pd.o.report.minn.body.style.display = "block";
                }
            }
            if (pd.o.report.stat.box !== null) {
                if (pd.test.fs === true) {
                    pd.o.report.stat.box.ondragover  = pd.filenull;
                    pd.o.report.stat.box.ondragleave = pd.filenull;
                    pd.o.report.stat.box.ondrop      = pd.filedrop;
                }
                pd.o.report.stat.body.onclick = top;
                title                         = pd.o.report.stat.box.getElementsByTagName("h3")[0];
                title.onmousedown             = grab;
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
                    if (name === "mode" || name === "diffdisplay") {
                        inputs[a].onclick = pd.prettyvis;
                        if (id === "modediff" && id.checked === false && pd.settings.mode === undefined) {
                            inputs[a].click();
                        }
                    } else if (name === "additional") {
                        inputs[a].onclick = pd.additional;
                    } else if (name === "diffchar" || name === "beauchar" || name === "minnchar") {
                        inputs[a].onclick = pd.indentchar;
                    } else if (name === "jsscope") {
                        inputs[a].onclick = hideBeauOut;
                        if (id === "jsscope-yes" && inputs[a].checked === true) {
                            inputs[a].click();
                        }
                    } else {
                        inputs[a].onclick = pd.options;
                    }
                    if (id === pd.settings[name]) {
                        inputs[a].checked = true;
                        if (id === "diff-other" && pd.$$("diff-char") !== null) {
                            pd.$$("diff-char").click();
                        } else if (id === "beau-other" && pd.$$("beau-char") !== null) {
                            pd.$$("beau-char").click();
                        } else {
                            inputs[a].click();
                        }
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
                }
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
                    if (pd.settings[inputs[a].parentNode.parentNode.getAttribute("id")].max === true) {
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
                if (id !== null && pd.settings[id] !== undefined && pd.settings[id] !== inputs[a].innerHTML.replace(/\s+/g, " ")) {
                    inputs[a].click();
                }
            }
            inputs    = pd.$$("thirdparties").getElementsByTagName("a");
            inputsLen = inputs.length;
            for (a = 0; a < inputsLen; a += 1) {
                inputs[a].onclick = thirdparty;
            }
            //webkit users get sucky textareas, because they refuse to
            //accept bugs related to long scrolling errors
            node = pd.$$("update");
            if (node !== null && edition !== undefined) {
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
                    return "Updated: " + list[2] + " " + month[list[1]] + " 20" + list[0];
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
                pd.o.comment.onmouseover = function dom__load_commentOver() {
                    pd.comment(pd.o.comment, true);
                };
                pd.o.comment.onmouseout  = function dom__load_commentOut() {
                    pd.comment(pd.o.comment, false);
                };
            }
            node = pd.$$("button-primary");
            if (node !== null) {
                node.onmouseover = pd.comment;
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
                                pd.o.modeBeau.click();
                            } else if (value === "minify" && pd.o.modeMinn !== null) {
                                pd.o.modeMinn.click();
                            } else if (value === "diff" && pd.o.modeDiff !== null) {
                                pd.o.modeDiff.click();
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
                                    pd.o.modeDiff.click();
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
                                pd.o.jsscope.click();
                            }
                        } else if (params[b].indexOf("jscorrect") === 0) {
                            node = pd.$$("jscorrect-yes");
                            if (node !== null) {
                                node.checked = true;
                            }
                        } else if (params[b].indexOf("html") === 0) {
                            node = pd.$$("html-yes");
                            if (node !== null) {
                                node.click();
                            }
                            node = pd.$$("htmld-yes");
                            if (node !== null) {
                                node.click();
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
                }
                componentArea = pd.$$("components");
                if (componentArea !== null) {
                    componentArea = componentArea.getElementsByTagName("tbody")[0];
                    row           = componentArea.getElementsByTagName("tr");
                    rowLen        = row.length;
                    for (b = 0; b < rowLen; b += 1) {
                        dateCell = row[b].getElementsByTagName("td")[3];
                        switch (row[b].getElementsByTagName("a")[0].innerHTML) {
                        case "charDecoder.js":
                            date               = edition.charDecoder;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                            break;
                        case "csspretty.js":
                            date               = edition.csspretty;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                            break;
                        case "csvbeauty.js":
                            date               = edition.csvbeauty;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                            break;
                        case "csvmin.js":
                            date               = edition.csvmin;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                            break;
                        case "diffview.css":
                            date               = edition.css;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                            break;
                        case "diffview.js":
                            date               = edition.diffview;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                            break;
                        case "documentation.xhtml":
                            date               = edition.documentation;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                            break;
                        case "dom.js":
                            date               = edition.api.dom;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                            break;
                        case "jspretty.js":
                            date               = edition.jspretty;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                            break;
                        case "markup_beauty.js":
                            date               = edition.markup_beauty;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                            break;
                        case "markupmin.js":
                            date               = edition.markupmin;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                            break;
                        case "node-local.js":
                            date               = edition.api.nodeLocal;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                            break;
                        case "node-service.js":
                            date               = edition.api.nodeService;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                            break;
                        case "prettydiff.com.xhtml":
                            date               = edition.webtool;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                            break;
                        case "prettydiff.js":
                            date               = edition.prettydiff;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                            break;
                        case "prettydiff.wsf":
                            date               = edition.api.wsh;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                            break;
                        case "codemirror.css":
                            date               = edition.addon.cmcss;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                            break;
                        case "codemirror.js":
                            date               = edition.addon.cmjs;
                            dateCell.innerHTML = conversion(date);
                            dateList.push([
                                date, row[b].innerHTML
                            ]);
                            break;
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
            }());
        }
        pd.test.load = false;
    }());
}());
if ((/^(file:\/\/)/).test(location.href) === false) {
    _gaq.push([
        "_setAccount", "UA-27834630-1"
    ]);
    _gaq.push(["_trackPageview"]);
    if (pd.bounce === true) {
        pd.o.page.onclick = function ga__click() {
            "use strict";
            _gaq.push([
                "_trackEvent", "Logging", "NoBounce", "NoBounce", null, false
            ]);
        };
        pd.bounce         = false;
    }
    (function ga__init() {
        "use strict";
        var ga = document.createElement("script"),
            s  = document.getElementsByTagName("script")[0];
        ga.setAttribute("type", s.getAttribute("type"));
        ga.setAttribute("async", true);
        ga.setAttribute("src", ("https:" === document.location.protocol ? "https://ssl" : "http://www") + ".google-analytics.com/ga.js");
        s.parentNode.insertBefore(ga, s);
        window.onerror = function ga__onerror(message, file, line) {
            var mode              = (function ga__onerror_mode() {
                    if (pd.$$("modebeautify").checked) {
                        return "beautify";
                    }
                    if (pd.$$("modeminify").checked) {
                        return "minify";
                    }
                    return "diff";
                }()),
                sFormattedMessage = "";
            if (message === "prettydiff is not defined" && pd.test.ls === true) {
                if (mode === "minify") {
                    localStorage.setItem("mi", "");
                } else if (mode === "beautify") {
                    localStorage.setItem("bi", "");
                } else {
                    localStorage.setItem("bo", "");
                    localStorage.setItem("nx", "");
                }
            }
            if (line > 0) {
                sFormattedMessage = "[" + file + " (" + line + ")] " + message + " " + mode + " " + pd.o.lang[pd.o.lang.selectedIndex].value;
                _gaq.push([
                    "_trackEvent", "Exceptions", "Application", sFormattedMessage, null, true
                ]);
            }
        };
    }());
}