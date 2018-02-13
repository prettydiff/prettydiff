/*prettydiff.com topcoms: true, inchar: " ", insize: 4, vertical: true */
/*global ace, ArrayBuffer, AudioContext, console, document, FileReader, global, localStorage, location, navigator, setTimeout, Uint8Array, window, XMLHttpRequest*/
/*jshint laxbreak: true*/
/*jslint for: true*/
/***********************************************************************
 This is written by Austin Cheney on 3 Mar 2009.

 Please see the license.txt file associated with the Pretty Diff
 application for license information.
 ***********************************************************************/

(function dom_init():void {
    "use strict";
    const prettydiff:prettydiff = global.prettydiff,
        meta:meta = {
            error: "",
            lang: ["", "", ""],
            time: "",
            insize: 0,
            outsize: 0,
            difftotal: 0,
            difflines: 0
        },
        pd:dom       = {
            data: {
                announcetext : "",
                audio        : {},
                builder      : {},
                color        : "white", //for use with HTML themes
                commentString: [],
                diff         : "",
                html         : [],
                langvalue    : [],
                mode         : "diff",
                node: {},
                settings     : {},
                source       : "",
                sourceLength : 0,
                stat         : {
                    avday : 1,
                    anal  : 0,
                    beau  : 0,
                    css   : 0,
                    csv   : 0,
                    diff  : 0,
                    fdate : 0,
                    js    : 0,
                    large : 0,
                    markup: 0,
                    minn  : 0,
                    pars  : 0,
                    pdate : "",
                    text  : 0,
                    usage : 0,
                    useday: 0,
                    visit : 0
                },
                tabtrue      : false,
                zIndex       : 10
            },
            id: function dom_id(x):any {
                if (document.getElementById === undefined) {
                    return;
                }
                return document.getElementById(x);
            },
            // start option defaults
            options: {
                lang: "",
                lexer: "",
                source: ""
            },
            // end option defaults
            test: {
                // accessibility analysis is locked behind a flag, this param will bypass the
                // flag
                accessibility : (location.href.toLowerCase().indexOf("accessibility=true") > 0),
                //delect if Ace Code Editor is supported
                ace           : (location.href.toLowerCase().indexOf("ace=false") < 0 && typeof ace === "object"),
                //get the lowercase useragent string
                agent         : (typeof navigator === "object")
                    ? navigator
                        .userAgent
                        .toLowerCase()
                    : "",
                //test for standard web audio support
                audio         : ((typeof AudioContext === "function" || typeof AudioContext === "object") && AudioContext !== null)
                    ? new AudioContext()
                    : null,
                //delays the toggling of pd.test.load to false for asynchronous code sources
                delayExecution: false,
                //am I served from the Pretty Diff domain
                domain        : (location.href.indexOf("prettydiff.com") < 15 && location.href.indexOf("prettydiff.com") > -1),
                //If the output is too large the report must open and minimize in a single step
                filled        : {
                    code: false,
                    feed: false,
                    stat: false
                },
                //test for support of the file api
                fs            : (typeof FileReader === "function"),
                // stores keypress state to avoid execution of pd.event.recycle from certain key
                // combinations
                keypress      : false,
                keysequence   : [],
                // supplement to ensure keypress is returned to false only after other keys
                // other than ctrl are released
                keystore      : [],
                //some operations should not occur as the page is initially loading
                load          : true,
                //supplies alternate keyboard navigation to editable text areas
                tabesc        : []
            }
        },
        load                = function dom_load():void {
            let a:number               = 0,
                x:HTMLInputElement,
                inputs:NodeListOf<HTMLInputElement>,
                selects:NodeListOf<HTMLSelectElement>,
                buttons:NodeListOf<HTMLButtonElement>,
                inputsLen:number       = 0,
                id:string              = "",
                name:string            = "",
                type:string            = "",
                node:HTMLFormElement,
                button:HTMLButtonElement,
                buttonGroup:HTMLElement,
                title:HTMLElement,
                parent:HTMLElement,
                statdump:number[]        = [];
            const page:string            = (pd.data.node.page === null || pd.data.node.page === undefined || pd.data.node.page.getAttribute("id") === null)
                ? ""
                : pd
                    .data
                    .node
                    .page
                    .getAttribute("id"),
                top             = function dom_load_top(el:Element):void {
                    pd
                        .app
                        .zTop(el.parentNode);
                },
                backspace       = function dom_load_backspace(event:KeyboardEvent):boolean {
                    const bb:Element = event.srcElement || <Element>event.target;
                    if (event.keyCode === 8) {
                        if (bb.nodeName === "textarea" || (bb.nodeName === "input" && (bb.getAttribute("type") === "text" || bb.getAttribute("type") === "password"))) {
                            return true;
                        }
                        return false;
                    }
                    if (event.type === "keydown") {
                        pd
                            .event
                            .sequence(event);
                    }
                    return true;
                },
                textareafocus   = function dom_load_textareafocus(el:Element):void {
                    const tabkey = pd.id("textareaTabKey"),
                        aria   = pd.id("arialive");
                    if (tabkey === null) {
                        return;
                    }
                    tabkey.style.zIndex = pd.data.zIndex + 10;
                    if (aria !== null) {
                        aria.innerHTML = tabkey.innerHTML;
                    }
                    if (pd.data.mode === "diff") {
                        tabkey.style.right = "51%";
                        tabkey.style.left  = "auto";
                    } else {
                        tabkey.style.left  = "51%";
                        tabkey.style.right = "auto";
                    }
                    tabkey.style.display = "block";
                    if (pd.test.ace === true) {
                        let item = <HTMLElement>el.parentNode;
                        item.setAttribute("class", item.getAttribute("class") + " filefocus");
                    }
                },
                textareablur    = function dom_load_textareablur(el:Element):void {
                    const tabkey = pd.id("textareaTabKey");
                    if (tabkey === null) {
                        return;
                    }
                    tabkey.style.display = "none";
                    if (pd.test.ace === true) {
                        const item = <HTMLElement>el.parentNode;
                        item.setAttribute("class", item.getAttribute("class").replace(" filefocus", ""));
                    }
                },
                optionswrapper  = function dom_load_optionswrapper(el:HTMLElement, event:string):void {
                    el[event] = pd.app.options(el);
                },
                savecheck       = function dom_load_savecheck(el:HTMLInputElement):void {
                    let button:HTMLElement;
                    if (pd.data.node.report.code.box === null) {
                        return;
                    }
                    button = pd
                        .data
                        .node
                        .report
                        .code
                        .box
                        .getElementsByTagName("button")[0];
                    if (button.getAttribute("class") !== "save") {
                        return;
                    }
                    if (el.checked === true) {
                        button.innerHTML = "H";
                    } else {
                        button.innerHTML = "S";
                    }
                };
            if (page === "webtool") {
                {
                    const ann         = document.getElementById("headline").getElementsByTagName("p")[0],
                        x           = Math.random(),
                        circulation = [
                            "Looking for a JavaScript developer? Email me at <a href=\"mailto:info@prettydiff.com\">info@prettydiff.com</a>.",
                            "<a href=\"license.txt\">License</a> change and new <a href=\"guide/unrelated_diff.xhtml\">diff algorithm</a> with version <a href=\"https://github.com/prettydiff/prettydiff/releases/tag/2.1.17\">2.1.17</a>.",
                            "Version 2.2.0 brings complete biddle integration, <a href=\"https://asciinema.org/a/118428\">watch the video</a>."
                        ];
                    ann.innerHTML = circulation[Math.floor(x * circulation.length)];
                }
                pd.data.node.report.feed.body = (pd.data.node.report.feed.box === null)
                    ? null
                    : pd
                        .data
                        .node
                        .report
                        .feed
                        .box
                        .getElementsByTagName("div")[0];
                pd.data.node.report.code.body = (pd.data.node.report.code.box === null)
                    ? null
                    : pd
                        .data
                        .node
                        .report
                        .code
                        .box
                        .getElementsByTagName("div")[0];
                pd.data.node.report.stat.body = (pd.data.node.report.stat.box === null)
                    ? null
                    : pd
                        .data
                        .node
                        .report
                        .stat
                        .box
                        .getElementsByTagName("div")[0];

                if (pd.test.ace === true) {
                    if (pd.data.node.codeIn !== null) {
                        pd.ace.codeIn = pd
                            .app
                            .aceApply("codeIn", true);
                    }
                    if (pd.data.node.codeOut !== null) {
                        pd.ace.codeOut = pd
                            .app
                            .aceApply("codeOut", true);
                    }
                }

                pd
                    .app
                    .fixHeight();
                if (location.href.indexOf("ignore") > 0 && pd.id("headline") !== null) {
                    pd.id("headline").innerHTML = "<h2>BETA TEST SITE.</h2> <p>Official Pretty Diff is at <a href=\"http://prettydiff.com/\">http://prettydiff.com/</a></p> <span class=\"clear\"></span>";
                }
                if (pd.data.node.announce !== null) {
                    pd.data.announcetext = pd.data.node.announce.innerHTML;
                }
                node = pd.id("hideOptions");
                if (pd.id("option_commentClear") !== null) {
                    pd
                        .id("option_commentClear")
                        .onclick = pd.event.clearComment;
                }
                pd.data.settings.feedreport       = {};
                pd.data.settings.codereport       = {};
                pd.data.settings.statreport       = {};
                pd.data.settings.feedback         = {};
                pd.data.settings.feedback.newb    = false;
                pd.data.settings.feedback.veteran = false;
                pd.data.settings.knownname        = "\"" + Math
                    .random()
                    .toString()
                    .slice(2) + Math
                    .random()
                    .toString()
                    .slice(2) + "\"";
                pd.keypress                       = {
                    date    : {},
                    keys    : [],
                    state   : false,
                    throttle: 0
                };
                if (pd.test.fs === false) {
                    node = pd.id("diffbasefile");
                    if (node !== null) {
                        node.disabled = true;
                    }
                    node = pd.id("diffnewfile");
                    if (node !== null) {
                        node.disabled = true;
                    }
                    node = pd.id("beautyfile");
                    if (node !== null) {
                        node.disabled = true;
                    }
                    node = pd.id("minifyfile");
                    if (node !== null) {
                        node.disabled = true;
                    }
                    node = pd.id("parsefile");
                    if (node !== null) {
                        node.disabled = true;
                    }
                    node = pd.id("analysisfile");
                    if (node !== null) {
                        node.disabled = true;
                    }
                }
                if (pd.data.stat.fdate === 0) {
                    pd.data.stat.fdate = Date.now();
                }
                if (localStorage.commentString !== undefined && localStorage.commentString !== null && localStorage.commentString !== "") {
                    pd.data.commentString = JSON.parse(localStorage.commentString.replace(/api\./g, ""));
                }
                if (localStorage.settings !== undefined && localStorage.settings !== null) {
                    if (localStorage.settings.indexOf(":undefined") > 0) {
                        localStorage.settings = localStorage
                            .settings
                            .replace(/:undefined/g, ":false");
                    }
                    pd.data.settings = JSON.parse(localStorage.settings);
                    if (pd.data.settings.knownname === undefined || typeof pd.data.settings.knownname === "number") {
                        pd.data.settings.knownname = "\"" + Math
                            .random()
                            .toString()
                            .slice(2) + Math
                            .random()
                            .toString()
                            .slice(2) + "\"";
                        localStorage.settings      = JSON.stringify(pd.data.settings);
                    }
                    if (pd.data.settings.diffreport !== undefined) {
                        pd.data.settings.feedreport = {};
                        pd.data.settings.codereport = {};
                    }
                } else if (pd.data.settings.knownname === undefined || typeof pd.data.settings.knownname === "number") {
                    pd.data.settings.knownname = "\"" + Math
                        .random()
                        .toString()
                        .slice(2) + Math
                        .random()
                        .toString()
                        .slice(2) + "\"";
                    localStorage.settings      = JSON.stringify(pd.data.settings);
                }
                if (localStorage.stat !== undefined) {
                    if (statdump.length === 0) {
                        pd.data.stat       = JSON.parse(localStorage.stat);
                        pd.data.stat.visit = Number(pd.data.stat.visit) + 1;
                        if (typeof pd.data.stat.fdate === "string") {
                            pd.data.stat.fdate = Date.parse(pd.data.stat.fdate);
                        }
                        if (pd.data.stat.fdate === 0 || pd.data.stat.fdate === null || isNaN(pd.data.stat.fdate) === true) {
                            pd.data.stat.fdate = Date.now();
                        }
                        a = (Date.now() - pd.data.stat.fdate) / 86400000;
                        if (a < 1) {
                            a = 1;
                        }
                        pd.data.stat.avday  = Math.round(pd.data.stat.visit / a);
                        pd.data.stat.useday = Math.round(pd.data.stat.usage / a);
                    }
                    node = pd.id("stvisit");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.visit;
                    }
                    node = pd.id("stusage");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.usage;
                    }
                    node = pd.id("stuseday");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.useday;
                    }
                    node = pd.id("stfdate");
                    if (node !== null) {
                        node.innerHTML = new Date(pd.data.stat.fdate).toLocaleDateString();
                    }
                    node = pd.id("stavday");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.avday;
                    }
                    node = pd.id("stlarge");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.large;
                    }
                    node = pd.id("stdiff");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.diff;
                    }
                    node = pd.id("stbeau");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.beau;
                    }
                    node = pd.id("stminn");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.minn;
                    }
                    node = pd.id("stpars");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.pars;
                    }
                    node = pd.id("stanal");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.anal;
                    }
                    node = pd.id("stmarkup");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.markup;
                    }
                    node = pd.id("stjs");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.js;
                    }
                    node = pd.id("stcss");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.css;
                    }
                    node = pd.id("stcsv");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.csv;
                    }
                    node = pd.id("sttext");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.text;
                    }
                }
                localStorage.stat = JSON.stringify(pd.data.stat);
                if (statdump.length > 0) {
                    delete localStorage.statdata;
                }
                if (pd.test.agent.indexOf("webkit") > 0 || pd.test.agent.indexOf("blink") > 0) {
                    const textarea:NodeListOf<HTMLTextAreaElement> = document.getElementsByTagName("textarea"),
                        talen:number = textarea.length;
                    let a:number = 0;
                    if (talen > 0) {
                        do {
                            textarea[a].removeAttribute("wrap");
                            a = a + 1;
                        } while (a < talen);
                    }
                }
                if (pd.test.domain === false) {
                    pd.data.node.report.feed.box.style.display = "none";
                } else if (pd.data.node.report.feed.box !== null) {
                    if (pd.test.fs === true) {
                        pd.data.node.report.feed.box.ondragover  = pd.event.filenull;
                        pd.data.node.report.feed.box.ondragleave = pd.event.filenull;
                        pd.data.node.report.feed.box.ondrop      = pd.event.filedrop;
                    }
                    pd.data.node.report.feed.body.onmousedown = function dom_load_feedTop():void {
                        top(pd.data.node.report.feed.body);
                    };
                    title                                     = pd
                        .data
                        .node
                        .report
                        .feed
                        .box
                        .getElementsByTagName("h3")[0]
                        .getElementsByTagName("button")[0];
                    parent = <HTMLElement>title.parentNode;
                    title.onmousedown                         = pd.event.grab;
                    title.ontouchstart                        = pd.event.grab;
                    title.onfocus                             = pd.event.minimize;
                    title.onblur                              = function dom_load_titleFeedBlur():void {
                        title.onclick = null;
                    };
                    if (pd.data.settings.feedreport === undefined) {
                        pd.data.settings.feedreport = {};
                    }
                    if (pd.data.settings.feedreport !== undefined && pd.data.settings.feedreport.min === false) {
                        buttonGroup               = pd
                            .data
                            .node
                            .report
                            .feed
                            .box
                            .getElementsByTagName("p")[0];
                        buttonGroup.style.display = "block";
                        title.style.cursor    = "move";
                        if (buttonGroup.innerHTML.indexOf("save") > 0) {
                            buttonGroup.getElementsByTagName("button")[1].innerHTML = "\u035f";
                            if (pd.test.agent.indexOf("macintosh") > 0) {
                                parent.style.width = ((pd.data.settings.feedreport.width / 10) - 8.15) + "em";
                            } else {
                                parent.style.width = ((pd.data.settings.feedreport.width / 10) - 9.75) + "em";
                            }
                        } else {
                            buttonGroup.getElementsByTagName("button")[0].innerHTML = "\u035f";
                            if (pd.test.agent.indexOf("macintosh") > 0) {
                                parent.style.width = ((pd.data.settings.feedreport.width / 10) - 5.15) + "em";
                            } else {
                                parent.style.width = ((pd.data.settings.feedreport.width / 10) - 6.75) + "em";
                            }
                        }
                        if (pd.data.settings.feedreport.top < 15) {
                            pd.data.settings.feedreport.top = 15;
                        }
                        pd.data.node.report.feed.box.style.right    = "auto";
                        pd.data.node.report.feed.box.style.left     = (pd.data.settings.feedreport.left / 10) + "em";
                        pd.data.node.report.feed.box.style.top      = (pd.data.settings.feedreport.top / 10) + "em";
                        pd.data.node.report.feed.body.style.width   = (pd.data.settings.feedreport.width / 10) + "em";
                        pd.data.node.report.feed.body.style.height  = (pd.data.settings.feedreport.height / 10) + "em";
                        pd.data.node.report.feed.body.style.display = "block";
                    }
                    pd
                        .id("feedsubmit")
                        .onclick = pd.event.feedsubmit;
                }
                if (pd.data.node.report.code.box !== null) {
                    if (pd.test.fs === true) {
                        pd.data.node.report.code.box.ondragover  = pd.event.filenull;
                        pd.data.node.report.code.box.ondragleave = pd.event.filenull;
                        pd.data.node.report.code.box.ondrop      = pd.event.filedrop;
                    }
                    pd.data.node.report.code.body.onmousedown = function dom_load_codeTop():void {
                        top(pd.data.node.report.code.body);
                    };
                    title                                     = pd
                        .data
                        .node
                        .report
                        .code
                        .box
                        .getElementsByTagName("h3")[0]
                        .getElementsByTagName("button")[0];
                    parent = <HTMLElement>title.parentNode;
                    title.onmousedown                         = pd.event.grab;
                    title.ontouchstart                        = pd.event.grab;
                    title.onfocus                             = pd.event.minimize;
                    title.onblur                              = function dom_load_titleCodeBlur():void {
                        title.onclick = null;
                    };
                    buttonGroup                                   = pd
                        .data
                        .node
                        .report
                        .code
                        .box
                        .getElementsByTagName("p")[0];
                    node                                      = pd.id("jsscope-yes");
                    if (node !== null && node.checked === true && buttonGroup.innerHTML.indexOf("save") < 0) {
                        let saveNode:HTMLElement;
                        if (pd.test.agent.indexOf("firefox") > 0 || pd.test.agent.indexOf("presto") > 0) {
                            saveNode = document.createElement("a");
                            saveNode.setAttribute("href", "#");
                            saveNode.onclick   = function dom_load_saveNode() {
                                pd
                                    .event
                                    .save(saveNode);
                            };
                            saveNode.innerHTML = "<button class='save' title='Convert report to text that can be saved.' tabindex=" +
                                                "'-1'>S</button>";
                            buttonGroup.insertBefore(node, buttonGroup.firstChild);
                        } else {
                            saveNode = document.createElement("button");
                            saveNode.setAttribute("class", "save");
                            saveNode.setAttribute("title", "Convert report to text that can be saved.");
                            saveNode.innerHTML = "S";
                            buttonGroup.insertBefore(node, buttonGroup.firstChild);
                        }
                    }
                    if (pd.data.settings.codereport !== undefined && pd.data.settings.codereport.min === false) {
                        buttonGroup.style.display = "block";
                        title.style.cursor    = "move";
                        if (buttonGroup.innerHTML.indexOf("save") > 0) {
                            buttonGroup.getElementsByTagName("button")[1].innerHTML = "\u035f";
                            if (pd.test.agent.indexOf("macintosh") > 0) {
                                parent.style.width = ((pd.data.settings.codereport.width / 10) - 8.15) + "em";
                            } else {
                                parent.style.width = ((pd.data.settings.codereport.width / 10) - 9.75) + "em";
                            }
                        } else {
                            buttonGroup.getElementsByTagName("button")[0].innerHTML = "\u035f";
                            if (pd.test.agent.indexOf("macintosh") > 0) {
                                parent.style.width = ((pd.data.settings.codereport.width / 10) - 5.15) + "em";
                            } else {
                                parent.style.width = ((pd.data.settings.codereport.width / 10) - 6.75) + "em";
                            }
                        }
                        if (pd.data.settings.codereport.top < 15) {
                            pd.data.settings.codereport.top = 15;
                        }
                        pd.data.node.report.code.box.style.right    = "auto";
                        pd.data.node.report.code.box.style.left     = (pd.data.settings.codereport.left / 10) + "em";
                        pd.data.node.report.code.box.style.top      = (pd.data.settings.codereport.top / 10) + "em";
                        pd.data.node.report.code.body.style.width   = (pd.data.settings.codereport.width / 10) + "em";
                        pd.data.node.report.code.body.style.height  = (pd.data.settings.codereport.height / 10) + "em";
                        pd.data.node.report.code.body.style.display = "block";
                    }
                }
                if (pd.data.node.report.stat.box !== null) {
                    if (pd.test.fs === true) {
                        pd.data.node.report.stat.box.ondragover  = pd.event.filenull;
                        pd.data.node.report.stat.box.ondragleave = pd.event.filenull;
                        pd.data.node.report.stat.box.ondrop      = pd.event.filedrop;
                    }
                    pd.data.node.report.stat.body.onmousedown = function dom_load_statTop():void {
                        top(pd.data.node.report.stat.body);
                    };
                    title                                     = pd
                        .data
                        .node
                        .report
                        .stat
                        .box
                        .getElementsByTagName("h3")[0]
                        .getElementsByTagName("button")[0];
                    parent = <HTMLElement>title.parentNode;
                    title.onmousedown                         = pd.event.grab;
                    title.ontouchstart                        = pd.event.grab;
                    title.onfocus                             = pd.event.minimize;
                    title.onblur                              = function dom_load_titleStatBlur():void {
                        title.onclick = null;
                    };
                    if (pd.data.settings.statreport !== undefined && pd.data.settings.statreport.min === false) {
                        buttonGroup               = pd
                            .data
                            .node
                            .report
                            .stat
                            .box
                            .getElementsByTagName("p")[0];
                        buttonGroup.style.display = "block";
                        title.style.cursor    = "move";
                        if (buttonGroup.innerHTML.indexOf("save") > 0) {
                            buttonGroup.getElementsByTagName("button")[1].innerHTML = "\u035f";
                            if (pd.test.agent.indexOf("macintosh") > 0) {
                                parent.style.width = ((pd.data.settings.statreport.width / 10) - 8.15) + "em";
                            } else {
                                parent.style.width = ((pd.data.settings.statreport.width / 10) - 6.75) + "em";
                            }
                        } else {
                            buttonGroup.getElementsByTagName("button")[0].innerHTML = "\u035f";
                            if (pd.test.agent.indexOf("macintosh") > 0) {
                                parent.style.width = ((pd.data.settings.statreport.width / 10) - 5.15) + "em";
                            } else {
                                parent.style.width = ((pd.data.settings.statreport.width / 10) - 6.75) + "em";
                            }
                        }
                        if (pd.data.settings.statreport.top < 15) {
                            pd.data.settings.statreport.top = 15;
                        }
                        pd.data.node.report.stat.box.style.right    = "auto";
                        pd.data.node.report.stat.box.style.left     = (pd.data.settings.statreport.left / 10) + "em";
                        pd.data.node.report.stat.box.style.top      = (pd.data.settings.statreport.top / 10) + "em";
                        pd.data.node.report.stat.body.style.width   = (pd.data.settings.statreport.width / 10) + "em";
                        pd.data.node.report.stat.body.style.height  = (pd.data.settings.statreport.height / 10) + "em";
                        pd.data.node.report.stat.body.style.display = "block";
                    }
                }
                inputs    = document.getElementsByTagName("input");
                inputsLen = inputs.length;
                a = 0;
                do {
                    x = inputs[a];
                    type = x.getAttribute("type");
                    id   = x.getAttribute("id");
                    if (type === "radio") {
                        name = x.getAttribute("name");
                        if (id === pd.data.settings[name]) {
                            x.checked = true;
                            if (name === "beauchar" || name === "diffchar") {
                                pd
                                    .app
                                    .indentchar(x);
                            }
                        }
                        if (id.indexOf("feedradio") === 0) {
                            const feedradio       = function dom_load_feedradio(el:HTMLElement):boolean {
                                let parent:HTMLElement,
                                    aa:number,
                                    radios:NodeListOf<HTMLInputElement>;
                                const item:HTMLElement   = <HTMLElement>el.parentNode,
                                    radio:HTMLInputElement  = item.getElementsByTagName("input")[0];
                                parent = <HTMLElement>item.parentNode;
                                radios = parent.getElementsByTagName("input");
                                aa     = radios.length - 1;
                                do {
                                    parent = <HTMLElement>radios[aa].parentNode;
                                    parent.removeAttribute("class");
                                    radios[aa].checked = false;
                                    aa = aa - 1;
                                } while (aa > -1);
                                radio.checked = true;
                                radio.focus();
                                item.setAttribute("class", "active-focus");
                                event.preventDefault();
                                return false;
                            };
                            x.onfocus = function dom_load_feedFocus() {
                                feedradio(x);
                            };
                            x.onblur  = function dom_load_feedblur():void {
                                const item = <HTMLElement>x.parentNode;
                                item.setAttribute("class", "active");
                            },
                            x.onclick =function dom_load_feedClick() {
                                feedradio(x);
                            };
                            parent = <HTMLElement>x.parentNode;
                            parent = parent.getElementsByTagName("label")[0];
                            parent.onclick = function dom_load_feedParent() {
                                feedradio(parent);
                            };
                        }
                        if (name === "mode") {
                            x.onclick = function dom_load_modeToggle(event:Event) {
                                const el:HTMLElement = <HTMLElement>event.target || <HTMLElement>event.srcElement,
                                    mode = el.getAttribute("id").replace("mode", "");
                                pd.event.modeToggle(mode);
                            };
                            if (pd.data.settings.mode === id) {
                                pd
                                    .event
                                    .modeToggle(id.replace("mode", ""));
                            } else if (pd.data.settings.mode === undefined) {
                                pd
                                    .event
                                    .modeToggle("diff");
                            }
                        } else if (name === "diffchar") {
                            x.onclick = function dom_load_indentcharDiff() {
                                pd.app.indentchar(x);
                            }
                            if (pd.data.settings.diffchar === x.getAttribute("id")) {
                                x.checked = true;
                                x.click();
                            } else if (pd.data.settings.diffchar !== undefined && pd.data.settings.diffchar !== "diff-space" && pd.data.settings.diffchar !== "diff-tab" && pd.data.settings.diffchar !== "diff-line") {
                                node = pd.id("diff-char");
                                if (node !== null) {
                                    node.value = pd.data.settings.diffchar;
                                }
                                node = pd.id("diff-other");
                                if (node !== null) {
                                    node.checked = true;
                                    node.click();
                                }
                            }
                        } else if (name === "beauchar") {
                            x.onclick = function dom_load_indentcharBeau() {
                                pd.app.indentchar(x);
                            }
                            if (pd.data.settings.beauchar === x.getAttribute("id")) {
                                x.checked = true;
                                x.click();
                            } else if (pd.data.settings.beauchar !== undefined && pd.data.settings.beauchar !== "beau-space" && pd.data.settings.beauchar !== "beau-tab" && pd.data.settings.beauchar !== "beau-line") {
                                node = pd.id("beau-char");
                                if (node !== null) {
                                    node.value = pd.data.settings.beauchar;
                                }
                                node = pd.id("beau-other");
                                if (node !== null) {
                                    node.checked = true;
                                    node.click();
                                }
                            }
                        } else if (name === "jsscope") {
                            x.onclick = function dom_load_hideOutput():void {
                                pd
                                    .app
                                    .hideOutput(x);
                            };
                            if (id === "jsscope-yes" && x.checked === true) {
                                pd
                                    .app
                                    .hideOutput(x);
                            }
                        } else if (name === "ace-radio") {
                            const acedisable      = function dom_load_acedisable():void {
                                let addy:string   = "",
                                    elId:string   = x.getAttribute("id"),
                                    loc:number    = location
                                        .href
                                        .indexOf("ace=false"),
                                    place:string[]  = [],
                                    symbol:string = "?";
                                pd
                                    .app
                                    .options(x);
                                if (elId.indexOf("-yes") > 0 && loc > 0) {
                                    place = location
                                        .href
                                        .split("ace=false");
                                    if (place[1].indexOf("&") < 0 && place[1].indexOf("%26") < 0) {
                                        place[0] = place[0].slice(0, place[0].length - 1);
                                    }
                                    location.href = place.join("");
                                } else if (elId.indexOf("-no") > 0 && loc < 0) {
                                    addy = location.href;
                                    addy = addy.slice(0, addy.indexOf("#") + 1);
                                    if (location.href.indexOf("?") < location.href.length - 1 && location.href.indexOf("?") > 0) {
                                        symbol = "&";
                                    }
                                    location.href = addy + symbol + "ace=false";
                                }
                            };
                            if (id === "ace-no" && x.checked === true && pd.test.ace === true) {
                                acedisable();
                            }
                            if (id === "ace-yes" && x.checked === true && pd.test.ace === false) {
                                pd
                                    .id("ace-no")
                                    .checked = true;
                            }
                            x.onclick = acedisable;
                        } else if (name === "parseFormat") {
                            x.onclick = function dom_load_parsehtml():void {
                                const para:HTMLElement = pd.id("parsehtml-para");
                                if (para === null) {
                                    return pd.app.options(x);
                                }
                                if (node.getAttribute("id") === "parseFormat-htmltable") {
                                    para.style.display = "block";
                                } else {
                                    para.style.display = "none";
                                }
                                pd.app.options(x);
                            };
                            if (id === "parseFormat-htmltable" && x.checked === true) {
                                x.click();
                            }
                        } else {
                            optionswrapper(x, "onclick");
                        }
                    } else if (type === "text") {
                        if (pd.test.ace === true && (id === "diff-quan" || id === "beau-quan" || id === "minn-quan")) {
                            x.onkeyup = function dom_load_aceSize() {
                                pd.app.insize(x);
                            };
                            if (pd.data.settings[id] !== undefined && pd.data.settings[id] !== "4" && isNaN(pd.data.settings[id]) === false) {
                                if (pd.data.node.codeIn !== null) {
                                    pd
                                        .ace
                                        .codeIn
                                        .getSession()
                                        .setTabSize(Number(pd.data.settings[id]));
                                }
                                if (pd.data.node.codeOut !== null) {
                                    pd
                                        .ace
                                        .codeOut
                                        .getSession()
                                        .setTabSize(Number(pd.data.settings[id]));
                                }
                            }
                        } else {
                            optionswrapper(x, "onkeyup");
                        }
                        if (pd.data.settings[id] !== undefined) {
                            x.value = pd.data.settings[id];
                        }
                        if (id === "diff-char" || id === "beau-char") {
                            x.onclick = function dom_load_indentcharDiffBeau() {
                                pd.app.indentchar(x);
                            }
                        }
                    } else if (type === "file") {
                        x.onchange = function dom_load_file() {
                            pd.event.file(x);
                        };
                        x.onfocus  = function dom_load_filefocus():void {
                            x.setAttribute("class", "filefocus");
                        };
                        x.onblur   = function dom_load_fileblur():void {
                            x.removeAttribute("class");
                        };
                    }
                    a = a + 1;
                } while (a < inputsLen);
                node = pd.id("ace-no");
                if (pd.test.ace === false && node !== null && node.checked === false) {
                    node.checked = true;
                }
                selects    = document.getElementsByTagName("select");
                inputsLen = selects.length;
                a = 0;
                if (inputsLen > 0) { 
                    do {
                        id = selects[a].getAttribute("id");
                        if (id === "option-color") {
                            selects[a].onchange = pd.event.colorScheme;
                            if (pd.data.settings.colorScheme !== undefined) {
                                selects[a].selectedIndex = Number(pd.data.settings.colorScheme);
                                pd
                                    .event
                                    .colorScheme();
                            }
                        } else if (id === "language") {
                            selects[a].onchange = pd.event.langOps;
                            if (pd.data.settings.language !== undefined) {
                                selects[a].selectedIndex = Number(pd.data.settings.language);
                                if (pd.data.node.lang[pd.data.node.lang.selectedIndex].value === "text" && pd.data.mode !== "diff") {
                                    selects[a].selectedIndex = 0;
                                }
                                if (pd.data.node.lang[pd.data.node.lang.selectedIndex].value === "csv" && pd.data.mode !== "diff") {
                                    pd
                                        .app
                                        .hideOutput(selects[a]);
                                }
                            }
                        } else {
                            if (typeof pd.data.settings[id] === "number") {
                                selects[a].selectedIndex = pd.data.settings[id];
                            }
                            optionswrapper(selects[a], "onchange");
                        }
                        a = a + 1;
                    } while (a < inputsLen);
                }
                buttons    = document.getElementsByTagName("button");
                inputsLen = buttons.length;
                a = 0;
                do {
                    name = buttons[a].getAttribute("class");
                    id   = buttons[a].getAttribute("id");
                    if (name === null) {
                        if (buttons[a].value === "Execute") {
                            buttons[a].onclick = pd.event.recycle;
                        } else if (id === "resetOptions") {
                            buttons[a].onclick = pd.event.reset;
                        }
                    } else if (name === "minimize") {
                        buttons[a].onclick = function dom_load_titleButtonFocus():void {
                            pd.event.minimize(buttons[a].onclick, 50, buttons[a]);
                        };
                    } else if (name === "maximize") {
                        buttons[a].onclick = function dom_load_maximize():void {
                            pd.event.maximize(buttons[a]);
                        };
                        parent = <HTMLElement>buttons[a].parentNode.parentNode;
                        if (pd.data.settings[parent.getAttribute("id")] !== undefined && pd.data.settings[parent.getAttribute("id")].max === true) {
                            buttons[a].click();
                        }
                    } else if (name === "resize") {
                        buttons[a].onmousedown = function dom_load_resize():void {
                            pd
                                .event
                                .resize(buttons[a].onmousedown, buttons[a]);
                        };
                    } else if (name === "save") {
                        button  = buttons[a];
                        title = <HTMLElement>button.parentNode;
                        if (title.nodeName.toLowerCase() === "a") {
                            if (pd.test.agent.indexOf("firefox") < 0 && pd.test.agent.indexOf("presto") < 0) {
                                parent = <HTMLElement>title.parentNode;
                                button.onclick = function dom_load_buttonSave() {
                                    pd
                                        .event
                                        .save(button);
                                };
                                title.removeChild(node);
                                parent.removeChild(title);
                                parent.insertBefore(node, parent.firstChild);
                                buttons[a].removeAttribute("tabindex");
                            } else {
                                title.onclick = function dom_load_titleSave() {
                                    pd
                                        .event
                                        .save(title);
                                };
                            }
                        } else {
                            node.onclick = function dom_load_nodeSave() {
                                pd
                                    .event
                                    .save(node);
                            };
                        }
                    }
                    a = a + 1;
                } while (a < inputsLen);
                if (pd.data.node.save !== null) {
                    pd.data.node.save.onclick = savecheck;
                }
                if (pd.data.node.comment !== null) {
                    if (pd.data.commentString.length === 0) {
                        pd.data.node.comment.innerHTML = "/*prettydiff.com \u002a/";
                    } else {
                        pd.data.node.comment.innerHTML = "/*prettydiff.com " + pd
                            .data
                            .commentString
                            .join(", ")
                            .replace(/api\./g, "") + " \u002a/";
                    }
                }
                node = pd.id("button-primary");
                if (node !== null) {
                    node.onmouseover = pd.comment;
                }
                node = pd.id("feedsubmit");
                if (node !== null) {
                    node.onclick = pd.event.feedsubmit;
                }
                if (typeof location === "object" && typeof location.href === "string" && location.href.indexOf("?") > -1) {
                    let b:number        = 0,
                        c:number        = 0,
                        paramLen:number = 0,
                        param:string[]    = [],
                        colors:NodeListOf<HTMLOptionElement>,
                        options:NodeListOf<HTMLOptionElement>,
                        source:string   = "",
                        diff:string     = "";
                    const color:HTMLSelectElement    = pd.id("option-color"),
                        params   = location
                            .href
                            .split("?")[1]
                            .split("&");
                    pd.param = {};
                    if (color !== null) {
                        colors = color.getElementsByTagName("option");
                    }
                    if (pd.data.node.lang !== null) {
                        options = pd
                        .data
                        .node
                        .lang
                        .getElementsByTagName("option");
                    }
                    paramLen = params.length;
                    b = 0;
                    do {
                        param = params[b].split("=");
                        if (param.length > 1) {
                            param[1] = param[1].toLowerCase();
                        } else {
                            param.push("");
                        }
                        if (param[0] === "m" || param[0] === "mode") {
                            param[0] = "mode";
                            if (param[1] === "beautify" && pd.data.node.modeBeau !== null) {
                                pd
                                    .event
                                    .modeToggle("beautify");
                                pd.data.node.modeBeau.checked = true;
                            } else if (param[1] === "minify" && pd.data.node.modeMinn !== null) {
                                pd
                                    .event
                                    .modeToggle("minify");
                                pd.data.node.modeMinn.checked = true;
                            } else if (param[1] === "diff" && pd.data.node.modeDiff !== null) {
                                pd
                                    .event
                                    .modeToggle("diff");
                                pd.data.node.modeDiff.checked = true;
                            } else if (param[1] === "parse" && pd.data.node.modePars !== null) {
                                pd
                                    .event
                                    .modeToggle("parse");
                                pd.data.node.modePars.checked = true;
                            } else if (param[1] === "analysis" && pd.data.node.modeAnal !== null) {
                                pd
                                    .event
                                    .modeToggle("analysis");
                                pd.data.node.modeAnal.checked = true;
                            } else {
                                params.splice(b, 1);
                                b = b - 1;
                                paramLen = paramLen - 1;
                            }
                        } else if (param[0] === "s" || param[1] === "source") {
                            param[0] = "source";
                            source = param[1];
                        } else if ((param[0] === "d" || param[1] === "diff") && pd.data.node.codeOut !== null) {
                            param[0] = "diff";
                            diff = param[1];
                            if (pd.test.ace === true) {
                                pd
                                    .ace
                                    .codeIn
                                    .setValue(diff);
                                pd
                                    .ace
                                    .codeOut
                                    .clearSelection();
                            } else {
                                pd.data.node.codeIn.value = diff;
                            }
                        } else if ((param[0] === "l" || param[0] === "lang" || param[0] === "language") && pd.data.node.lang !== null) {
                            param[0] = "lang";
                            if (param[1] === "text" || param[1] === "plain" || param[1] === "plaintext") {
                                param[1] = "text";
                                pd
                                    .event
                                    .modeToggle("diff");
                            } else if (param[1] === "js" || param[1] === "") {
                                param[1] = "javascript";
                            } else if (param[1] === "markup") {
                                param[1] = "xml";
                            } else if (param[1] === "jstl") {
                                param[1] = "jsp";
                            } else if (param[1] === "erb" || param[1] === "ejs") {
                                param[1] = "html_ruby";
                            } else if (param[1] === "tss" || param[1] === "titanium") {
                                param[1] = "tss";
                            }
                            c = options.length - 1;
                            if (c > -1) {
                                do {
                                    if (options[c].value === param[1]) {
                                        pd.data.node.lang.selectedIndex = c;
                                        break;
                                    }
                                    c = c - 1;
                                } while (c > -1);
                            }
                            if (pd.test.ace === true && c > -1) {
                                pd
                                    .ace
                                    .codeIn
                                    .getSession()
                                    .setMode("ace/mode/" + param[1]);
                                pd
                                    .ace
                                    .codeOut
                                    .getSession()
                                    .setMode("ace/mode/" + param[1]);
                            }
                            pd
                                .event
                                .langOps(pd.data.node.lang);
                        } else if (param[0] === "c" || param[0] === "color") {
                            param[0] = "color";
                            c = colors.length - 1;
                            do {
                                if (colors[c].innerHTML.toLowerCase() === param[1]) {
                                    color.selectedIndex = c;
                                    pd
                                        .event
                                        .colorScheme();
                                    break;
                                }
                                c = c - 1;
                            } while (c > -1);
                            if (c < 0) {
                                params.splice(b, 1);
                                b = b - 1;
                                paramLen = paramLen - 1;
                            }
                        } else if (param[0] === "jsscope") {
                            param[1] = "report";
                            if (pd.data.node.jsscope !== null) {
                                pd.data.node.jsscope.checked = true;
                            }
                            pd
                                .app
                                .hideOutput(pd.data.node.jsscope);
                        } else if (param[0] === "jscorrect" || param[0] === "correct" || param[0] === "fix") {
                            param[0] = "fix";
                            param[1] = "true";
                            node = pd.id("jscorrect-yes");
                            if (node !== null) {
                                node.checked = true;
                            }
                        } else if (param[0] === "html") {
                            param[1] = "true";
                            node = pd.id("html-yes");
                            if (node !== null) {
                                pd
                                    .app
                                    .options(node);
                            }
                            node = pd.id("htmld-yes");
                            if (node !== null) {
                                pd
                                    .app
                                    .options(node);
                            }
                            c = options.length = 1;
                            do {
                                if (options[c].value === "html") {
                                    pd.data.node.lang.selectedIndex = c;
                                    pd
                                        .event
                                        .langOps(pd.data.node.lang);
                                    break;
                                }
                                c = c - 1;
                            } while (c > -1);
                            if (pd.test.ace === true) {
                                pd
                                    .ace
                                    .codeIn
                                    .getSession()
                                    .setMode("ace/mode/html");
                                pd
                                    .ace
                                    .codeOut
                                    .getSession()
                                    .setMode("ace/mode/html");
                            }
                        }
                        pd.param[param[0]] = param[1];
                        b = b + 1;
                    } while (b < paramLen);
                    if (source !== "") {
                        if (pd.data.node.codeIn !== null) {
                            if (pd.test.ace === true) {
                                pd
                                    .ace
                                    .codeIn
                                    .setValue(source);
                                pd
                                    .ace
                                    .codeIn
                                    .clearSelection();
                            } else {
                                pd.data.node.codeIn.value = source;
                            }
                            pd
                                .event
                                .recycle();
                            pd.test.delayExecution = true;
                        }
                    }
                }
                if (pd.test.ace === true) {
                    node = pd.id("minn-quan");
                    if (node !== null) {
                        parent = <HTMLElement>node.parentNode.parentNode;
                        parent.style.display = "block";
                    }
                    node = pd.id("minn-space");
                    if (node !== null) {
                        parent = <HTMLElement>node.parentNode.parentNode;
                        parent.style.display = "block";
                    }
                }
                if (pd.data.settings.feedback === undefined) {
                    pd.data.settings.feedback = {
                        newb   : false,
                        veteran: false
                    };
                }
                if (pd.data.settings.feedback.newb === false && pd.data.stat.usage > 2 && pd.data.stat.visit < 5 && pd.test.domain === true && pd.data.node.report.feed.box !== null) {
                    pd.data.settings.feedback.newb = true;
                    node                           = pd.id("feedintro");
                    if (node !== null) {
                        node.innerHTML = "Thank you for trying Pretty Diff. Please let me know what you think of this tool" +
                                ".";
                    }
                    localStorage.settings = JSON.stringify(pd.data.settings);
                    pd
                        .data
                        .node
                        .report
                        .feed
                        .box
                        .getElementsByTagName("button")[0]
                        .click();
                }
                if (pd.data.settings.feedback.veteran === false && pd.data.stat.usage > 2500 && pd.test.domain === true && pd.data.node.report.feed.box !== null) {
                    pd.data.settings.feedback.veteran = true;
                    if (node !== null) {
                        node.innerHTML = "Thank you for the loyal and frequent use of this tool. Would you mind sparing a " +
                                "few seconds on a brief survey?";
                    }
                    localStorage.settings = JSON.stringify(pd.data.settings);
                    pd
                        .data
                        .node
                        .report
                        .feed
                        .box
                        .getElementsByTagName("button")[0]
                        .click();
                }
                if (pd.test.audio !== null) {
                    const audioString:string[] = [
                        "SUQzBAAAAAAAFlRFTkMAAAAMAAADTGF2ZjUyLjMxLjD/+9RkAA/wAABpAAAACAAADSAAAAEAAAGkAAAA",
                        "IAAANIAAAARMQU1FMy45OSAoYWxwaGEpVQA9wAChVSyrkSX4folg8BYiJjMKc1SuX4pepo4ETrVZqIv8",
                        "yVbycShK30LFEUoSgZEwWmjGlgnGrAwdrjrvkt5GpJlQtbjNmCpnFAUz040+FdsMdODIjEn9bVbUD/GH",
                        "rmrGxrYmFXK1CjhKYXw2h5lgR6aPs1CbmOaiPWFtYVaoVa0yq5QqI4TGK0iyKIgm5wLaygjEJOXtCFGr",
                        "IcBrUyhOE1jwVbirkaa5YDIOs/EmijlMokozg3hERLk0NcxSuGYIGOsmhxqBzcGdWKdhcnCPp8yrSaSq",
                        "XRijeP7/+9RkbgD3z2gkMfh7cAAADSAAAAEnEdL1rGsNwAAANIAAAAQkd04uTi7mduDmyRH7yWE9cnTt",
                        "acXJ6rlCjjaL2fYACDje3+kRAWpAcNLEell9dc63jCNp8rZuBKHoRk6Z9/I+ONSZSccFukZeBP02rMFH",
                        "jQkyEEYgYZYwDgpmUpp1ZqzJCKOXHKJ4CICIQayIcRgDiI0PIAJsFAKCmTJlmjKDkxUF4XEEMzDkTIh0",
                        "14eL+LFMCFMKHDhKP8rZejYv1CW5z8RBcimlFUpLETl9d0BlJ5eMiNQHlTITxMQHyYAwSUw3LlyLEf5U",
                        "juIYKtLLsfooAWupQ1Z+1KE6IphKH/h+maQsR1IDZ2u9alXudPK7TsQ5DcXsPvFnIglicqgeGJSztr7/",
                        "xu5YqUMPxxyKKn79eN2rG+wxRSuWSiMXrdSWYyt/JZdp7kYsVKR/3Lh+1KLG5XL6S9K43brv/TP5RyiW",
                        "blb/0fJXDmPZRjG7dSxUsTcbp60MTkMJiCmopmXHJyQFDC2ODQwlKqqqqqqqqqqqqqqqqqqqqqqqqqqq",
                        "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
                        "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
                        "qqqqqqqqqqqqqqqqqiqqqqqqVU11qbBQICDUy9HDGIzoqMNJThqI5pIM5jzj0cEMRxEMfY4tcErDTkDF",
                        "BAMdOPXB1o1ywxBU0J8wo43KcAjDQGE8FUwEHUm5q0jDmTMhQMPpjBmzTwzq3xLuap8euaZkCY1ibset",
                        "Bo8DKrxp/4LcpgCcjhpj3Gwkg0BI0v4HVuTFSHL3hAtscMoPtStTK938AQQxYsxJs06cwEQ4SoYFhcMZ",
                        "48GBWSPIsO/7KHE7AEMOVYABAyg4OAjpE2JMGEjLBkW0f0109JE3kNxDHGXo9oVrOAhAFNH/+9RkbgD6",
                        "UHTBy3rTcAAADSAAAAEpsYUZjm9twAAANIAAAAQOaV6/UeGoUDOIpMMnfx+qJm6PkPr/LQGKCOiYoUg6",
                        "y+H371VdeR7jdvOcsUsrrVYIzmd1ok/FFOS61qmppnGnuSCcsyK1EHUnX/3djmWGEstztfn0lPyfld6j",
                        "xz7Yyq53r163/1blLyvRZYdv2RAAgAxJGuGulUaOOBvI1GrYiZnRZqt0m+YWeR+J2sRH6dedvEZyaFGm",
                        "GEacZBnoSGYAKCMysvM+PjOiomSDWjACIBloWDDcwkkM6FAq9n22ZlZkbIUm9qoFFjEgZvAIHGDiZlKK",
                        "Z2OmMgpgZKYOPmAhosvGekJmQMabEmukZhyMa0xGpEyAlKJJBllInI9a12kBQQMSADGjQ1ElMDNzdXEx",
                        "0GMEEgceFo5e7C1J2miEoxWEW+3QiBBIbYOY/BHGMQZemWhRhQeYSMlBQ28skLiSzC9VfdJYwwKCpCBi",
                        "Y0Y0M0PDBAZfr8IjsueBYR5JTIWGNvEHjaSYqOgk4NKFk2BgACAtMhJB97/Lcjt08aYCLEQOJTGxA0pQ",
                        "MIHxCDhwSEBjB2dRWHH81R8y7Y5Uwwwp+/y7WdiZge7hvv7//3/73+Ws9y/Kx9Uo3k+vtrTEFNRTMuOT",
                        "kgKGFscGhhKaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
                        "qoEA4VA/MGQGMwdgfzB2BVMFYIcwcgczBgAhHAIjBPEKNPAvQxGQpjCXAsMBgBEwKABwQCWZeGZhIRmA",
                        "A6YADQFD5QDQoAy8oEB5MJjDwOYIY+VJx7EAo1mJSMYLHJkcECAKmBhAJAd9REATAAJMGA0w4HTCwZDA",
                        "ikCYXARiINmEGia9RhgMLR0eC4jAyIgJAKMtNLITDLUygGl9izxgYJmFgSYQTZw8HlUJjQVRUtLpcpcN",
                        "G685i/8VvrvUwBwJKpENEgstxFHbgCQxuVYRubl8ca64AoDEUSUHmFH/+9RkbgT6c2BIk9zjcgAADSAA",
                        "AAEnVYEdL3eNwAAANIAAAARYKB0xMD1M26RB9OP/GWSxt9HuZNFGgKLIiGCzsCmIAAA3VYk9MPJn3djO",
                        "KtIvEgRVrEIZNdhI14LzD4IFhIYOCgCEjXUfJa0td9Spfjl7X3L2rVeelfYAXEHAlKOQ2d59w//33djd",
                        "G7Cihg4BNYdxz8emAAAAbigYAYCgGBYA5QEKABGAUAAYBwCphsivmyOmCYl4HpgbAemCoAUYE4Ayz50w",
                        "RBwBBEhyLfKmLLFtgcCUcMNwfMBw9MA0OOVGvMThyMJxxDgwWHXrBTWn0dZ4b0hmn5JgMMAwAMBAbMYj",
                        "nOXiMMSgZIAfBQHmAQApQv+70apZZXdVOQs014wMBEwQEDBr9NopAwWGkdS8qhDpSVrT9SyE35yA2xqq",
                        "rMWCMWkgDn9fEEBwCksW1JrvIfjM5MMFghEkKgUxNMjCwCAoAa2wWOymNS54pZqNQS1pU0XlJgcGGRRU",
                        "amBJctCBosw6V7jA7OW6asnstYABAgCZiCJhQGiMCJ0Lef9+ZqeVCgfzGr3vf/+/+p7Wc8YMJhZYtKgN",
                        "cWxlu9F888s/uxmAQoEAMa1NVFoWzX0fa+pMQU1FMy45OSAoYWxwaGEpqqqqqqqqqqqqqqqqqqqqqqqq",
                        "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqgCAAtSPpWqmHQBU",
                        "UiAAUwWgHTGeC+NlyGgwNAYTADB3MFoCNJ4aBJIACk4miqKrma+/jbIKCEC0wCANDAvASMIcA41uxLTB",
                        "XA1MDAAMKgDhgAik1ms3npyHKZrrLDAFANDARwsAOYEYCxgVCPGUsI+NBSmBWBCEAGA0CVoErkr21nVj",
                        "UMpMo9LAGBEAaNBYxtWT7B4MPD8s0mPFZVZymQuC5Tcj94UAjixYwKDDII5P+heVA4EqFXtOC+NKYMA0",
                        "FO0/0llrdFSlyDEegNqA4oCbiO1NupnKC/ze56z/+9RkbgP5zWBFq97jdAAADSAAAAEm/YUUr3utwAAA",
                        "NIAAAARpZVKX6MDA8xrdTLRRBIGHRC5LsuVa2yVx8vxzXwW0TsKoSNMCw0mDgQABYEFUBsxoK7wEAyWC",
                        "p87178f/us///6z0wCEZHqHv/9doZP+//94RgIDsp1Tcqy5VuUCSAFMlVnGQYTkQdBICZg6ATmNuLqZ0",
                        "NcJg5ghmDMEWGA2KUAYD0wEAAWvSwWAHa3DzAR4AdS0GgFGFADKYSAG5gZCemhkcMYJgLpgGgBGAIACs",
                        "MylpUWleEaraVtMAUAgwHQDkVTAcAXMF0S40LxQRIQIoARCABzAMA1GgJ45DkNrKXBcqKNvBClTK7MUA",
                        "bO7ALMMASZLDD90mGNcs6xexE3BLdp+tuwAAFicigQXDAwVKusXLvp2A0CHvf5/qe3HpADAXMD0MNCgU",
                        "bKySmn8844Oguvy//LtSA2kLZMgmXCF/MAAiBQWsNpmZ19LSbF/KtZVBkZWDghEIGKoYlgYHAzG1wUMH",
                        "7uAUByIDbeNBW/L7m95c/+7gMwUARvpuO6//40ak/n//9gAwDAZ3qazX+mGFKOC7Ly6UxBTUUzLjk5IC",
                        "hhbHBoYSmqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
                        "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhQAVpJeBWpuAyAGAAJDBfAnMk4Moyn7",
                        "tjCdDDMFoGACgPIWAEABfygL7GAAIiQPUjXw4ITAkADBwEDKEJzIMNDAZoDxr9zHIRhEDo6ATLY0/cCQ",
                        "5T3OyxiZEGAKGASBoLhYYdsGc3x0YUgeYGAEpuYFCIRCm7kYaOVAATDsT40AbTJGm4MhCYDNkceGSYhh",
                        "k57sQHNSyvoVABzqKu4pgkBBAAoGDwUAQw3U84zDYLgOGC099TDPEkAgRAgi1vdLnJE+2tmCiUG1APNO",
                        "fiX54fUEYQpY4XdU1SBmkAb/+9Rkbgn552BEg93rcAAADSAAAAElXYMXD3uNwAAANIAAAAQGjBQVTXMP",
                        "2/EIAP03ZJfHY4BSEPPywZ0raDgAMFAuM8xuMnhVEgLVXQKVUm6kBhYJV10F6nz/9RDLn563hdbgFw4G",
                        "gIiExb5vu0y7P5f/749BgEC8P02ZyzIOYKnlHUMQaECgA9MhlKFabwQAQYC4CpgaAZGLeDmavUgJgag0",
                        "BgVJgDAUmASAgYCgAqq7V1ASy6C0XgxfxZgRAImBIDAFAFjBXCJNR8WIwiwDRIERSafD5zlPd3Vpplny",
                        "EkwBACUARgEgEGCgEmZiQYRg3AOkwCTahcDxZ0P7svUTAL9n0mmWsGEYAwEEIzcjaKLKoELgtKjtrlvG",
                        "O4TldWYwAC1gzAANDgWYLn4LYQODaj12k53EqAAVBUsz5+pKLBdBEYxKQ+9U7b2ef/5IF4d1vK1Sy50U",
                        "NjP0WNpj4QCMLgWIzzAa9wgCD2dyuVaQZBbChQCmFK6ZBCI0DodYO/Uh7XL0FAPw1Q7/9Nyvf//ruoLM",
                        "Dh9dOoe5//udn94///psANAEK1lf95VCBeBKWmkxBTUUzLjk5IChhbHBoYSmqqqqqqqqqqqqqqqqqqqq",
                        "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
                        "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqgEAAVgHSBlxdNJIwBwCzAAAeMFUCcxmgKzhzhIMR0CUeClM",
                        "BQCxuIqAYrAyuGDAEAEDgJKSkKgAzFiEAowUgPzBCBfMNIOM00h4jBkBhAwBQGAJTCZa60syxv0FO0ge",
                        "APMDMA2EJ9GD8PcZDQq4GAJDgH06DADAKatDcvoHLHgFqOVpxO4+zzmDIbmDpVHXIXmB4FhgBw1O3N5b",
                        "yxorDwGDoFEIBhYBgaA5gmx5lKGQsSpQAHO715YAICgAqDtLTRpVUEAgDQNMiRZNagZMHAQbWeu007aI",
                        "AXTjwx//+9Rkbg355WDFK97rdAAADSAAAAEl7YMUL3et0AAANIAAAATKvEFgwYBBhu1xjKBpUBAZBDkN",
                        "4VNF1pfPcxrVSEHREDYyERpoNRk2HTTqRDFUtq7EB0Gk4s88cN/tmfP//538wMFBQA0zDP/r9w9B+9f/",
                        "/7YgsC8tyt3ox6UpvIMcxbTEEJZQAAgNIgBExwYA0TARAgIgxeQzjouQ9MJwB4weALzAeA3MBUCYwAgA",
                        "4NFQAZuWuAID0iAsQAK9osEhj+C5iuEBkqyhuFa5iOLRgcDoMA4LAGsA3OWUlPhymeEmAIwvBADACYBA",
                        "mZOx4cknWZGisDgRXssKrX/+m+kFuCazP8KcxEB4xxIg7VIswSBUoDuXVL/NdzzpaRRdF1cokMIOFkwi",
                        "RM1bEEAAyUAhzPmsUpg4HiYBLd2mjTWDAoFzCwQTCh7zBIGTA8C35rbyznxwBygE+d3ZnpazdB0x5KEI",
                        "CgaGNP18InKJVVIQFSj7zeErHAPLLjoPGdI5DQol85t/GAS/9g0G1a8s92v11mML/973/xAoBd3uTXf/",
                        "e52FZ/ruvwtgoJm8v9v65yoD6anJTEFNRTMuOTkgKGFscGhhKaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
                        "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
                        "qqqqqqqqqqqqqqqqqiqAUYAAAqHAwAQA1KDADAfMBwB4wKwOzDiItPpsY4FGrGACCAYO4GY6BKpk4LDW",
                        "GLAmAMAtDZe1EdWwkAlMEQIgwGAVDB9CRNw0iAwpQKQ4HFPJKBxoEv51LlA+ih5gAAFGAQAwo2CgGTBv",
                        "EFNDMQQwVQNQwCwoAGLwEwBbySi2WAB6ahh0MAAZszIlAAMHQMMOUhOyywKgVBwzNffyG5+QV69Dcjzd",
                        "1kL4FQYMBgbMDWRNdRgMMQVHgAp7mHeN2HhLJgVgizLqZKowdCYWHMwmgkBOmYmgs5cUpKf/+9Rkbgf6",
                        "a2jEA97rcgAADSAAAAEoAZUSr3uNyAAANIAAAASWytsxWDN6pZ3NR+4VAbMHFNHjPTeGgQeOEUtyOF8S",
                        "IAoco61XpYAUiCowhC8hZEiKtEJtFdsXkOqYSBUoBrmFDd/GstiBu5Y//4U4kDrz0M3r9/phE1MXv5l+",
                        "o+EBLBdixZ///9d5e1/N5YWEO/Or7IhLmNIS0PTABAFAoAUVGAVDB4G2PAI7owXANzC5AlKALzAdAYgV",
                        "tl3MeTHR5LaAwAZoSb4qBYYNQK5gZADmDALGaqRPhhTAQmAuAYEAAq6ZbFoE52pGmPUxa0wLgAwEAsTA",
                        "PmBkLaZRg4RgHAgmAmAMoC1qDaS7aTJFgCLqlAkAg4aNJgIAAiECGAeSYiPxjcEmFQEzOGJXnYv3o4oQ",
                        "nunOsOw5OwoI5h/PmiwkJFOrhSd1hQg4RhwMT4byAGBgYJggDkQtMaWkTNaJUTjH27OY4DCsFxuV4V87",
                        "bgiMDmKmeazG4kWCgPSeUTcEt2GAk1Nqsjop+zLAqBDAI8NEIQMr6eD6EoDWzTSx4BUWWoH3d/X+zKWU",
                        "NJRc3916CwFIcpKT+fvb7OJKef+/7KDBIIZNqi1++/937mPviFn99V9LCYgpqKZlxyckBQwtjg0MJTVV",
                        "VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
                        "VUAAAQAEMBAIBBgEgALZMB8CclAbMCQG8xPx2TtdbFMUUGgwZAKQEAiYJgAokAwnUDQCwCAsicAgHjAO",
                        "AKMCgCBQAv2YEACBhVgqmDiCKYBgzBgEojmFIEAYAgCJf5kL/N3ormMy3cwCQCbo8AuYB4DYjABMCMBE",
                        "wwhIjQ6EJMCID4IBLQVaG2kjjdWbGgGZgcAEV0iqYFYBJgKAKmAYAGFCwnmxqGDIMiwfNNkVeYneQAma",
                        "RAIAAAEgCBgJkQYo/onmI71jIOI4OlDuH41JQYOgiYBAAmMuVlLLTBD/+9Rkbgf7aGlEK97rdgAADSAA",
                        "AAEt+akSD3utwAAANIAAAAQBULyAJjCJUzcUNQMCj+0Vzcdl4qBCebOVdLEgqMzw4B5IEhk4kBlmHQIA",
                        "UOAWUxKC0rxgBiwDkCgYE3fWS9zPC6IBAQGBwCWoMBgQRXTTyhwKAUyV/RCBAGACOoiSi5v9unOR9pTe",
                        "fr/4YAg7e+Rf/dVWZt3aBl//z4bMBglgWYxw/n/+G8sefhze7GjNac8EBgCaWIVAQBwD6toOBNMAQDYw",
                        "MQkDFiFMN1B9Aw6AUzA4CGCwEpCA0QgFjQCoUAMMCMAMDALFgCMtsYDAA4OAoBgAQKAMMJACAlAQMGkQ",
                        "E0xyljCrBxMEICRR9DR4+PNF68wkuWjS7ihECcQgMiwUBgKCsGR+IWYTYKgcBiDAGoTDUNy7B6mC0BIA",
                        "MYCADYkAODgJjAQAeMFBHMMSMOlh/MHAkHgP+H3IhyZ2wgUAAHACAQKAwOGAwPAQBTAABwMDxgozplwC",
                        "4oAojAGjpNbyaIFQnQEiIFGcKSFAMMDwVGgeJAdMGh3NewOC4D0+f7icbnnGXaNAOrGLABGYaV6YAAQY",
                        "AskYKBAPAKrFAlMvEoCJQIYAILgSEBeW+Tvb9O4UAcwVAgOAAxrD0WMgWAdkAXABR5EUmBRcxVCFENJ9",
                        "tML//9n2RsPq9/vKYAAQ89eZ///UCsEZflj/799AqB1Xsxe5/P7vm8//vP3zVvyibq1AADT7QzEACwGB",
                        "BMAUAQvSYFIFxgLACmLuGWZfLZJiLAsAkCkwTwCw4EUwLwGQQHBg8B4YAYFBUiBEVAowqA0wXAtxDBwQ",
                        "jDAdzFADjEw0T/gwDMIODEgQR4PC75IAaB+EU3ImNiICEU0IjDILAICgCAoxTNE5BJQxFAdMomIlzUH4",
                        "GlbbtvIqVBEW/MGwCMAQfMHQoMSgYKww0QWSsNwlWylicohtrcvEILS9BwMCAuYBA4GARbMDEcwzETZg",
                        "WFQCXSTrjbiUjkNkU1L+pqw6qun8nSDACUB8xWD/+9RkbYT7PWBFk93jcAAADSAAAAEuCX8czvNtwAAA",
                        "NIAAAASg7zCwLR0TUYnIoQ0tMcOA6NagAIA4NBYQA25kwLV2YXPRmoCtVZonRYbu3yGCpQMDFXqUGDQA",
                        "oJICYDjwHHQaYkcJg0chgOHgcxJlCOIcH2EvtNQwsXHnf5zSyVjSf5RFFzqzGEQ4sRuDkQ3bp5fHmxiE",
                        "BBwGpOcu9fxoQ6JwcBGvtfMEFxRx3epqnVQAAARhWFBQBRKApguA5g2EJjSH5gCHJmagIOUcx55oxfHs",
                        "w5C8Kg6YHgIYYg+DgkYLD5i8LmDAoYCDA4CDFwcMbEwxkGDAAoMoPo0YBDUVeNI4EVB4GUQNAZgMCo/o",
                        "HOulujzB6MqHNmYhE5j0qgIxmaUuaNZZsJFEI6MEhYWBCvFmOWytQdp6eiIheAw4IjJQeMFhEy0TDMBw",
                        "xh4OxESJTagveXQxD9WKrBmDkaqhhZiZqImJGhiYOYacg4vMRaxeUgoeJE23Cc+PJlqZMQEhAywiMUFz",
                        "JwEyowMOCmzAYkMmeg1CMbB30XksZ9GqgUNMLATBwEvmYQWGhEQOFi8CR7UkizKT0DVBEDTrqwtE8IBF",
                        "NR0DrovmIhZMCKwTAEHDGgYuWTQAshhwOkIwEwsNBoAYOKmNg4iCjICAxwMBwuruXOw5Egf993eCANwI",
                        "DdftyUhQVVgnZBR9s3KWsKAJEGS+v3GrL3bSWb3pn4r7lpiCmhAAqYAwAwOBNTWMBQEUhABMBUCUwQBK",
                        "TKuR+M+gXUwOgGgAAfAAKAVBgBxgCBIgA8wIAEwjBowIAIGgCVAuMFwwEQimEIkGQ4yGfd/mNBPGGo7G",
                        "CICGJgFJ5JtBQAoOeDILAqrEwIBEALBGYLDSKj+Z+oUYDAgBgTMNgVi6txgqCxZR5oEi7cxICyUBgaD6",
                        "Uxh0HhhYKBrQMhh6AiyzATgzsoQ2fJYGG25QSra1wGgZgokDg9aZl2YbuOmGE4hEUmTFj0iTU5kG4CTc",
                        "i7M2rCyUHCBjRewAxb9LJjz/+9Rkbg/7WWPHg93bcgAADSAAAAEuuZMcD3eNwAAANIAAAATAYKFCAKSM",
                        "MBDhoCSAf6JKxQQr0yoQAwGYoUA0xOtPjSicIIkVXJl7NQsBgIVlENMNT1HSYYAQqKlUTMJBzoiwLhRg",
                        "oG0BXhf0IDWWofDxE08EhZVCw4YEi4xQLMVKArOFAEUIhCCKOriklSXRlsKbQFAnpl8ov6r8nv//z/DK",
                        "WFYFTWL/ddxx////+pepEY0AEYAwBZKAKpWAQDTBeAcCgDJgshKGCu+QYrAwJg8gMDwQZgZAiggAAkAN",
                        "MEAEMMgiMAAHMAQQX0BQlEYSDwhGGwDmGwGGGgIG/D1GbANiQ/M9MSwHfNOMwUBYuixYKA8YGguUCuKA",
                        "MYUigBggMEwkMVQuOYi3MYQBGAtSKQbGgOMCQUMCASf1T6AwRAEwckA4eBMwWBYoGcZRYz8JUw9AIcC7",
                        "+xIiAkYEQAceAyYCPxSCgZMPDBOwxABTBFQNDhAODQKJxhcEgYTEQVDgAilZIAI2dsBgMGGEAYYYAQhB",
                        "RCKjNSEMrgxzAKUTEgKDgSXWGhIKgBvE3k47JCCiwIAuDEjRUHG9gqZcBphYPA4FxOlehoCV1LuehtCF",
                        "lYWDRgcGmRCAZwEZigGgYODQTbOoMVgSlhtQNQIAAJbpkURmBgs7ZhYShdRAYvEIZCAK1dqdn9Ze7xQD",
                        "IR2z//EaPf///9xJwmBtLrV////////047ZrG/fRJgRAUBmDgMwoAuIQJBIMACAQmAMBIYWc1BqIhomB",
                        "2CwDgXCqEMAgDCqAYLAsYIgKPAaggBwzxYwICAaH8MNAxaKcxMJA7HpwzfFox2CIeDswqCBX4IAcMAx5",
                        "4GHRGBQjDwtJvgUdwwGRwTRoKzuM0zF4HgMNhgkEJjOAip0jDBAHFMFThcLBGCSTAiAowdG0eEcwDBgw",
                        "vTg3NLEgDMxWGGZg4RlYAZWs5oMdEh0phCwIEjKRDJhCGFYY6yQwYOTJ4kEJoBIGWyCQGvaEiMCAYNph",
                        "rWMlggz/+9Rka437vGRGA93jcAAADSAAAAEuFZEaL3eNwAAANIAAAASgCjDglMIio2fNAEuRYylUTmAg",
                        "MVgowMLAUKiUU+FwGpKqVAELGIxUAgwlGEC4c5CotEQqDhUFY9bIHAZpNvBu7higlMciMwSB0dTEpkOK",
                        "kEx2LjAgCHg+v5BKmq+Kt7ZGnFQHpzgwWiICF4C04AXRmMDIjgIDP+1P//PiLpZm9jrn/QSfe///zqF/",
                        "yIM4/c1//v//693VdQ1Qiywp7XteoKToIAWEQB4QAwKgBGBIAYLBNGE4FcZIp8RsmgOGC4AsBgEjAXAB",
                        "FgPCAAEwLB5IgtmWABMOwRMHAWFgXCovjQuGAobmG4hmZXBgJlQ4EEwjAIAWnCAECEDxIQrxCEEGCwTQ",
                        "WYQAuNAeYAgUHAIcRMYY5haFQVMAAtAoDQyQAGBgUW5BIqHJYAUeABdRhCCAQJpIDxgWQZymPAkDJgsD",
                        "GDAwAQG44KB5CE6R9CYUkQEhANGA8JwMKhgAGO8AZuIBgIJGIwQYnDC5UsQuCiIQQcvAWI4sCk7DAQRI",
                        "kAYVEhIMzLMZMPCUDCIwEJAsI3sBIICoBMRgpm5CG3YfisDUSKAMVAxg0UG6AiChesgvLJr/qVl+s6RZ",
                        "bBhkRmNhMQAkCAwQFE4KRggROKTBF1HKfqqHAF24FCwEZ8YDFZhEFrNFQIYCUA8h2sp0vq5/7/CvOlBC",
                        "nuVuf/5f////sgB7a9/t7//f//1YVzQiAz81HfR1qjALAIJACSsDkwDgBTAvAkDgljBdAbMBABMxg2MT",
                        "aPF2MMYBUwNQHDA+B9MC8CIqAKmEwKCgKlYBGEAAGIIMgIERYNioMIUBMGAcYpiMbzcIYvFWYahgYPAC",
                        "IAAiYFAoRBmPEFFRCBRhQGw0G6jg6OFcCBKYYD0aQ2iYFggYVhcYFCaELQvEGheYIAgNAgCAWHhBMAw/",
                        "b9DkY2BeYGgWYBAkYurOZ0l0YaAALGQwqOgwCI1IGmIgRGodMPjdF+GTBYvM9iNn6zQpLjj/+9RkZQf7",
                        "8mRFg93jcAAADSAAAAEtLZEYr3eNwAAANIAAAASwAHSAJFccMYgC7HVWGCwfQIdA4UGDgInWFyOHNEYA",
                        "zemukCaRE4XEJk8EmISEuARgIwiJQ4OPqMB8FBQoBCXxjIoAo1oARUIHJySYXBz1iIAVMY+MAEiAM7dQ",
                        "GLeTtLQoXGAAiYUBYK8AcLUOYYDVey6zNKVs2dth8aERJMakAMALgGL20PH5MJMaMt93D9V0tBQARXKz",
                        "//z/3///6IAKkB/0P//7//+gWfnKAaCGz07+t/oQQEmAeAklQglCAJA4KowGwBTAsBlMQmdsyIRLDCyB",
                        "PMDUC4lBeMBkBUEANGEoJhcCAQDYwAYCCgMDBVgWFEDB2FgFMOAeOXTCNHSYMGALSkMEgsTggodBdTNz",
                        "2vmCQhKqQCYOhymSBAAMKRJNRZAMFQOCAxIAAAR+RoKBSRAORCgDQOMFwqMDgqdZVMDG8MgIqIwkOM2+",
                        "FoBC4YgAYqBofdYwaRxAAa78FYaMQAqSAwnmQxcyZUpiFfHNAASiQBAYwsGkzpAwYwWBosouPHAWOKXo",
                        "gFZjAFgQHiEVGBrMYfDhhYFCwTMXCEmCKyhwCFYUnBUQmLAE3rPTGYyKBOuosA82gVgcNUUgcDZDlVdm",
                        "hjE2KgpoC+RIDrHGhWYAMRoAklABgRXzb4fdUwrM9IgA+wABpkYKiQNpjASCT7duDZBB//+6jIhoayHv",
                        "////6///+DINVDh2p3/////p02e1RGB2nYu6zfPpTSoAIHAghACpKAEYAQBZgVgIiAEQwSQeTDInrNBo",
                        "PIwWgN3wEIJ5gTgJGAuAUBgRIgJMCwFMDwHDBsLWyswMAsmHsFAoYPiubGcqZvAyjAlEYSje/UsJAHGh",
                        "JXGKgyogPBjCjBoCRYDgqAI6IxzAtIyBqWogDQwgB16BAAZgCGJWDAJBEwFB8DBex1G0MNwrCwwLBMw0",
                        "Gw3WFkt0iuCBdEKgQMV0N9D6YQEBr1CAKjS9cVBGYfAp0AGBUUKHGCz/+9RkXw764WRGA93jcAAADSAA",
                        "AAEufZEWT3uNwAAANIAAAARIPAS2tkmGF4Rg1VZN2cFAewRUQgApoMxgpmGGgYYnFRisDOom4CgKXxoB",
                        "kbmIgBNEADMCBcSAVoqAc0W0QEQfLpWsfu0tSaZOli6YiPpQHx4IGBygaNEavpSutm1nLBu958RYTx0l",
                        "DxkAJ2qAYPBgYAjQDqw22f//8F9pTyLH/3r/1zPv/q6QAV1cvy/Wvz//+CW25NoevxkO6CuhlYBgIBEH",
                        "A5gIE8wAADjAKA1MB0AcwHgXDBRBTMuhns3NgODBFANMDIAYwCgKBYCIOAgMBEAAwGwEx4AQcAkQdQcm",
                        "BYDASBuC4BZYBcMR5IowfwfzAzASMAIBUwJwZlB3+fIwGACpGYBgFJgRAWpipSBcGIvQpqYDYHpmSiFC",
                        "gAJZIlBMEIGCaj/mAACKIgAQYAqYCwAosB66cBGCuA2BgU1RmAoJUYGwQ4KBXGi0FCkxWkHgeRFUoAc0",
                        "YBAhEGVXigcASp8vaYNS51wHjA0ZKFSqtXjM0t4iOAAxmBBI7yIGkkHC2YMHi8yxaTS4qMOi0woHwMKG",
                        "StyEiuGFPIqDkwEBpYkoYcFJEA35AoNNVOwHFB+wEBdc/e/rCgFYi3IwIgkOhZktObnGC02xtReS/jWj",
                        "WL0A4AM5HQ4PKZNJnJglTBiiDAFILrU9fv9uyBgFPcw1ZpdZXLFjv8+CRgSoiX+Svlabz1hh/4yPl15V",
                        "+2y+SXVujQBMAUAwwJgEAqAkxMlAxKAdTAmAuMG0AMxxEbjgUDBDhdwwG0wMQFDAuAfL8lAIGHoLGAgG",
                        "mA4CGE4FAID0dDDISAwNi04cBB3TEZomcBh8EaNRjMGb+R8gAZCxoJhCGYYFiczNTEUgQwKQCARhgIZ2",
                        "wVBhqGhg0BYsExjWNtV1QQArDGuAAPjBsFntj5i8HghCYwqB0xnMQ5rKkwFDkwuCAaFDEwAZGBBgXKIg",
                        "tA4WIJVAFYhDhlsJrGUzMH006sDwYIAMCBIipZT/+9RkZQ77wm/FC93jdAAADSAAAAEpJZEaD3eNwAAA",
                        "NIAAAAS4ZBoQOJK2ABEYBE6nGUyYcCCToAIRnyvGoQIEBcoHYGKcystDiPIaRlgamHg0mmWBMYPLw0Ap",
                        "SBhCb5a5jsXtWBQmm9cy3T0sqfBBgwaDQ4mmAwcCSeaEGCadGkAt2ex1YycJHuQGBxWZhBBZd3zBy2Mv",
                        "kdFpw2Butj//caIFAA5vbud6/rdTtDn/51CAAg4B39y238u+hjF7f1tb0k48uXf/9/rmH/+u///h//WB",
                        "wBgBALJgJSUAcCgHA4H0CAJmBGCAYiTjhmmBvmDyAEDARyoBG6EPEgDkQSGAoAtIGhSQvjRggHzcQYAh",
                        "hWE5vtCJo8EqnkpDAICGSdKgAPOmo0UvxSOEYWBCJAWMgCYBhEamrOYNA+XCCgJmBYQJxyth79soAQFm",
                        "BwCrAJSGAYZgYFQCAgwS5saMxhYCqsAyDR4g5lqQKHUSmuGAwUpexcvGCis4WZgWJmjgClcAgQMh5MRr",
                        "JUBaRdOIg4EFgHDSHCA1mKAC74iEhn9HFZKMDAYFEAwoEGCPwXVSeqjgPRxWALAMMIiKVvQIwIYyMxjU",
                        "IQSJAGQd5vP7cqVcjoYKB11dpgQGE2IZJAj/RvD93qq/h4AUgMDYsSEfVJGBB4ZHDyTbD4JhqWc/7krL",
                        "wyHvP//3/a2ff/SL6tXfrf//ukvf///G5T2vpSmIKaimZccnKk+zANAAMB0A8wCwBjAWAmMAYAgMBAME",
                        "gLAw7YbjJVEFMEkGYwTAMzAbBcMA4A8iA7DgRMGwXYaCgZMNQBMDQEHAhMCQOC4HDQ2GDI3GBf6GHgdm",
                        "FYBDQCCQXFAYQIoaLAkQgCYEBGn8oKKAAYJi0hyAgBmA5QmGTNGDAWDQOOQg5IEEbKmKEIBmAQNjISML",
                        "BoOmEYZDQtGBAMGEKPmGQ8GCgQBwxHRqYaAKcxggIggVAoNpvGDgcGAVf4hB4IASywsATDFjAx1BAWDg",
                        "4ABK2IIDYjCqIjAzCYpEiqD/+9Rkbg77mWTGA93jcAAADSAAAAEtYZMaL3ON0AAANIAAAAThwmCFCul2",
                        "ocKgMVkZg4ACQrDBsYND7d4gKAkSGqlBgAFiQVFgiooFQ8wR6EvTIqTMOglTseA89vv25W7CmbfFgHGN",
                        "SGEAYwOCRgoGAyGnpinmp+9344xRGhlceFQel2YMCRe8wEXAUGhIHK2Mla1Eef+bZQCB4P/v//4fqZge",
                        "//+i+hff+r//92J3v///BmcOTvdYC6V1BRDEgPC8hgDAJEgFxgKgJGCWA6YLwLRirqSGkSFSYHQLhgqg",
                        "Sg4GtvTATAJDiKJEEwADzAgjEQSIQyYVE4kcTEAyMBDUQhU/PnzFqAAxtLJKLjQkaoBQmDgsBgwEAN3w",
                        "gXEACEAJAABQHmShOdgq5goJoPhUJGFgIuAUBKeag4gDQ6HjA4MFACgMMQAcvSYfBJjIkneBGYKDRgQM",
                        "gUUkxBYgDQgFwsFgMp0MA4ChVS8VA4sYRwViADmKIaZjBoECIVDIkJkZjDgMTVGg+j6YCA6PQBALMxEO",
                        "QCAjAAACwGMmAoMT6HcsiYKEDKWBESBlCnRgEIllQggEgGU2WilcYQDRhhfA4lQEjDXzv0liG2VKIgEI",
                        "AYHA0hFzzBAGQ7DT+ySqRwhqWXrcQgZIiBGJkghMVhGAnLMKGwITSOyQadLbK15c+vGV9Qr+8/f1OV6V",
                        "ZsL1hgVQaJAaL6w/f5xNC+9z+Z99AtTi93u1VTAQAJDAHhQAkQANEoC48DsYIAHaSpiXh2mmqFItMwaQ",
                        "KzACAJAQDw8DyNBsyAC1zmAgaCg6AQaYBCKtYFDphgsGLz2eKhZsJJsoRnRyGhwIwKYEAAKBSWg8DDAw",
                        "kMGBsxOCwEMSENlmAwBnd14YeFUbAAHMPA2TJ6FYGCwIMAAMw2CwCDTCoaQUHjGGE8RCgGGA38ZwxOGK",
                        "k5hiSODZh4eOkIFFyqBvyJGo8IrTEh4SRFBBARmDfZuoWGBxkgYYWPGKhQkQphmLBjJAUJjJcCj8aESA",
                        "jCwcIR3/+9RkbI/7YmRGg9zbcAAADSAAAAEuHY8eD3NNyAAANIAAAAQwYkMP2A50AQAFhZfqGwAAkuy1",
                        "YcGhcAMIADCAFIpXpMcLaALMaI6mEB4cMJRudFJJB7caSYIQxGsgBjFlG0q4BApl5AYAIiACEhGXNPcx",
                        "nDSF2BgE4b9kpCAA4iE2HhR2MlEFrtIKA1TaAK1nHt2m7/9/HvKfWpJa7KK6io8BzF/Hv7wnJJdw32it",
                        "SJShTjpvK/oVvEgADA1A9MFEDswWwWzBtAdMG8Msx0SJzKdSDMssK0wIQPDAjANDAmzAPADMEsCUxKGT",
                        "BILGjKYhEpjEwmQSWZnUJu+CmwU+Mn8xuQTe/CMbgEDFhfLLCYODgOIhCDRAY+ERllHmtU+ZrKo8Swgz",
                        "gANmIwcCA8cYOYYUVwGAR8HCaNCooMgGwywYBZIjoXMBiMxCGTDoRHhCOgIIChkZZGbwyNDEAhwEwM9c",
                        "N0CAJkxBYgIMwNWREQ1NMDLE1CoYMAmNRLPq7NcGNgLOKzBKArGJ1DUUFXBIABkAsFMIeAxxzwwcZs+c",
                        "WCcJgJOwMfBAwGFkNS1BhRC0xkeELAUgTbAhQLDTJgQ5WfmkKCkE7LJ6W0kngtL8VAAkcZ4soIpkJEyq",
                        "GDh55JYyBLspEOHD8U2FR5sVo06MGNKAY8JVXlrOATsFkYMEln27wuTRicvZ93///f7y9nQKIZV6leHU",
                        "gq+FbWuS2PSHG9zm8dLyloCqAEwGwGjAiAnkoKBBMDcD0ABDkwqhtCGZGK6BEYSAMpgRgkmBeAyRAvmA",
                        "GCMYBIExhIBoWCoxeDgwOCgw1C0w6Hsw+Hk6WdAzRAooBMxWD0xuEkQAGMAHBTES1gMDIKAAYJAcVgyZ",
                        "BEuadM0Y4jYIwTcMwPB8x6A5FMhEAmBxawAA4mA13jAwKAqIhjqn5g0GqRIsHQoFZQNBhQG6XDsFtjAM",
                        "Fm7jAJBBhqMa5+gwHEAkDhkGBQODDNBFr4sUjokAkwAiw8pF+CVyOwsQ4wMAHTEgUlNBofD/+9Rka4z7",
                        "a2NHi93bdgAADSAAAAEswX8eL3dtwAAANIAAAARwGgcXBL7uIWmIgJfBi5ecyyGWC66xYNEAU3ZNdDNc",
                        "phoyRHZeJNEYBEbDgRJCaysWNYQqaK2I1flLssrS4IgAnA1TjgA0gs6LJZgIQmsianTN37EBAQWN8bBG",
                        "CGCCztmFhsNv6/KYxh4EWuZC/bC3mQNWpnh+8f/8rXflWadyANp2dndlWiW0tLj/8okYZFPf+PK0qBNi",
                        "APAwmAeCGAAUQIASAgZTAlApAoPhtxkWmECAIYIANhgYhbGCECSWxDATQKAMYHgyYHgEYcC8YQg+YCAg",
                        "YQEkYLCQccu2JA2GF6YKAuYJg4Ypg+FgAp3jJQJBIIKRMIQWS7MVw8MxW5BAPmBwWqVGFoJA4fTAcCQw",
                        "I1wwwYCgAngrIsODAcC6rGCwMjoKmKQCGBQXAocTAIJUgSECCoATrEQBCMQMIAjPSI824ByMMCYkWIPG",
                        "bDJgwwxlOtdhfYWDgcYBUIMHBj6WwwUUAgNBJhAwaaBEQk7KAEABQqRBgorcYuDokAeBEQsYcCL7MAHg",
                        "hGS4L8tZBxCYSGjgEChItEECxwBAYkEDQ+XYAoSJCjZsuZc6FANKIEDZsy8TCsNpSGCD4CLl0q3P7AEH",
                        "PrEi64FCAu0iMWEACRA5gwKLH+GDNF6zyOsojJEupXp4w7///////6uRdGq///Xt/////AcBz3Z9aYgp",
                        "tQSAUFwGDACBJMDkBgZAZMGIC0wPQrTmwJoMBMC0wZQWTB6FPMFoFMwZABgwCUKALDwLGDQemC4liwnD",
                        "REAkSh0jjozODCUAjCoDzCgQwuGhh+LSRN12zAoIzBcbVhQMQBhKAA8LJldQgOFsxFBQDB2YLjEYKBmg",
                        "HMEAPUiiCDQlDgRa+AhnMHiGNHovMXAuAwmGH4HmA4dGJwBkoAuNOGDoWGBgqFADioOAo2MkA88UvxkF",
                        "DgRUFSFMWCgLgEYCcOAkPmCxkyIwsEUNmmHeg+YeJBMBzBAHBxOMoh3/+9RkbgD71GTGA93jcAAADSAA",
                        "AAEvPYEa73eNwAAANIAAAAQeIZEDIYJiMYAARMfFMgSCDJIAOan9ohMPBYbmVzkYZEaAsMCbaBceGEAI",
                        "VhCwlOBDEbNJ5dILAGBxU1gIUybPn7lCCwcBzCoEEKBHhIk6qJd5hgFpHWYJdCXxp7hIArsNYi4qh0aA",
                        "4sBTEwsEidZbIsWcjS3mWocDAoKEgmiq/WeH//////0yT7Et6/6u////DbwkQan6L////t3nVrggAEAA",
                        "IYAQBJgHgPGASA8YF4AYJAAMDkDgwJwFDe9LVMDYG0qAUGEGF8AAIgEFqYDgAJABEIQGBoEGAIUmCwAJ",
                        "CiIMQgFDiOmTCwKigaDBUDBGHxhODJMBrXXuKoJGBghhwrmFINDxLmBwTAGJzAgDzD8BTBMASQNDCcEj",
                        "A0AQsAAIAd4woBr3oumAQBGHIPGu6zGQI2gIMzEQODAIjELh4ikLFZSAHTBUBQUMy2S/gBAB382CAHqy",
                        "NcStMvAwIHQgApENzAgZMXjcEAMGhQAgIAgg6OfSYIMSbiYaBACebJC97xmAAKYHHIGCtgwGFzCA7NCK",
                        "gwMGQwCmCgOYwBAcRxYtooUhgsNhYePo/zxlYHMjlIxIE3+UwLMo/w9O2t4RMQARxBCKzOo+DAeFgI8a",
                        "iAjAbMIr+/ehvUA2zeAIMAgVl0BGCQ4PBafjzkyKPQI01rq1YF8vRZ//5j37N/GrdSNCDRGcudxtf+tf",
                        "UiYoBjBICgNze3V1MSoABgAAdAGgHmAAC40gwCAAwcAynucHSBxgyBagoMcwrgvTADAqIgHRoC9I0wYB",
                        "kLAsYEh0TDY2IEAiCAnORsqMYgSLrmAgQiAJjBkAluBAKqWBcDDCIRh4hgcMhMJRg+H5jvNgEBwLBQRB",
                        "uAQOMWwhTRZQNAaDQYCwUN87BgsB4gCA3OQUxADLhgCEJgKFBiiAJhqDEFtzEAgmAIryR/R0AAwAnnhA",
                        "YUAw8GQ4EGAguPGEDF51ExAoVhkRhAjXS6AgGZv/+9RkYYv68F/GQ93jcAAADSAAAAEtUYEUD3eNwAAA",
                        "NIAAAATpfPwsMpMwYFTK4BKAyGDKKUZeUmIbPAwVLGMQPF9WaGBweFS4ZXCwqCEpXTEA3HQGk0+SUpgg",
                        "fGpkKZJAiZIcAYeBwGnuZ6rxxGdko6NTcBCaUjnLGd1WxWMM8Vg2WrxHQgbHIK929LTIJlTW7rlT1ppF",
                        "KulzWYLBA4E2M9/3v/rD/p0TyIM4f//+////BsQkBI2juU9lxpqGlTARAOEAGJgZgVGCEBSYE4EwWAvF",
                        "QbTpZYnMBgBIwNghTCxEKHALDBDAZBwKQwAitpBEYEBwNBykWXRKowG1v6mLQNIBjAMAkbgULIgAAHAS",
                        "UCQIwZMECAMJQGMTQtAwBgomTXy4TEoBkZQEBQ6Bpi2CYFAoFAQYABgWWCgVCwYI9MiMKASOiT4MNxHX",
                        "2YHBEn4AhuMFQUrt3HRSMAgPCAtiCHgkGz37PBQFIAqCAQYMI5kkOBCibkRAUwqEjGwYCB2AiEpssgzH",
                        "cQUSWGlgOmPCOGJcyUFQMMIdRsMFEwcAEwuQGBU23FiQFshBwgUQIoGYeAKGUXAgpMIEFVkthJCYDwaQ",
                        "Fk+mq8SEBbezreGUtEgcoMXNNpmdCpFSHiwFxkANYo9XINSpfdPYRjMzc2gUFH5Dgal4gbIL0C003BLW",
                        "2wwlyyQGEQGtc/f//7//Z6AgI2HDfP5rv//58ZGYAAL39c/iJVCxj3zxegCAQAJgOADGBMACYBoJ5gLA",
                        "HhUA8OAnCoMZ0tOCGCCE8YCgI5hnCKiACgwZQEx4D4mAXi4jAFMAAFBTN42GA0DUwuEIDByAPYZARgJA",
                        "JEwPghAGGgFgcAqIQSzADAqFgBDA2AkBABpgtgRmUKSULATK+YoKgamECA8YCAAIQBiAQBDAQA/AIBJg",
                        "OADOa+xgdgmGWUAaYFAJhgJABCoJZewwvQSzAYBBGgBy9hggAHCgTUEw8jcGA08FTDBgODC0OgYkGpm8",
                        "siROg8SJb9mDi8WsFg4rkGD/+9Rkawn7o2BFM97jcAAADSAAAAEvDZkUL3uN0AAANIAAAAQMxRXCzUmJ",
                        "AiYSHphsJDRlBwdqJLGFQwRGVuTVyUEHZFmNAhrAKCYXE4KRwcC3zpUEYMDySN5hAFBRqIDAZKQxKE5y",
                        "INQfv+8nh4CpEooGMXAoG60tWiwRtcv7UCwOYYpWCAYDoKAlIW4JgMp9o0CRSJbqyhbmqeWOM31vD//X",
                        "6y5+V0IBQ0F7XP/////X4EoDBoOa1m/LqTRcUe9zwwJCIoAoMA0HEt2YBYBRZ0wLgOzpRbfMJEEMwHAY",
                        "jE3EMMAsAkwSwCTAwAUL8OGOAGmAGCMJAvzDRxgBIwFkAyYIxndoeBzKwLJcYDIBCA8CAYmA6B6TAcGB",
                        "SCeFgCjANA0Mqwd0BAeOG3QqAdmDUA4YGQHoCBIC4E4YBiYBIKY4BLPJemAEBKZQIaYsEeIwCzAbBYMA",
                        "cEswWQQTCGBOnioAQYFIK4MB0CAq3Kf0wKQjiujMJBFHBVIQBUzOQwMElVU9CA0mBR+UEAwyCR4BFQvH",
                        "GImYmDqu5CYCGpjoMEQpSumHjMKkdDF3n5ZsA4UTCdeZABhQomHxEYuBUHRMYBphkYDQLtMRMDlU0+0T",
                        "LIDSgf8LCIoF79ayw7SAoDq6HDcbGMYQHJLGFKyEHtnsYbrJXwHLEAZvEOhxJcphQVE4qD5VFafDOJp1",
                        "Xt6YW/3f5v//8McqxKA05CI3yLCtLZ7P99/85ggBoCH66aDv61z/1v/s0C7o+4wuMAEBwwAwEDAAAfMC",
                        "0AgCgAAYCIAgxnOYyoYPwPZhTABmGQHmYBwBBgSgHGBIA6PAaQpPEwjCsFCs3FSodCkzt/gRAW4D7mJQ",
                        "lAEE2tqZEQFGAAHGBoilnzBITh0FjBwPzyFeo22r5iIDxYtAoB4jBFCSYCgkQBqXbU+VAEMEAxObFEWF",
                        "mDCAFQgETBMDjBABV6PM5BhaD4QIywq2hGSzBnEXiUASAiEJGgwajQ6qrTBgkMCFcDAMCBRpwNDx71JG",
                        "MwlB8iD/+9RkYoz67WBFA93jcAAADSAAAAEuwY8ST3uNyAAANIAAAASwRHmgzipt/zEA/IjHJnCAgDOQ",
                        "IwaBMQDgKMlUwUIjEgVjEPp8CEOjQKay/RgQ2mKI0HKey6AULBlsHv1Zy3cgscBihxh0Km90k0uEy4cD",
                        "JiYVRXPdyWMRga0VB+a4HQcJYKQkhYfmQQJGrMUz5DScu/ybiNAS9++a//wx5uZIAKtLPXZLR7/8f/WZ",
                        "CAw4FxjZ/bTroHPeaLgIARagwJwHDAiBEMGsBpnBgHglmDQFgdBLw5g3BMmDgDoYj4hwFBHMGgDYwBwD",
                        "0HXCc8KhOg4BhS0v+MASGO4jCKgBAEAsvkYLIOBgFgRK0NWixgGgkCQNJECsIQWwgBAwBgNTL+D7GgaH",
                        "K03pgeABGBuACYEoBCiiAswEAPjAVBgDAAFNzA9AsMa0akEgKMlMFMDIwHwJRgBcwCwJWLx0EAXAQLMI",
                        "A4cxY5goeHRuyNJFb80MkYaX4kLXYXiYfAZkAADxmCwhXKoCeKBAYFXWqvyPLEOKbKM1BjAxqHjM+jPy",
                        "AXGuYCXehkWGwNQJoAKCwueaGBEMiExjwgsNbMJFQ0cjyoCmtuoYhApoUQP7as1rskBIRaYYSQJwgoEw",
                        "keasDAsZYE7HLffcIgBDxNHFAea5U7U6UaCxILSsJWIcjOFyGVZt/mvgvzru+fjlnn+OLpmCASPDF8rc",
                        "cCgUimqvd63UjaIoOBDawJ3//9XcDNfx9D727YAAQAKagMAXMAoHAwGgElVDAsAeEgljk0cWMBQNAwCw",
                        "zzEEEBMA0FgwiAEwEBMJATDIAZf8wLAWzA6AXEAA40BOh2Mh1QYwJAVxABAvAwHgaTCEAMS5JgDEDVbj",
                        "AkBuEACwIBsThAQBZl1hqDQDLeQGSgXGDQAWBgWgcAylWvMLgxMiHgOQqBOCgKTE0HWMA0BVQcwZgGTB",
                        "QADMH4E0HAxmA+AOwcwJQAjBUAbAQRrTnkMEg487RBpZLcXcMkwwMPBCAWyP+ABOBTkXqC7/+9RkZoT7",
                        "z2ZEs97jcgAADSAAAAErlYEWD3eNwAAANIAAAAQWiyZx3k+pXRmRiAMBypGicwhIRK4wSBkW2fFUEGAg",
                        "+YzjgsA0vwwMmDgiAmir2JwgwOHCULAoWr2RDBpeHx0X7TgcswYES8MRnsfzokOTXjAxGNnjtBSOzRCN",
                        "DGQec3+ZSxONAko4QD0zynggRvuNBERBElA7luZPd5WS1/WKUgOBcn5+8//ef/yZIBEumx9hNljkxc5/",
                        "db03IMIMMxb////f4Z2/P+XUwrT34joBJgEgMmAOBYLAol5wSBCRAwG16tqYMAHhgHAXGH6EMYFwGAVA",
                        "1JgY0WyqDrTzBYRAgTSgARICyQFDYrz2kGBIIkIEGBAfDxkmAgAqXjQLkALmDINGHgUFULyYXjCEVjkA",
                        "YR4pH2ZSBAoAIXwADhbl5aUwRAswMCdIF3C5hiytJgkCTskwxGA4ABg4GCIQN1THLymBglL3ctqQoADn",
                        "R9Gg63yCoNEBgoHDwWtS5I0wWIBoaDgLQkmCAub0SBQHZJbEQeMNANGpNwtenUBgg1wIApgESigGNcMs",
                        "wQCg4EmDwCSCgaIgyBF/RNdhkMhDwDyEQHCoeNXAYwOF4EZeKgwIL7Quf3kBLpgUdBxjM1AwAuNDJUER",
                        "j4Hzmf/K26g4COYhgaKEZg4APQ/4yHSYvrvbN+e2yrYzrVJoSBUn5+e/3+t/qyqsknf5koDj+f//7wZ/",
                        "SzVZ3SeOaiKbXKVkpgGADgUAcwSARTAhAXFQbBkHg33HwjBUA5BQJxhZBchwEJgggWmA4A6gyQBGCgXM",
                        "DhwMChJBQRkQzGJIonT/sGApgmIwLjQ9qDCROGEgJBgtgoICACDBkTzEICzBwSgwpzCAoj3E0TJUSTCM",
                        "ByAIgMABQZZg4CZg2BESAgTAgVSEGV+OIY2DWZXwUEDYHB8YRAEYlAIDhpJQNiYVBpGkwnE4oDqCQEJE",
                        "jD0I2BQ+DAeWSV8Z0KjOpXEioCjG5lGiKWzAwLMTDg3HNTDYTBQXUFD/+9RkaQT7rGBEg93jcAAADSAA",
                        "AAEvIYEWz3eNwAAANIAAAARAuMFgVYgUBTCgwTJbAECGBQQPGQxaMzmrIJgbDAkGCYYGMgQjoDAozVAM",
                        "ZHIaAYwUAlOCUrGuxyJJpKGWCIYGKhhCNY4bU6V6CQCSkQ2QoygJJN3iqBAqAIP/VWCxwAMkUPRuNUms",
                        "wCAYbWcOkEwEJmcxXB79QAp2zSGY41VVbHL9c/7t3v6rwWHA7vM0kst4b//1tKcaAcioXRyZR6XlDvKB",
                        "yACADMF4HABA2GBmByYCwRZgsgymAoAWYUQZRqSqlmG0DAChDTCrCuMDcB8wQQBTA8AMAQGsDpzkAfJ1",
                        "F1TCcMwoOJu5XIkHhhOJQYHq7AoEYUBpAEEAOYNBQDQnMEBPMDg1AAORU4iPYxwE8yhB0qgIECqBgiMG",
                        "gJgVuA6BAMAcwDCeJFgbDDIODLpazK0JzG4gDGkHQUAxgOAhgUDYVBUwrAMweCQwdEswFAZUpZsRDc6Q",
                        "CjGguJAAWtAIJMDAdLhc8HsWAgLdoiEAGCBicKGWXY7gsMp8gDQkHmGJkGBxeZZEIoDCYKmDwqEFcoHZ",
                        "swMmEA2gEJASQi4xgHQUHjAgRfddsTWBMGhdxQgRGHjoDiUFwGkASgJBK1btSxchx2y06qhqELIrJBs4",
                        "XuxOGKKk1HV5MiYixMwEek0VWKIAgDmHAK/M9YkfZW6V2HpqHXplnP1/co7SUeFaaaipxefRuJa1h8HR",
                        "vLDeU2761SgdsGoSAg7bfxiFAEwuCIHDMYSgOYnDwYSD2ZShEYsAMeLWYEDEYViOYpAqChwcoiFQwmCw",
                        "kEpjcRqCmJSGYPGhgcKGHQidpxxgISBZFjyMMMDkyYMiQOmAQW65gUFJMAoCmCwgYpDyipuVYmICEncF",
                        "wIYgFZg0CIgg4KEQaDAARBQxCCwuChEAkqTPKgCA4h6YGAgOA6hZiYWCETmAwWKBoWApcRiJcgeGzlzc",
                        "wEEHgUvWCQebVw1yW+/JctYYyAfFRg1RRIgViY7/+9RkX4/6kWDHi7zbdAAADSAAAAEtDZMgDvdt2AAA",
                        "NIAAAASAoLLQQVIQUuyYOFmFkQ0iJKGDB46DG8naPhg4wDgcCBxhgyCQVDZ614tupuWlXkYMNGTF7MRA",
                        "AxSmlc9agtU8WnHtRvV2BlAEB6p1Lx0LSLjidEPRx9HoepB8xAQNOJyITMMBHpRrnIvjtaa62imBhZEB",
                        "piQLFn8hzGxvuP///llKo1b1hGqaz+X85uzTM6xsfwwFw/MQgdMVxiMiy+McrvMm8iMGDTM1gDAwNGEI",
                        "RGGIoGD4emGAPGDYLhQVDF+KzX8qDEkMDCkWDDEPjC8OTHAXzIwrTI4ezCgIjHkdjJ4szIQWwMTAOGlW",
                        "4wJAJgYcAJegRAeYUnCZrhEYFgiW5WcnoXraUGAsYEhMYEhQYjDaYXhMYiiEDQ7MHg7MTAPMBgzTdLAB",
                        "gIEzAkpDMABgwEQEFyfaKYQCTKTCh0KDxZg1cKDH0xgPFgtO5yoMIAFKsHEZlyGdabmEkphZcZ+UGHgC",
                        "QwJBku0o2oi0KNaCmhiIASgxCJrRFiwlAzBAowwRNnMQKQsCX85TIYZQ5I2CIGNAQBo+BRdLk60nJ+GK",
                        "SOkIUaEkIDH+Yi9d1/oJUxyEJqCgpwlH3JfOck8wjaWqMhJR4OElxCSsBC5dUfGiMIIBEDEosmaxtFlc",
                        "rixnHu/y59u3r///1SxeKY4d/98xzleev//w5gw9r9lUxBTUVS8ZgogzGCQDqYDwUJi6B0HrUFKYmwDY",
                        "OBIMFYMEwFQCC9RgBgDGA2BMYAIKBhPgcmm1Wn258mOhFGOQzDBfmAQMqgAQRBUFTAoRDAIHT21ajBEC",
                        "TFQSwUJKgTXoFLoGAgFhQUzKZizekhTDIFh4Fh0CVrCIBl/FQBlymB4nGhrRGFgcGAIBIRICRQADAEAS",
                        "2RQCQWBMwrUY00DMwaBIwyEQuUl+0d+AsDUMTGofNeakwOSzCAAbkmC4AVABhMNAgImHgoZMjZjE3GTh",
                        "MukWGpQALsqcoQBMxIYzF8v/+9Rkbgb7vmTFg93jcAAADSAAAAEuEZUUz3uNwAAANIAAAAQMsolKEDAV",
                        "ORSTu0IkETBQvMDiU0cqDDIvIifepWJQ90cAicxgc/GXxQk8zp8XlcKQM6SmAJhNCkMyEFUKC9E/aqTU",
                        "EkgrMUOEMPIGKsIVWSgf6lgpfZhMDGRl4CQGDA+DgbuVV7lp+TJYBNqC0Rl1mr9Q+3Key3//vJuAYALH",
                        "/+GvwzaYn3N3////UyX8pMf/98vVkTULu5NTj6QQCFQAAcAYYLYRxgCBymF2pgbR7cpkagwGCgByFQEU",
                        "ERgWgTGBgA6YE4ABgAALGBuGOZKyWRlkhoGCyCECgByQF0wBwAxwAZro0AyEALGDqEAZ1QuBhagcmBwA",
                        "a0VgrXuIfA0EcwTgTTAwC3MscH8OAlcd2IMLdpjO2vkwGQKTE8IzMGgCNM+RSVu0Cp0t3BgCpgYDAGEa",
                        "BWYIwCBgsAItMSanp1gBcUxMSTUVoMIhaLkoAeVymcAkDKqqmMEH8+oTDYQlMUDNCpK2NV5xTIxYFDco",
                        "MNnoEw4DlEmvzDR4EJg2W2HimakQph4ijyOhFPI62TKi65kKSEgzS1pO7+1OrDGEC+awKhlIFKGiwF7+",
                        "VNJV4mMB2auFCw8DwAYbBDXJ2oy6GTV41DgqmIgih2tdqRNgJg4Tmmh0ZED5EDrKZcuw7/6+tNl9goEX",
                        "4z7Ut3/5EhAHBIpQXF8v5z8lFwSH3gr6/WPOTS8pVZNPTcUriFWACAgEQgEGBEBEYJ4CZhoBGGNCiufJ",
                        "5cBmVgumFkBYYFIG5gYgUmA4BsFQIw4DUwMQXQqEQYFLtBhtCUDwdwKD+MCYCYFALGBqAORAKGAqAIYA",
                        "gIJg6iLGaOXSCgpAEAUTAAtOkuciMAQI8wIgRTAKCRMwcHUqgRNMSNjICAES/3HjBWBoMQEjgwWgHB4C",
                        "KmaxOTD8xpvDAOHMMg0GIwXwEAUBarFRXqgqBgUgjLB4O8so2gcgw4JgN0gVF4uEkMDRWFF4dGVIc3wA",
                        "UjFYET7/+9RkZ4X7mGVEs97jcAAADSAAAAEuqZUQr3uNyAAANIAAAATjGMPpCESaHMqZ5LRiMts1lFuo",
                        "6KWwoAjCI1O4h0zmVFBoblDJqeWMxf8sNAxkUCYVQ5L6m6uUyQjYzetRpaLufrP/1JU9DEZ3NkD0wQGn",
                        "tfABCVnHewYBRqauNY0S0NRkAw5vtI6Y4CjH7FMSA40mHmsUZZiRY63+vzsoyDSzk9jCvnvWMGEhQaFI",
                        "e38f3hXTkMChy7bz//pu6Smhuw/PSdcKjAQLOMDECYwOAPzA3EkMgpmM8cIljCSC5BwPZgMANmBmBuYD",
                        "QJo0A8YMAFydJgLBHGUGe4ahAihhIgZGBMBKYGQVAFAsCgK67jAgA9AABZiBB8mRAb8YJAFiVqtS4Y1N",
                        "tKGAZxEAAIwAyZ38wagAEwYYiyV6wDfpaGCiEMYchhpgygQJyN87sB2b0NggAowMxXDKPDTMIoFppjQp",
                        "z4gpmJI40ORzgHdM8nMWWrB3fZg6ztsqBAVMQjw5GvzHaEAgtEgGJAp/ZqJv4YsZJlCUmmiUPQcaCTFb",
                        "c6+YYITBAHMnKc1Y7jER3CBE/Ldog/85HyYQmF2MaYIUZikvsX8pmOLzMcsgHLmGK9TmVWODIPMwlM3A",
                        "LTGQtex9lCm5S2YbmMDk1+qAoKBoCFvKe9+7jRzFSLNfgUSE5fl0jAYeW5X1/eZXYIEIPMIhaO1L0/O2",
                        "fzjBgUJBgkaRGq/919RjxgoNyqBb//2fntlUAEQD/feMegOb2LYVgAAABGBABsGALmAkC4YMYD5juIyH",
                        "bkq+YnAbxMJWYGAHwiAEMAsCEvGDgOzAnAKMC4JcxSUOzN6CVMB8DYwRQHTAVBmFQDDASAaJgHzADAgC",
                        "4ChglB2GKkV+YHAGI8B9LYer0kBDAI6apgSAJGTmBYDgSVyclSNDHnlQLQUMHomIEgQuTHo3HrM+74MA",
                        "KMHMC0yKQTjBKAHREd+GI9HR0CrsMWHoxhiDF5jCoBeqkg+UvbRpOmPUWdBJRkoMiIDIqtf/+9RkYQb7",
                        "CGVFM97jcAAADSAAAAEwFbEOD/uNyAAANIAAAAQoblCvoRIgzJYgQIwoHk14tYja5C9YhC4NGhrpSmHS",
                        "EJAt5Jc0iUxpwnRMos820FVuVe7xxpn1RuMzJcmJMVtc53dMlqZWJ4dbTF4FVdTu262FeCAsLTALBMLA",
                        "wHB9JODr9i3DDthYEmpQgSAZJiGx0HynL//X/k3UWLMHdz/f87YQbKwg+FjHWWeErcQHHKTtrr/uz29J",
                        "2Le/HNoBh2gwBAAqAwByYDOAwGBJABphRYpEaXCKtmDCgYhgawFGYCKAMjoBYYAeAmFAEgYAuAOiMANM",
                        "AmAazEQefMHQRMCBJGEgDUNA5hgHBVBmDgDDAOBBJQPjDVDdNEcu4wmgqgMAQxeMSiieAqg6iQFZgZCU",
                        "A5mcFBghALDUW7GASAFAMEs+MAYFowpTizAcAyEgAoJcprj/Ok0cGgLmDuKGZFoZhg0AOsAf+BIS6wMB",
                        "4OLhik8nS02GgQoWSXDWFtu43JxQSNREtTZT4MJCEMKYYLA4Ou1BLdEnTG5+NA4I1uWjGIgLeQqljys5",
                        "IBBQDmMwOd1KJmoDlAEe+WMtfKRNyKgJMpYEwIZUxoZmquVarTFUPnO70YFCLTqXv6wmywEkjDNx0NBj",
                        "J+rDIW7crSkuUZQjxmMggoPGCADD1Lclb+AkGgw0G2QyYXN7yLLLlQNe3z+71dbEDhHW3vV/LeqEQiVS",
                        "OVTn/+ekCgMVJNKbP/V/dIWAgp/eX71vXf7z7e6zBfkqAEmA9MA4CgYBVMA8KwxaUvTXXY0MS0RcwXwZ",
                        "DBpAiMAMBMSAsBQFxekwIANDBxAtM+P1OwxPMIgoMMAnMCRPFANGACKwSCocCEETCosD/QozCMRTAQC0",
                        "tn9eqOvsQiCECGYcK0cahAYtA0EADIZeWxUCmYyGAWZqQcYgguIgeTwjsCVn+Z6IgLACOmAI5JVNYlc5",
                        "SwY6IsLDEQWNLXMw+MC8jE37ZZKI27AJJ5lQ2HejKZDCA0FFLpXMRh//+9RkXg76mmVFC93jcAAADSAA",
                        "AAEsxZMQD/eNwAAANIAAAATLhiQpmZ16ZvJhk4BkwUhykvQEkCYMExErjYCSMYh9d0Ryg6kv0zMTDbVB",
                        "TSYNM3Lty5Zf8EAo2gu0JzQ5y3nrfGZMrNWA4yqJ1fxO0+nb0iCgJNElUx0LXKTSpdbuR9uIyQhAUBaH",
                        "kQKZyjY8vcf/+dwUXGhvC8Ob3z8KcGAdScfq65v+YNbBIFpod7z/v74lNB/+5MwJgqALmARgIhgJQCCY",
                        "EmAImETBCJoHgGMYM4AcGAfgEJgCYB6BgGEwAcAjbQHADCEQGARjbDDj9cGjDABDDUXhGQpgEDaRQYIp",
                        "gOIpgACpgsgR+2+5icJRiCBxbVTB5aNGokEExHCUyCt46XFoaHooE6IyoGgYt2WI5GAQCGrskhBkmJoL",
                        "kwQqfgVpDfpVuCYVquamCoIQBaxGZc+jLF2BYCmUxoY08hl8nCxNeaslopYSAuAgIYzP0eNBGk0QME+i",
                        "IPkQehLlJYBQHCAvDmlDo6Z8Dj9vI0yONdKAmYbJxk5AG7GCY6FD7xCA21lnaQVBYMe5tEJsEi+Hf5bd",
                        "wUKhwcIixPFgJbww1nUWwYcFJq4MmRhsNAph7DYCtTcALLNWAExkGjHoHLZyGm3MQG3pYHAGMgBHC1nE",
                        "GA3Vy53//eiQDohW+Yfz9byIAkv7HHL+b/cgEYCrxLDX/ai/kgEhXD6AdYMeSUmINQAAMssAgQTAFBGM",
                        "AYM0wQleDDTarMJsNIwEgbzA8BKHADjABAjMAkA8wPQEDAGArIQjDCOTAMbkO4GANhAcJgTARiQDZgDg",
                        "PmAgAeCAAQaBEMAAGP0T0jMBgQR4EJOVdypSEAAYBBMEsAcwbyyDGNA2MCMCcSCHdu4oq4CgC8AoBUYs",
                        "Q3xgGg0AgD1d8kY2kWlY18qADAEJsWPlFgJHzk0NrITkaarYZABJwVrmLjPK4o8Bc4kBBAFQwHmBgIYS",
                        "PR6sqmQye0cSBaa1IqigJAQnMVhoyItDSidAhcj/+9RkbgT7r2TEk97jcgAADSAAAAEtlZUUz3eNwAAA",
                        "NIAAAAQuNK9cpHwUAAGBYECxu8FCR/VzDUmeSKy+QA0KmHhWLVJbtPG3fw5alJhkjm9iyYBAg8AIrD+H",
                        "NbJQIYDHRoAcGEh0yOLt2hjLHJjRmUNGjRaUJ9KbDHvJUrYYDGpr5JgUeDwwlybKnNjvMP5YiQWEpENY",
                        "r3dz93OwyJCJCB9IKpe447mHKMGBWy4H/h/Z7IsATD4L5vxUcdPVAgABNJHAASUA8wSgWjFFEpO0cboy",
                        "GwAQwRgwGwKQ4EsHAHGA6AeYDQA4hAYMAICA1p+I2OLoUD8wJBcwMCxQIKhOLBaYChMYCAIFxoNoI9ME",
                        "whJhDMAAKTcZiYBg9FzCcKCgyjAh2DIUKDDcDDAEAqfBIJmyh9wwFDo1zTEAhKNDaTA9IHbBgEA4BBIX",
                        "wKDZEA4lxACKiNyjMVAAwECgUJBI4GHQua+U4FEZEEpmDQCIQqHxGGxYBjgyMRos2WmjGI8XWJB1XKt4",
                        "qCX+MMBZSwwrEDNo5MNBABCNykKEBAsAU4QoHzBozMuD4FJCemUgkhAQBL/qqmQEUajCreXlbE4/q0zo",
                        "gAKg6nmJAEjgwWCLljuD/mIRkVo4y0O0yEU17Q939MbMPIcwaWxURgoRyD/xrOGKGsWE5i4ZgYIu+IwB",
                        "B////+uoT1H5FvPG/+tR0KBNjurG8dfrN0CYXT05//rLek7p3tMILcQNXpVAsEGAUQjhoJQwDgqEJhOJ",
                        "hi5RZ/NphiwHphCIxh4JJb0wuA4wxAoSEAaA4wqDU1GmT1g8MGBdXIhIRKBETRQOMtJQUYDFp7OcCIUI",
                        "8EwcBALWiYCJ5gMimkiCabLJh2kGbRUCQaxeF2xEESsGioAL3MsNsHoVCZgcaNpT8GQgYADRg0OAoamI",
                        "T4cqDY0qIrcfpNMwcCDCguBoJMOCchtxkg7CQLgSUmGAgFAsYYF6Y4BDxgNBm7AQZmA6XymhWEhkQhAD",
                        "S8MEi9aRjkDGfQMBRKDi0MD/+9RkaoD7SmTG07zjcAAADSAAAAEtpZUWL3dtwAAANIAAAARgmELD4DTr",
                        "biQg0xcUSABy56wSERYXx697PjDhAMXi5ZrgJlhxbnvtx8QkczkljDgCCAwkiiKoJO0GBKCyEXGRgUkm",
                        "X4QFuVDXdTKsxgoqGLyEW9LZvnjzKrGyqFQdFjKYFLpSkqAF57/4f/1YIHBCYrDEooLWN6zli6YwIV15",
                        "xGB/vaxjxVAQGTCXqnP/+tf9HZPagBBAB5gUgdGBkC4YLYKZgWktG9EdOYMQDhgfgChAQhgOAZDoHoFA",
                        "EEgYwSA+YDgNJjjv5oEGJiMCb/mCIHO+j6YMg6BAaMUBMMKSZOoDbMLwRQkmF4CgIi3WBgFAkETDoOzE",
                        "cQjCdmDE8LiYHzDQAGuWiqARg2JAKDMDCmYBgYapkyYEBYKhKTADLngLnhAnAUCgcCZgKbRkcDQWAOtW",
                        "9EEzslMEBBooEIoa6zmlBBeivmYSEKGmbByyGRmDjh+RqiwwhIoMCgAAApaL0jhMneY7ktgM/CHQMNBU",
                        "b0zkxmsLUMQEzr0QzkEjq+zCi8lGjAQxQiHSUUMa8jCg0vSIwYACoYTb1GemEABto+Z+Ahh6ugvyPEFm",
                        "tUKoKDVw0okCosIhQvcPAFJfwrvgZKLq1lgWFBCf//+MggUOZDDQQ5pNEi60L8MsN/vJRsWMHt08msP/",
                        "8lMHulbv0fPw39ORBdO5///8/2ezlvStVXJqAAAAFBwQxgEAAGB0DQYHgC5ibjKGpaOuYRIOSA8wIABi",
                        "ABwwHAECIEACAFDQJBguiImQcfhDPmKgCmAwPDIHjgOhYDhINAIHRgkKJjaERsGTojAMaB5CSAgmzEQO",
                        "gAJEEhgeIoMU4waDAvEBQTb+MMJMCQJMJAOAwdmNQKBiGGFoHl+X/f1k6aJgCGINCkWBEwwKIIBYeBJx",
                        "lYIZBgFAgCI5ZoxIXAH4VlUqmbueMgeN4OMgPAy9cohcGlYoLzK/2BGQRAwis9hrtm8PnAOJIl7RAFQf",
                        "MqGIlj3/+9RkbQD7RWXGm93TcAAADSAAAAEtKZcfT3dtwAAANIAAAARqYAwmdZYPgHyXwYIkYgcKoYbn",
                        "1VDe2g+6562zFjxYvM1JLWRONk0MMFCCI8vFAKi7/Tt92TEHgCVa+a0aapUTIIP13CC1ijUUSvoaxmtv",
                        "tSDSoOL3Argtd/5AnnzJwbP/9G0k0iNZiR40Fpsu1c5gwpZ1CQKHMoI7bp71mHChKvtp3///+mFw7FN1",
                        "Pve3WAECQQAAAgNBAMC0DYwTQEzBmCjMNIx82UwfDBtA7MAcAkwHATSwAsNAfgYAEwAQB0AhgLEfnCpf",
                        "FCjGEAHmBIBiIBzAYDhEChgOBBggHxgq6JjOKRlKHRiOEqGphMEalrSTAMLBgKjIE4zL4EDI8NzBsNlw",
                        "mA4IKbu4qMwOBQyFCsyhEgwZE0wTCZR67RxgRgKWAKMADDMbQWMBwMMAxWAwrJxSmatgQNCTlN/CgE1I",
                        "cgiGTvltNAQBDjZ5sKDpMvPQFQkwsgEhKC7heg7NpMKPyIbqsaCp4ZQIzsBGCCRoIiaYajyQ+1x+TDiQ",
                        "BCbthUDMhLkCQY8NS1ESgRLltCYYZAsLdgb7FlRQZHXkFQY1A4DgQSCpT344FwIBGQwAGpJRhJeUAt7/",
                        "/GoIRABRQ0WQvHv3GkLaUiBBYMTHzbE9/7Zlr/3uClIWYQ8GeG8dbWi3pYAw4bpdZ9wxrEQGwsSCMf//",
                        "/4/m0DiYgpqKZlxyc0AMAkBcWBKFgMDCpCJMMwmU5bwVTDtA3AoIBgRgKGBAAGAgQQMBOYAgB5gNgCGE",
                        "IZOdoiuYUAYYDBqYFA45JgWIZAChg4IJgiQBiJXodSZKUo8YxgCBZgAA40Cy0TA4JRAARhdRZikJ5iMA",
                        "5hkDxg4AocBL5SJRYDCSYMRCY8j4ChdMABOGgIhqMtGGARMDASMxkoMyQ0MDAAMEALGQQc4cAMvagsYQ",
                        "hUZOARnMKDwkWmYYHoYA2dROyYBBJqxGmbRSYHBk8CAiW6Y5ERgCBUIGcJSVRWHAKG1HjBb/+9Rkbg37",
                        "0GXGC93jcAAADSAAAAEucZcWD3eNwAAANIAAAAQVijvqyGEw8Y6lJgwyhwpgqLaFhAWSdcSGhhd1iEtg",
                        "olO5ZfQwmCiQIK+WQZ5VJl0giwLkr1P8mUvpFZLYziazCprY8OgCizwYmWhJQsaJBaA4oBOrOs6CAxAF",
                        "DLhVASUdS/ruaRabxhMBmXjWYYDaUUw0KX5ISbvf/dZ3cJeLBDHv/+sbL6g4STvf/86CGJgiBP//8/5T",
                        "Biked7oxqgUAgimLA4joVZhtkKnU6EYYSIFJguAZEABBgRgFr9AoAJgcAEGA+AQYPw24/rwYeANDMwrD",
                        "NMoDCaBQFMKggMQwFMPJtN9w6MOCRAwtCELQAD40ETHwsEZgmGxj1IJqGPZhaIJh4JKsD3O4u8vIChnM",
                        "XH3M4gMMBgDC4UlYLSt3GXmAADGFI3GLsDGLwWGJgRkQmhwewMjY3EvkWAIMnZAGn4wyAWiAIWBBGS6U",
                        "pGgKMjMyNaDN5sGAOPAoMBZhAB7f4dBpmEQmQJgYxLxg4Cv04Y6CU4BCCC1iEk1BBBULAYZ0UuaMCgeE",
                        "BCcMHj02wcgCJjCALjPaEAANSDehUAGdAyKBcoGUfS9ZSo8DgsvFFI4ELTKIEGQGhzrYYpSr0FQ4aoBJ",
                        "ggOqa/nrO5DRUEhqE4DoHatlypijYIAMYJFZs0dGNxpLofoIw3Qu9W//+rTaQ/GhDY///CenmqBQDzmX",
                        "/3KpStij9Nv/5/6bBBeWKpsiNcAAAQAwBQOgoA6YBwFxgJgUmJkP2dMIGBgogFmAcACgGMAIBItOYAwA",
                        "YNAmMBUH8wkAxTRnBLMDoAkCgXmAoAoAgDjAjAdJAGTAiABKgCJhrAlmReDaHAqBcBAwAwOxgBktsMgR",
                        "mBQCkYIoB5hABVgo+cwFwdxEA6CgBk7XIYOhgYBIRpEQYYYgCRgEAgCwCyrIi+DcxABQYB4ARglhKGIg",
                        "BkCANRIB+XtxAQGxIAsWYJQJAfNG0GAGDGAF8AcJJbx8y9FMYFDi3A7/+9RkZQT73mVFw97bcAAADSAA",
                        "AAErOZcY73eNwAAANIAAAARBGCouimHL7xNSpCURNQVDoXoyReMrAOyhSJakSOxYzTmOLSDClIEibV6N",
                        "u4QHI9rnMGODy4gAJwsGMe3HnaJgGGWUnltQkSoVROBHIkhWAo+GnIx064YuGA4CGACLczKgO4pKKAtC",
                        "GQp1pzv/uXjJgdkMmPCaWdjLG2hxUwBhieQCGLH7ydykcSKBF+8v//x4SALe65//jhqGwwOr0Xf1hcp1",
                        "5lA3f5///8tJ5HkKe7UkUQAAAEMAAIQIjARAKMA4EswQAAzljAtDApjAhAhMCYAUcADQ4tcJAKwoDCYA",
                        "Y2QL7siDdTEIK6GwIGqkUUTBMPgu4xwCFQ0CsqIArYnMAAPhoagAL5iAyxqiDhgkVpgGFJg2DBeFX5aB",
                        "1QoN5g4+wckIODVIV+J2XPkFQGEAGGP61mPQSmDQEioCVpSYIBGqsIA/LADhaugEGBBAhjTLn4aQYeJB",
                        "g8GBaJkoHMDAMxSHAcPnu+WLDGEBuYgiZhsaiwof99WzxMHJQLBB0TFTrMIjcxULw4Tyx9c2lNVMJhcy",
                        "M3TBIbIgg1enrRtyZoRiUx0fSIIRmxp+4goqKAQKkMzEWQCPXRZHKs9Mhhy8ZoHo8KXDr63hddAChAyC",
                        "bgCEEor2vsJ7UohDJm8hhiSbPY3S5jwWf7n///6+XGx/+c7YnVsl2LGXO8vdlBUBLKt6////5W5qsItU",
                        "lUAUEMAUAwwIAJQQDmYQw+B2riAGCyA0IQHDAzAYIgJjAXACSgHQcSgDMwTDYjQREgVgEIBhgcAmjQDZ",
                        "gEAO2h0AkZAkMJAxAxoQwAgB18jAKAfCAH3fAQFZguAUmBIA6QE/GEKBAYIAAosCWnEtRWNBILAHmAsA",
                        "mYKZCxhrhTmC4BUv2Wyhy1MDADAhMA4BQwfB1zDDBHMEwBUwOAB4S1owCQJjAFAXMAMCokAnNTPMIzRi",
                        "YBts7qM7PoeMdkEwORzQA2NrlcwCGx5HLufeNOn/+9RkaAH76GZFC97jcAAADSAAAAErfZcVD3eNwAAA",
                        "NIAAAAQIguYVChnBeGRyqrO5TzPMIhUZXGpggMmAQsaAlxlMskodHh1F6dlMoRtEiCY6fgUEKJcFTkrj",
                        "r2T44BwamCUQlYBaW/yvL9wqAgwAMzK6aMQEuDk6MdWq0uIAMafPlcBAzuXa19RRBs0QHzFQsk+WX4Cw",
                        "BUtBg5MpCgwkCI/O44x0wYAZbZ/n//HrFgjPc/Heu/GAUGdWf/ePMUdSYE493//3mVWi+ukcBawgGEIA",
                        "BAulbYFAkMGkJsQH+HTCEmEAJmAoASLAdAQDNB1XhgOAJmB2AYYFyGh26H5hwApEDhhQIhgqARICrEhA",
                        "BohFIwf7YILgSAkMBcwIAQwTABG9wURxwJjDOADPYXDGAQAECz/wJJ4ca8YMCMZVlsGY0Y0BC7K3ZVBa",
                        "2hwKyAFzLBQDPcCBYO2FSmHy0IjA1AMYCC4Y82AVGIKH6V0MxpOcKAQMFJhYqGO9IYgHpisVkwGd1Wxt",
                        "I0BRICBMaLfxmAFCxbcxo8uHQgYjCiCxbE12YjOQuMcidBND9D1ZJQD0ojP6hMeDQeB07MQzMWmkEgnE",
                        "MbMMD5rCuIZU5sXR0EGCRWYSUKiakEL5N37tZuRn5OiEWEwdncsM5huyeJl0SmTATT0fPzZNApCCRhig",
                        "oqyC3+6dEeBbXPx//ekWE2HP5++2ok1qF46/P5vJ9YLy/X///E3DvOtpW48sNkTxGA8YDgAJgaAcGQpB",
                        "0eI4XQcLgIQBjAfAMMDQAcwLgIwIAMBAWjAdAyMBtkQ79PYAguY+g6YsgCrYIARVEmmYdDYZr+od2E0K",
                        "hCJAmYGCMGBQt8EB9E1mmK4zHChBGSQpA0HGiv1XfZZRiCIJgJD5pWKRgMA4YByVLzOYscFAgYXhqYD3",
                        "AEFMChVRSelpYUAoQgohmIRmNI4o3EejMY5BRUdogAjOEbjBgkMVio4atzNBCCC01xoTGjA4NcktyKn8",
                        "yrpzLB4AoIbq3aIreBSbdIL/+9RkaY/7l23EA93jcAAADSAAAAEv7a8OD3eNyAAANIAAAASA81VdwKfg",
                        "wAgItxCkm3cAyBAoUNFMU1GDEWWvxODJXFpSQgk2tKDNppEgCJDdi6SNqkTeBwDMRO4xaXx4Oos7uZzU",
                        "fLVGjykZPIRQYeYZ2ImnY7xzQmmJjGRCO5vVcvjdQYM1LgmAUNWu1CoAwMIoxOZ//fyrEQ9mcv//mMJW",
                        "JAKFb/lTlJNJPjQyo/yx//4o6UAO/h/93lre+/X5y3jQCQLDAqAoHQYDBxCIMcemI9owjDDqBZMCQE4w",
                        "RgGTArASMCsAZIwwOwPxEDEYRTgBnGeQEEMx0GoWJBK9EhQYtMYGkwYc1sfYBiYKgaoaIyIMSQPQXMDR",
                        "bViMBhFMhabOGiMMKBOMCgmGgFak1GgaCYGG+YuYaZoCeBgBUyXRF1yITzAIRAwMjT9RjQQCAgG0WFP3",
                        "gSBRKCxbUqiWa36pz4AGJwoYSBMoQZe0LgEEocZVprr+mJCoAQoYAHDQBGDTI4GUahseHBzpLmryIDmI",
                        "x9UDSQsDTIRAAgBMLjwxJWjAwIMIDkKAKVyd1WMGRQIYEKBpOxAgaiQTgjk/K2rKxoGm4SCaIMRgUCoT",
                        "i8BfSb2vIQAsza/TBJiWqCgU/NqzPRkKjkw+4wIXTCIRZtS2r0laYIhuctLJnAQDw2in/dLbZJFGUWeT",
                        "AaMaw04IONELluX/38Ed0w3mxy5/44OyHDBs3f+zRdgBDiAhxKdbw/m9Id3Yt5fr95c/n2b/TLbqQAMB",
                        "TMC0AsMAiEYJ4Ug0OdkIEwUABzAfAmQiMA4CYgARi5gDAYmAUBoYVadgtzocL5gwIZguFDJUQmLo7Dgy",
                        "mXKIneQkkwppOlUNDB0IHLMGAkTSAI2mH1shwVCQ3iwwEwEI1IoIVgwHDAYOjGImTSAaSIEpS+0Mv0n6",
                        "BQQEATGTLTmZwNjQNL1tQIhLJALWSYQACZCtpnkhDI+BRvjCadMu0wuTBgsGeowaXIAkRQCQAMJC9oOA",
                        "EeXKDS3/+9RkXgT7GmXEi93jdgAADSAAAAEvqZkS73eNwAAANIAAAAQaPthhcigIetiae/yUhh4TuSYC",
                        "EptULmUgqYVEokQNSmSJukwcHCSFn+YGC4cGqXKI5w/BxKBTa0bGmwNEoBBl2mt8fhuxYARqZDA4EtDL",
                        "i2seTMoCw/MwhowAATBoGnv/OMM3ScNGC8vQrFM631QmEjoRMZHYiF7+0v3VkDAFyv/3+/XlpMHoP5//",
                        "y1abIh/R8//7/W4BAZsZ/v//NuokAL3FXfw/YgIQAAAMQABGBAASKglmCwBAYrULRx2hTGBeAaYA4Hpg",
                        "WAGEwAIXAMVMIwQ1uGBCg0cFEkYYgIY2hoYGBytsqAg19DkDBfMFIhNgiRMPwEMAwHMBweBQ6pcA4MxY",
                        "ADA0ezFh7TWcTzGouTIgRzAIAkawoAyIZgULxiGP5kU/RnsRoYMSwrQ2os3SNCoIigNGADLmKoYoVSmw",
                        "8Q4AJUAURgKIxeNEUQ1SVjDBkGk8yxQ50jA4IMNBsxqJTQNYMzF8vSDRgYaBZhEDhAhiLBzAopNAts0A",
                        "H2bNWykSbRisKM+BQMMfNUyGHhgFllZiIU8fQlGFxAakUBjMlKcXH/poOnJlAgZLSQjGpgoKAoJQO2a2",
                        "OgJlCpDTpzBgGa0X+7nlYggkA5mxOgImhwNlsvt/UlIyDzIomJiFNU/M4+q+aayY8OZiwNQfYzweIrAs",
                        "Uy//5nKBwAGHBA8mVjuFeMWI2YbBjF6K18ai8Tl4qCAcN5dzL+f+3QTVvfag0eihCYoAIAABLuDQD4qB",
                        "GYCIGxhWunG1CGIVAKDAABVSrAoHJgQAQhAA5gAgMhYBYwbSbDugPzJMDyYTE9HjMAgiQ4iwVmBIqmH9",
                        "rmQwoGDoFQhhzBGGkIBxswNFcwNKU1xC4ACuSgamkriOIcACApjaDxiFABlOG4CEpkrMkUKrVDAIGyoK",
                        "5iMQhnOLTVlHmov+sIl0TAEYNgkYJqRjgYGNCoYnADcGeJUqmlJjIlmS46ZqM4cT0xDAYTL/+9RkW4b7",
                        "O21FQ93jcAAADSAAAAEtHY0WD3dtwAAANIAAAATPOmsduAkFDNTvMdhFlgNAbfxFZebBTA48MYOQyych",
                        "4WoVtEgd0XYUdMACU1KWjGQfiiOd/Kafd6FvBZdmNQMwEWDqgbbt0EQPgkMExpAuBhkSTXLLMcUh5KmQ",
                        "YdQxEGEoUJ8itOg1iHEPzKAcARLLvxCXxiMqUQao4Y1HhjcILMz19Mji9v8+V67qRBcF853n8lfxAaFF",
                        "bncsKlikj5ebf7+vf/Ws///338/1rP/3VQwJIYDA2mBeCGYRzmhqzg2GDoA6YBoFYsAS3g4A4YDgFBga",
                        "AJBQB4wdQ2jyonTGAdDEIMTAACQ4GwIFAKCAHB6YNhYYByCZ0hGYaCYgwW7L+joKAAGBEB5hGEpjIrhr",
                        "OLxgEDq0R4M0cUN0LgEGhigJpmyYBm+MCQbnBYFg4TUBgUCABDoSA2YNLcYBg8NAwYBgPvqeg6DJgiAZ",
                        "h8CZ0KqbgWmSJhgYOmMjSt0xQMJAIGkRvFmBgsx8BApIh6UBkkUAU7MnCzPMgxkMd0LBiuGYLOirHUBp",
                        "soYKFNdKxEplgODFL0EAQTGmV4KIxgFCAKaoomyN2isRM+ogCvI+KcJwLkd5IRc5EAD3GMDpgQci9CNs",
                        "wKBEvIQCA4tmJgIsEFQHIgvKDL6B8Cm/m4jGwcNP+7MCp3tTVcgKNQRRY4SZtc+ontO9/6kv/dhR63//",
                        "/3Ox4SAsOf+8fr1VYf//ob4bJZMoyACTd2WqQBAMgBEp8wKDy54CG4GEgVwhzU7mZyCQFY0IVjGIbMfi",
                        "8w2CTAIDR5MViM4gKLQBYQMRBQCBmDgJZ8eBjECYzYxNfPTBwYQhgCBAhgLAMXptkRAWF5Spgaz0YzEi",
                        "AxICU8HB6+zCzMFH8CTTPIZGARCQxUUADDQoxIMEgyBpfbp4YpkJBgpYqPLURVlbvA0aYcCShUOBgGRp",
                        "QC0C9zk3ZS7ktBgRFtU6e4GB0aGC14IL6K4MkbLSkQpKtoagjiKPqnH/+9RkYQD5xGPLU5vTcAAADSAA",
                        "AAEsrZEiD3NtyAAANIAAAAQIUCHiEAvRWF3LFJGXmBwwifMCEjAsbQTpdptK8S/a2CC6IKNq13EjEAJH",
                        "ggItsw5wSAokRmEonruAxguwIghIKBBhYRhwIEFqAUAQLUHCxAAghQLKdc/Xd/hXgONRvKVLtou77r7u",
                        "5Whxc63vXdcwycL///pJ8WA5bkFAHQwDgwIRAjDHD0MK0MwwHk6jKEFpMK8LgaD7MBMDAwBAJzAxAcMC",
                        "IC8xMEQMNoHKB4YzBhi4gGKQeZnOBlvjHcgMaEH5i4ugIlhQHAoLGFwYk1Bjql5Qw5CodBwHMilYBcsz",
                        "MRQUmTFgNDBMYWAJhkFNdglYJOIaBaShgELDwcMDjQ3q+TBgzEiAzwaAwwDjAQEScc4MFzDhorOJay1C",
                        "UZwUmyTgBEUOoXBBUAVWdKVypmRKFAASEIeYomhiYaAumPrwBCgMNpvGPgAcCtylzI0wkxR4GBgWKBpW",
                        "dDiucKFBAGka8qIIgAYu/MbYYDQRIJA0MGDGB0cPzaw0dCgsMmKB6uTCxAMPocRqWGTvXWxBnRdwEiI0",
                        "ZAocaACAcWEDCxIMC1BwwNHQIxUALRKrJ1mIAxg6yDAAGB6eBZ1TRg1Wdq9+7bj7S1ObGsuf////+PKs",
                        "n5////r/3leqv9CtTJiCmopmXHJyQFDC2ODQwlNVVVVVVVVVVVVVVVVVVVVVVVVVVQAAMFALCwDJgMAF",
                        "IQGByA0YKYEZgYgTGCarsZ8gCJgxA+GBuAKYFIEhgEABCwHIYACDgO2JAgDQKWAKBRuKBEFAs1rkzpQb",
                        "HRMOlwx0FjAYdMKDIwIB2ztVHAEKAlrBhQKpcmIiyaU7JiozmGByBgOW9BgcBQObWVqJFsyYdsBbkjWj",
                        "gb0IxhcSjQBSqMPiIwyMzLQtTqS9MCDwAUBcLa8pMdBAwcMt/SYbRjQ6jBKYEjlm4QyddwiFgIBjo2FA",
                        "Uw0KIBg/QrATJIkbAMNGXDTQlkSuyIgK664ECRD/+9Rkbg77KmNIE9zbcgAADSAAAAEtGZMcD3eNwAAA",
                        "NIAAAASBCNRN+CBYwCCsdAUESFFBTv8k8uJegVBC64cDGUmIKtgEnCARX4FwBYNQZ0oAVlEgRibpPuXH",
                        "MsrRCHiILVsZOYEFBgoqi4LyPow1Pp/gSDBQdBDuJERgokuFdaj4cBxqnws/O9eYCC5MZZw/HqWxU3lh",
                        "vcTm6gCAF1QdrleX288u/lhuq5IfjtpwNAhMCUDVL0KgVBgBpgkAVmR2oIa4QWRgCCYGESB4MAGjAHRg",
                        "WgJq1AwETAgBUA4OK0RgMYCgOKg2YZDCYzd2CRdBofmFQLjQRmBgGGHACDAGJRNxKgGGAwEoRGCADFqQ",
                        "KAhmY1hmaEQKQEoEtniHIw7AFyHKZoVQFMMgSCoGCgvF5wsGRrmZhigCaa66DCUPCUMyAEgwBqQQgggB",
                        "QKQTnMJIQoZLF5mV3GECM7aphAHhASCITqMTcpIBEJFQv4MAgLhswgPDg57FgswUmAYOBpi8XIWNrYlQ",
                        "oQFU6ytieRhoKHLgWNB0YAjTTAoOABHU/Lca5MCmmhAMRaTAFG+DmcXlHQALAhJUxOHW3dnryEwgIgVK",
                        "nbAoCMIH0wyMk+rL4AgeDyFAAMg6m0FwUEBxgKwSSRkYdB0SL5QwqiSC8ymBHfoaXDLLtK1gmBX/jQSb",
                        "n//61ueGQcrTjrc3J/////7JBkBSq11MQU1FMy45OSAoYWxwaBwABhhgxAGlgCNAgYBwApgmAMGEONYc",
                        "HABhgdDSBYBQwAgFk5zB7ABQZAgBGCAUEAFmO4ODgNGFoIM1MABhMmHZPQxfMkgJLAamDoBhQOjGQHzA",
                        "ABoGbEOgYYUhgDhaQkqTMCwXNtXyB0MmAQGgYDhGAIyJBieC7T4FjYoAwcWJhACpgqDI8BxguE5wQ7YC",
                        "IMvVTGB4HGDooiECGlPyFwuQCcaMbB34iDqHIpyBkKNANMUlAhgk0BgcZu2RNYkIgcAFdBAOJQcYPK5u",
                        "tyI8ryMCAEDBIw4Y064RbjD/+9Rkbg/7nGRGA93jcAAADSAAAAEvIY8WD3uNwAAANIAAAARgkaJ7OoBQ",
                        "FFQoljORJSZGAOBAAncYDJCMXcnJGhIrehoiokkOs8wGDkQQAAU6R0IGLjkWYkifCGZiceLqrxkSEhiF",
                        "6lQMyWmaQVB4CAMGB2dxbKBSCLEFvXEHQYCWIZ1Cg4D2xuKOk8OLqdtrPX/jBRVBifW/5NLcx//3cmrz",
                        "sg0DpA2uextcff/n//wYo/FJ1mUttHtapl1owUwPAcAoQgFGAqAIYFgCpipo6nJYFOYGw5xgSAkAQAsK",
                        "AYgkCRWZ2jAHAKVoMEQBslADAACgUAVMBEHAxPEFDJrAcJgXhgBAmAMLAMBgMAXoir0nRAAsYHwCjbEo",
                        "AoBACJAczAaM3MH4C9NRmbmDgDgOD/KABphsrJzB5A/MAUAAwEAJAEBEYCwChiYk8GAGAIjWzARAMmBk",
                        "A+XqsQIEAghHpgoUR+CGoGDA6eNdgIFyYzUoFMRnEHCmLuhIjAYkAREQJo4q1GCBufwDoYUE12nBUECq",
                        "UVWidNJRgIDQ8fK0IgCSkg6aTy5S/QSCCQBAQpqi/FO4QEcoNZgAEjwNQ8MINc1oEHhZLDYoTDVAzDjQ",
                        "shMYVFICQ7sz7MB4JGOzWY8AyeW1UBQImeREhQ8srcgxMPB4aw6sEXcMlpgyIOi54cA14GBg2ZgCQhAM",
                        "OY5c/ekETNP/BmaNPf/us6HlKCAuxexnpAuAM/5z//cBJuM1fY3eQqklctxTAaCTKwHTAIACDAXjBSAn",
                        "MPWA04ThRzC6GmMJIFAwIgAywAeCg6S/CsTuoBTCBAqBgBYQAIKASgQEoxI1qDDaDWFAETAWAYEgEDAF",
                        "BoMB0AtdLQVURCBQPA5iQDSQwEAPMCUDQx2hMgUNMYJQCKQTFR4AYSFGQuoX0LAJ5gSgXCQC4sCOXdAI",
                        "Chg0FdjAC7cpahkYCIWgOBAkToICiAFyZMVqyQVABKw4uPMwZCNkcGINmHQ0kwnssgZuQNAUSGmXt2HA",
                        "JGBqNKz/+9RkZY/8AGRFA97rcAAADSAAAAEsrZkWD3eNwAAANIAAAAT7MAwAiL9IJTDUaR4JYtZxCoOE",
                        "wwLASUGAAYTiuasjoAQLT4UNMAgcMRxUr0mMKMExAAwzIGQ2W6HSzMygTbWBmcmAoIGQogjQk0y5hCE5",
                        "jgCBQA25QOhKYmjWUIpO10OwiFEwiGYHCCsNdeIw1G1xbzK0EphGLZmoArMR4DkbgAGQQloUAliuGf6/",
                        "FDwoAz/9R0SAeRb//xmbT7CIFl7Y99KVFj/w5+/zwLPU9mMUx70mktYNQSp1mBIA8JAjsjMAkBgwCAdz",
                        "D7qRNQoCUwpg3DCuA6MAwAsVAmMDwBFdj61XqMKArWcoSPAcYdAWagnIc/BEZEgmAgwRsMAwyMVwUZ1L",
                        "3CKgHCIUF0KYDoFmBQxGwdbGeAdBwFtIbmn+Y9gZD0hf4KAuY/BMmwYKAOCgCEYYGQkWAoYpTLnRJRQD",
                        "CUDgIgJny9jMgBkk635gcQHwSqYwCiEphq5jAB4MRgImAFaHggCGAAE2jlomGFTecpUBicBooM4XeY2F",
                        "LjSmSEoJMRlceDrPLCBQNUZswnFuWfSsQhgzQMX7pI2pQYeAwGBjVWZRYxAVxLOLgft8DAADMWEweILY",
                        "k1RQGmGxssJH3gLAjC5PAWgazTO8YEEAdISgEOjSSMx0PCYDRmVIJSqrRQP5UizyErDSUJAC0DX//++y",
                        "kb/M51PKRc//1QY2AUAk4LfOvCTAjmtc///YwBYxa7qpFGqqU46pKgEABOmAEAIYCIIAIAEMAEC0LgWC",
                        "EH8wm6+zJSBpMG8Acw9gFDAaAZAoDBgpgHsnclnQUAIMEsDxoyE0LgIGAcCiYVaJJisBIhwGIVADYuiC",
                        "YMoATFmuRwGAcA4DUiA4YCBQCCqE+Yg5mZhVApigASmsvUFMGMAF1a1YQABGBcBelwYCIDidIWALMU0e",
                        "Nry/pKXsMDEDYFBoDQGMqVSMEEgGAeBqVuYIBB2JbCELoiyJ3DB5CMICFYemd8lIBh4KyKH/+9RkYIv7",
                        "SmZFq97jcAAADSAAAAEtOZsUD3eNwAAANIAAAATVTGECyd0PA0KW/eueMVlxICVxAsBUxEOQ4WPct2Gg",
                        "UKTtAbVC87kN0MBlpWCnxeIxeZSIEPvDzKjBRSNVBOWWsRCEDACRdHaUbVhEJB4QU8wVQaYsKISCJ61S",
                        "ipeAIxcaGr6nSDKoL8gT7MrJ8DQZrjwEADMAjQAC8vOzXW+c1xRdZnedWwmlZ7v/yw5MjofiOXO3EScP",
                        "y///6zWH5vf8wxyUlVwKFkrDgJjACAXMFYCoQATmAEBKIwNjBRCrMeK7Ex0xwTB7CVMYgCUwHgBACAoY",
                        "FQEkWfyTjIIERskwUlnwAAxhqJ5rJmpxmIphUAhheAquwcAqeg6ALsLAlURDF0AyIKF3EQCmFIrgM/RK",
                        "MxoVGXJ8gAKjDsIJm+7YoEBh0ACAEwED9L4iBI28WwMINM2FDASGFwdAYaCgCIYRuMOj4w4GHOwZIME4",
                        "5bMQwcFYBhMFIemSAeTC9VSFmAQoVAYtdwEQwAcjUjpAwITDjwUAJgspkQdrU4hDJjoBmBge+r1CoFCy",
                        "gOACMvM9MkSaMKHdEWNRRVMhCalzN4GdIEpY4oRmmxO0/ZjdFEQjfdJhBow6EiYe3KsPmREwaoIpa50W",
                        "4BAKMqhpobuU6hxIC1BX4dleRDGDHICYLKkMWSmfRQ1+U/z+6zLATguxnSMyDBLIN//3Zn64MA6WfO/U",
                        "h3vdd/f/milLKP/eJQn3HCtkEgEAAGAFJUGDCBUngYEoFIkBAYCoARiPR7mjSBMYH4oJiLAOmBIBgYAI",
                        "DxgHgEqkZDHiEATDEbS9aXQYEBgyLRq1whwGGRi0AhgiABhGC4MBgOR0wMABxIfEgHBxNFv0BxAA5gEK",
                        "BoXqBisJwBA0CAAmaYCEEYGga3BkDKBgFjFcTUFgIITEQACpvaGoiApOJcpgKCBgaIAAABi9OrYYGBBQ",
                        "1XmbAWkSwMzYZAAsVrzWTBZFMKBpQJdEZGAOULSlgdegYKz2I6EiGrz/+9RkZQv7f2bFK93jcgAADSAA",
                        "AAEtzZkWD3eNwAAANIAAAARoCSZigkqcvJGy2phYFBcCSFyiqIzC6WNmksVADXU/BAEzDBGbaDcwuA7q",
                        "aRdtK5OcqLA5cPBIWqAOo6xlYVhwchhqa8zHY/EgBAii8MgmPGahQyaHY0QBkz8Eoq3SJEAEMMBhAAiJ",
                        "C0LQqtjOAOYm7aRgVCJbWpGM//92lQlYDvZ60TBu9//+NW1HhQONOs/8FUd/ff/9c2X9h3DXvgrT/Tee",
                        "+crWFgBRGAKYDgIKNwGA3CAVACCGYnSX5rdiZmA+JCYVwEYQD4swwhQBy74XBVTcVCMxKFpIswLAEkBg",
                        "wABQxV+IyAHQwNBIskDQIAIVGLwBAENRoDh4SAqAoGKwDBmFgBMAQEMFhdNG3hBTmiEBC1AkAhAMwNBp",
                        "jKnE0VQHMKQ8FgPBocwIFwfNajZMNwJLxGDgCBUCTAQDzDwOBoB2wLChUZEoTbYcCysIoUjWFdBAZQOp",
                        "XfMJEkSFTSmuSxO8ITFaCVbgISTfymMOAcwCBElUEhgA0SyBaakEQUIiI2CugJMFh8nR4GB7c0M5eZVE",
                        "bkr0wCgFFRquIv2sJZCqQNcCEWDqNgcBS94GZSzHAdgZAJiISMiX4OgVnhkJtGLhDIpxgahhiAMhwKcC",
                        "Dl8GOxsEBys/oKBJg0HkUVgZdaHQKAUBChNOtr//4mMhhi2OW44JAG3z//VbdlJp7Pw33XOf//+9CMBS",
                        "P/+Zc2p84Br6KgEACYAIAr8FQFYtGYFwBRgKACmBUB4YGhTpsmgvmBEIaYLoGoGCJHQKzAjAcQ4IwlYb",
                        "MPAsx6K1yhg0EY+MHDM431juBMEh8YkEZlAEKFJImSxcYLAI8YCIDGHQwTFJZLRjBIhOTXU0aJxoUEgQ",
                        "lAVHwsRRQDgIJoZgUAGVg8jaShAODg6AzheMYUHB4w8FTAYRMIkUqg9RxApAxNIMP7TCULAYJAYbnIYQ",
                        "YDAjex90gATkwggBwB0LAwHJWLwAz0hGBn5TqLj/+9RkY4v7gmbGK9zjdAAADSAAAAEtGZkcD3dtwAAA",
                        "NIAAAAQoEI7oAzEo1R/ucjAjAZWJGjR0KikwuSTMYsbZkjeigKMcAynU3ayDQKTEESNaKZeQYCZhRKGL",
                        "Aay1coGBENDwpGhDSPizEwKCgEAGgJvoyGLzUPGdxlN0xwqAjF4CLhgUDt+KgUxYMRCAV8LcAAFMGssB",
                        "AlZDUkGh0IGOgsgRc693/+lEQKX5n/0JZrXP/n/SxMRAmA6n/+PLnf///iBcus5blch/pqJF0tggBUwB",
                        "wETASALMD0BUlA4MCEC4wxhvjRjB4MGUNkwMwVTAQAPKAIjAmAEDgFjAYFl7hUFA4GCsA0XTA0RgQNpo",
                        "7C5oQBph2BgVBMwqAssAGYhguHBKOAeYJg+iWMgwHAdohAELgkMLUYEhUkuOgEGAuVQkWSMgiHAkuUwJ",
                        "BCCAaC5CAJgCAYAAcysUMwCB0wJAGLjQJmAQZqxKpqoFo1HQcVDpKUKxQNiQQdk+mfl4YRwNFQwSRpWL",
                        "A0PA4LDBGD4fj6ix26MgcWxTVIgAsoTJ9JyoFhEeAYlKS1JjCCd4FKRKBpM4wUtMPByYCL3L/RZBpoRH",
                        "S1laVGzDX4SA4WyUHAZgZIY+LmDAA8Dqxv+gyYYBI0L0Fhsx9QMTA1L8IUFQExsOYSmgo8X0MXLgENsJ",
                        "QkNXMsaTQRNCfEo0QjQQmwav////oEODeZ/qpekHf1zP+QWuiBquP//////4XGsxW1+71nTZ6wAAIwwC",
                        "Iw+CwiFgUAYwcDwMIYwaHQ0izo/nm88CgIz6IoxxEkwtE4wkAIwmFwxUCFAVRpfMSEI+MJFAwMBjglbM",
                        "2g0yoMDHw0BRHEAzNks0zKSTExCMdh0aEYFB5QCpejuYCAZocUmpjUkClEJCYqCIQgIAAdhYFHBlo7GR",
                        "AIWAGIBIIAUh8ZVWAYfzHQlMAhpkrFDD4xQBNJARUm6iqYinmTkpppubOJnIjBjJKDgZ6GuvyW0MOEAM",
                        "AGBAivFfRFx4fMBQTLiwyIj/+9RkZQ77wGTHk7zbdgAADSAAAAErHY0kb3NtyAAANIAAAAQMuJgcjqQM",
                        "UDgYAMjiT+ROGYwwtHsuKApkOGyYYFiEAEYAKDLDIxIKZWBQFFNg4hDFaRYrEJEAmcGiCA0dBDBQYw0e",
                        "MPC11RNjJjJKYeAgwELzuYYyeDw2AgwxQSEgguYwxTAEgcv6YEEgwMhbJDAhQOJQyDMHAw4AgQwQQMIA",
                        "HCnq28P5IhQOBQC1t0pyOSmh3EGYKUs2h/FkZAHPJGc4g/GH9uV/zqdj6yr2F6UACppDQByA9W1QUwBQ",
                        "QjAXAwMG0KwwEwCzCHD0NKQGAwighzAMAXMCQGEQAIGIA+xUGBAwEEiIEmCgyDQoYEGhiUeGBBiUEwIE",
                        "IKDRgYEmFl6fjDIyMDEYQAQWBAWadEYIQfMDCFmbLrqklrEwgZQYEBIJHBgcnHJAyYBAZhwBiAHq3gIC",
                        "iwrX0XkX6/TvixFnxYMYam2IA4YCAArh/GCQcUAzBg32sMXboFR0hCho0FAoSDM2dN3AgmjiYKNJ7DcW",
                        "YWNBQGM2D3Ho68sYArmAS/q7EPC7S3i8yMhhZKMDRzw+YqQt0TvgteC9E+zDxoBIQUD2GttL56njz/Mx",
                        "MBOzfSIwcOMYBVQqlbVN9RMvOXxrJpKBQ43VhzNEC0MhCTGzA5IHl6SgJYC3ZRx6KT7OW91XdW5J7NmX",
                        "8fV32v5iEfARo/cbZynuUAsTZejU8sRnu2L/859DK4tAAACwApgHAcMSMAUBICAXmAaCsYCIKJgACPAU",
                        "EcxGCRDhqDOMGAEUwBgEzAHALMCACcwmAJhxgWCBg4LKMZhqAhYDVtTAkCTAAAzBcBBYFzDIBRGDRiWt",
                        "J7GShMHxhCDRgGFKRQcAyXU2YOBgRB+paYCiEVgYvYICZC0wHBkxEAMwDCowTRQDhCIRBDB1MDQMhwsk",
                        "IwEQxMIRbYaygwBE3YyA4cBZlqgCBpiEXmOXeetDYXASuR0EpqJ7DwRWMYAMiRgwGxEHwUPGmKDJzBcD",
                        "LvMKA0z/+9Rkaof7wWTHK93jcAAADSAAAAEu4ZEYD3eNwAAANIAAAAQEaDnIRDAOYZCAMCwsBnetuOAQ",
                        "ATBRLQWCCMyjS1HUQfRqMFAkwwYjbw7ScFAqwRuLmuDDxUABgIBpwgQFOxB6wheOTy5pRiBHmgwYChiY",
                        "HCAKAygxEAQsDwAAjEgyHhOo8utrr8vUrhDYwOJDCovMhmwwkFS8UNdTlQzR6dVzL3d/uUujRYZfr/xm",
                        "o2kqPBh+cv3hlNLC2cdY/38qavYX/drYEQAxgigtlQAxcpgDACGAqAwSgKAkVYwlQgTEjNuOnQQEwuQQ",
                        "jC4A8DAOh0EcLgcRAQXNMGBkHhTAgamEQaCQXJemDYVhgMGCYSIKhcMDGGRz/cIDCAOzCEADCgAFXlUS",
                        "xICHZMNxzHgzMEBIMYxnFg1TvMJANgUGCGEJIYBFiYWtQAxJTQMEg3QCI8AYAxACRbowqFIOCYt8QgsP",
                        "BEKBO988mGYzGwOOxi/JnM04EEcVEJgsGjwgMBA4eHifBk0YmMA6w0eKoKEjLJ+iLxmCAukOFZYY/ERh",
                        "4XiMLEwEbJTugkuY0DxELG2Mng8RgEwGCVBWtGDQOFw8ogadgBgZQjR0EQFkUAtvlARgIejQLLVCIXtC",
                        "qIdhILVn1T2MYpkS+Cc7tOiEA8mCpYApigNGM0gAhYxUWAqNNlsCAaCQCCDCgdBwcNjllHuKuw9JgQCj",
                        "IWlL+///+npivNf//vV1I0WBOX/+X5pzXv/////SMhWA6G27WsU1KkAAAHAAmAsB0DQCQMA0YEQC40Aq",
                        "YBwEJgiiLGESA0KktHF8BmYE4GZgLAKM2WHMPQpb12TEsR0NjAoBQKHoYGxgKC5hUFgXA4qgANCEYAg4",
                        "YjVudFicYgCICQGEIFSgwQCYIAWNBAyA4GEszC4DmcwNGnJMAAUMOAtHQAMYHeNRAlMHQeLAPkwC3zAc",
                        "DxCEsYMOQkWYyMwnAp30EgYLoFKojAgEXSYqvpnQ0AgEEIlHh0UBQhIgcGXXMXD0OAJaUqj/+9RkYIL7",
                        "DGNGq93jcAAADSAAAAEumY8Wr3eNwAAANIAAAARRWGHcrJUCYshpOFnEbSDBgIFiE2DxKfidfd1DE6IQ",
                        "BPWZQFZb9PFGt9gqBQEeU+AaPDf4MnXFdaK2cpcYHJw0mzAoXMkkSXWIejFeULBmHASbIAConXg0eArk",
                        "0IODphlEhxVXWYjHocH6lBF1glrykwOJzSo8JguqonBafcZD0D67//+DCL3f////0m2uy///h91Hnn//",
                        "///pGZbwu/+usAgS+JgjgkkQCpgLgMBUBoQALggAowLxNjCvAoMSg6g62APjBDAaMKEBUwEQCTAUAbMD",
                        "AYIgCBAJGMwwBwMIehYXBYIiEKzAQAzBkCDBYOKwBAIyR207PG4mEUcCYRgmtwwnCBnT1GJIdjIClUHz",
                        "BsAAcGDzGD4WJJBUJjHUIQuBg7NBgeL6rjAMPSYGaUwKCgwNCpSswmGNp+ZjgGosHYcARjMCxsYGJjIF",
                        "mAQIYstp6IgBxtJBOFhkDhSYTC6B6IRickEoMBRCEJTFgG5laGh0flBLCAQYjOh8ANGIg+YKHxQGopFa",
                        "zYjFR5FhoQAow2ml0CgPFgk0UAAceNhIADCqVN7gJRFuT9yCIQ6u1pBg4JGBhuYaBaIuVLhVbIhmYGHx",
                        "oIsiQCht9HYc1sYKGRkYtlnFigpIkSTrafGymSkSDCuZ2IUOioATNf6HB0IUd/8u/+knZ3///13lwlBp",
                        "MLOd/9f5ZK/jzv8//07Cz64dxptPeqoBAAPYYEAIBdwhAeMCABEs0MACmBuKUYc4JZhgplHPgMiYNwEg",
                        "GBKMB0CAwDQFy90sBoJGMYnwy65g2NMTHQjMNAyXOWBAHghMBgcMSN9NrxGCoWgQIobeQwYBF/aYxMBM",
                        "OF4LAEEEiRDKsCQCmj43cwBAgwkCcwVlA15EEBA0WAtJgMgQwRBsCAWzgRjolm2QxZJQiBogBcwMBiPo",
                        "MhhICAATBIvTogQQEIpKApi8ESBoQDg0FSSpgSRqS4EAMYFAaAKT3r7/+9RkYwr7JGRFq93rcAAADSAA",
                        "AAEvuacUL3utwAAANIAAAARCI4kK5cAwpKk2wFMu2IgDKwbitS4nsYCkkYTACzsxJG8v6FgDBwGNqGA6",
                        "gJa0Iz9MMR6YHWzibB6jtGCQkmCYHigDhcBVCr2W8ZpRsAGAaBgeJB1KYh2dR1d8xBLQIK0YAIlA4FCN",
                        "dtwzHE5LRggAhmQD7QG3j9BKnWX/a5//91W7H/////ukIDoQ6//y/ReH/////5peScVem1FtEWC/QWBb",
                        "URMBQB4wEwDmQAQEEwMRVDEhAmMLZnQ6BhOzCtAJMKsDgGALiEBYYASJgEBAA0YOgHgcAWyUwNAbmKjI",
                        "C5gpAYxIcA4Y6FwNDBDQPML0K4wbwIR0CJ7IAMAsChq62DBRBaU5VQCAoh4FmCjAuAqGgCWcEIAyKJga",
                        "kDGY+FCEA1BQDcSBEqGBcAtF0XTAnBrWugRMAgHsaAzKgBZhGEcyMA8GA6TAWY+GgdYCSEAAYCAgYpAY",
                        "i2YAiE/CDQOOUOGJnZguJ7I5LhPBYTR4RC+gMUE0qAxTYQgeh0lMUYGOAeZBigWmJQDMSggIhPHACBQE",
                        "rEDgZEiDS+MJjxM+gEBwYtelNx3WTjgGGDxqGGoCCABzCoUmmz9ivLYfSsMHxoKIjBQHOZIpyWRkhBEL",
                        "CiYAAWmMYTgOJANFdYxoQgKtMqkQY/BG2CC5fIZGvtX1/n//6AAB4d/fP/9bIQpVfa5/9xjgCAq1/97/",
                        "7/ayEz47T//8/L/+52fKMSPqR0MA4GxHMRACAICUGABo4mAqLsBiNjExbSOcAWgwTwagMAoNBFAoD0wJ",
                        "AcoDgRgUYngKPAUh4YKkK2JNEw+ChawwExEHIjCwwE+M3eMYWLYwBCJ5YSFA3qNwMRhtIgCKgAGIAwjQ",
                        "KtyMJQKa8o0WWLeGIaCHmo0ExDmAAJiwq2zDEDVjwUYmDgyJgg6Dg8KxYDECiyyQDAOS7WzB+0N8FkVA",
                        "wWJxkIFBgjMDh9PlhBn0lLEh0xQNk1nEwlwEC4H/+9RkX4/65mTFA93jcAAADSAAAAEvvZMSD3utwAAA",
                        "NIAAAASNDADCddOMocYBQKCb8wc4yRA6KzHydDCIXYEaaZFISsEtEGAOBjs+ZgAanwhIJDVTmMwEsYRg",
                        "EQBIxKMx4gI6GFCqrFP3r9aJigAMGsc12ZgMAXYu0kkQtRDDEALL5W0wkQkCVLjQQIQgxpIhMxuMNqZS",
                        "HKMv2z93N6/X/pK7+f/8//8qh8iA/f/8+UCAHv8//73/Q6IE6GN96mJZqMAIBgwHAZ1egUAAFA1pjmBG",
                        "AEDBRjFZA4MQxyo7JATTALABAAPBgFgCGAmAOYAQNoCAJHQCDByA9EgYnGMB4JyICIAAwQgO1TCAAIwU",
                        "gAwsBUYLyF5nEALI0BUBRt2tAADp32bGB2E4y9Uxg/gxEQEA4ACYAwCamzkKSBgCxgigimdOEol6BACy",
                        "IGWFCwNJEBM4Bg/gokQAgyA8YEQS5eIEAMmIQNtIEYVGJ4HCMETAiEjDoNWZBUaDBAER4NjCYEGIJ+mL",
                        "hSsBh8DC0w1oc7IwYDxkQCa+zC46zekSQKEhEMZEAcGqooisQMfCQMCgBXkLA0NBww9YJG4wFAsUAQgA",
                        "Uw6LQ2KJkSEhWN+H/fVD9TAHBmBhJHQEMJQaUsoaK1DUtSGGTlNOh9BAAsSlr/tYQNaIYZHIVg7gl4PB",
                        "Rb7NOsQBe1oFAWaDgsHAG2kQh90Zas3X5d/8VQzuv3v//8xGF6EWv33fNBAFd////5/koFEQFVaa+3RB",
                        "p7xpUDUAgKGB+CMFwFQwEQwBAEzAtAIMCYD8wNQ5DE3AqMHlz43jhGzBbAmAAJiEZgEgGEwOJWJ0FBTC",
                        "wrJMmGodiwCsOCoPLuRdMLAHAwLGMOWnzwHjwGp7KKRkwdCcgAAeAkVGVTVaZgQIpMBMGgodHSkK71DD",
                        "E91TmMDgEDJgEAAkIqdwhDZXSlZi0FIkB4MEQwuAIIBRk7XlMgYIAwLCAFmN7kcZI5dwEigiIY0GgcPk",
                        "fVhgCTEtGZmIBaoE+UP7FCn/+9RkYA/7GmtFA93jcgAADSAAAAEv3ZUSD3utwAAANIAAAAQNDcVAZhon",
                        "H6QMYNFBEK0bIbSElYUCwYWw4PNbMFgUMBq7n0aYDgENEwlAZhVpGOUiYFAUVuZTisogAxgsGF2lHEh1",
                        "BVtyGpL6qRZjQCnBA2PDKRyy+NBd+2mmKwoUG9zk5lcSypK1lhUTINBQngksLCwxYk7mRSJ4fz/3QRbn",
                        "////fzEQjVHzP/z3cL88/////8CoBFvZyrXP///XP3vG7vr2kRDA6BzcktkYJIFosB+QgrmAGHkYvoDx",
                        "hPP+G+cCcEA8pGCABdUhgkgDiAAsBADmCsC2HA5K/AwZqmYkAMYGgEokAYDQGU+E0jBwLTNCICUFAGAk",
                        "BwDAQpbmA8BqDgJQQAAYNwJyyGhmCiBksdJQDBUxyNPvRFUq0x9QUEzDAoADCAMSqAIx9VrkGA6EclQI",
                        "wQDCpB/cNTomC5jQ6BwyBwMAUYL44ZD1CNAWFQbHgLMHgnBwdq1mF41pUoSTCMOkR35iRgABgwKBguBi",
                        "nJhwkhoSKhAEA8Cxg+D7lAwSBYBHvMGxxHhIIABMGxpa6o60hXYNBoweAURACYEiAa9kSYOgIDQXfuFN",
                        "MJQBGgNMAxLY+VQAAANiQRp+zetFqBEAojNQyOGcDBu9K04PMMBGDgQUfBg2gYPhgCjFIKE6FLIVVggw",
                        "CBVhAsCAROA8AL3zckiEy89fX//3M+Yf/P73kcJAJHgXw7jzfMA4C5/////f1SoAir68XvZOrO0TrgCq",
                        "AIAABiEAECgfFuSQBcVASVVLeEITRhwgZGB6q8aQwAZgegVmAEAmYAQFQjAEDhgRmAADmEY/AkAi6gCH",
                        "9F0v8JA8CgTGQnDAOMDgoMcD3O3gUWSDQcMHgAhBUB4VCAWCIw7DFUwVBsDDbTFQAGOXnzWWlsYnNyYH",
                        "hYIgTMLwNT4Q+FAFWmXXEIfpWhcAjEYDiYPGkuHXUDARcTpMMiI9mBn6FQKYQBbMCoACIVAIKGKgORC9",
                        "TIwqHQ7/+9RkXIr7CmRGM93jcAAADSAAAAEtCZMYD3eNwAAANIAAAAQC20vzAIJGQUUAcEhswBBjDgIY",
                        "WsccC1kGhwrBkqMKHJL1c5hgToOMoTcU89ACG84YLDpp0hBcJmAgqJCNBmOrLjoADqTqpkdSIXRmtjMq",
                        "xIYihqMulsmXTspfSMwyEhYMwMOFYHDdKQGgpGl/G/wVvGjW18AD4yoI0xH/znItTKca/v/+udz+5cqX",
                        "LfYaEAbIi33Hv18KwsKVx87/7//0mQxerNvsK8XUEMAYDcOANR/MAEAtL4LAMmAAEoViImAMoQaIgFxg",
                        "zAGGA2BWYCoHwiAeMDxDJglMMQXMKgnSOMCQFEhoAQGpmDIAiEAgsAYUAIwCIALEWd/AemiUAECAFZwI",
                        "QWAQsIPFA4MbMBgLMLgOqDIFDQKKZt87LGDDNowMko4EoFBAmCUZABl5CCJgWAJgQGCkiqAAsKQEAwLg",
                        "UPC9W8RAUwICwEDDBatOFj4FAFNMGAVSwKgswGAkaTA4aHgMIwOYQDSmD0hcDCQhMBhUWHzDjALeN5DJ",
                        "MdD4xcA0+FH0sFKDDoAGg8xsAlAt6ysCBYHAwFBADApzAufRI4FohgNFrnYDAcnIoojsx58y9aFVLljA",
                        "qIDcRoXGqTMEH5MwtwYCAyPaDKYZisHJ5lpQCMxYPob5O+Iw2YzAAhAINIwOW63YjOcjbdnhsf/////P",
                        "7vv9+bXyVgfn/+91y/0oz////+4rM1LHK/VulDy6AAA1BTAbAoC4AIsAAIQAhIAowAwJTA+ByMQMHUwk",
                        "WfDLyD1MBsLswPwNAEBojuYKA4YihWYEAYMBIAAGHhWMJQtDgJKAcFAYGgZMAQPMCwwMKBsMQQ+O5BPM",
                        "IQJEIBgAAwMH5fAwBBMFAkYTi4FgKBAjEAG0IIAQwhA9Bxr0CmAoNmCDCmjAiGCAPmAoBKLkgBGBoClU",
                        "CwQBYNAcqAdB5hMJoCA9fA6FkYDBIRHiAYAFhi93iT2ZSq4WBKloJD6XwFBwiJYkFkZTHoP/+9RkZY77",
                        "2GRGE93jcAAADSAAAAErLY0eLvNtwAAANIAAAASQxT3Ehyw4FBExMFAYGjA4KH1ii6IgQAg2UBYKAJgb",
                        "cAQFVYnMAQtSJQRmFwIXQdNLZnZhQtjUFdwMAbZHUXxDpdwcBaiCfSDxQDbFzMkACrQSBxCTTCYFMUgV",
                        "aaE8tyJAIwIGxQNmFAymi25ZwaG4sAC4btgAJiw8UdC4HNhiMOATXW0xj80llRc////uWK93u8NZwSqU",
                        "oJ34czu5M9AgDKwVn+OWX/+l5Ljq0zOjkwtdMCgTFQALzgEEQaAujCMGTJspDPv0DbQjhpPTFMtTEUej",
                        "KgTjH5FMdgQwkNDBoDQXR8KAyDg8HAAHAVTYqAEgFQXMIAOAD2hhEjCIOhxuMNBREsxkCDBgbMFikxAK",
                        "DAQVBwTVOh6YDAjPmSPSQhsyIpwGeBCATEYXDgPHVnM+MNA8KgVToWC48DwEGzAYNZe0xHkwgBLVGIO5",
                        "pxRBK/C04IAQARKqAoHGg8SA4CAguLGDSRoTSHEYCABEyETMnXTbh0BGQhDzGxEmB4Pak0qVRiUDwAs2",
                        "NhURZKDBJHcOHDBiQ4IdAQgYMMBQDKAsxAOQLJgkZDTEQFlz8vvWj8iSmMMCg4pADqZMWBQFMIHjAgUm",
                        "DxCGlwAgsGgRCtS9CcYWDhAOjgyRFQHCr6hAuZWMFYEhA9bzwJRQLX/v9//5zfP//1UiDTq+X/v8YbkP",
                        "///+sORyBku/tRVAAAAEIQGiIAdayvRUAdCSFwAjAHAHMDEGEwhQpDETEqME8HE0lESDEnCBMLoMkw4E",
                        "IyJAgxZE8xXDYwFB4eGkIB0wUAhaREAiZiQwXAgwfBAmDsw8AkwqB8LAeYFAYLA+YHi6YHiAZIwiaziY",
                        "OBaYNCGNEODQDDgXGgNKoHyuJLJMLhfMOA3MEAzMIAABQjMMLAFJ6AYKTAEAQUDZEIQwAJgkR5tQcAgD",
                        "AcAJCgozMTCDHlE2ZHL0tACAkkFDDQIqBphwOOg0CIczARYWQyENMED/+9RkaQb8BWPIM93bcgAADSAA",
                        "AAEsYY8eD3dtyAAANIAAAASgoEGIkpghWcFkGAEZqpkZmEiEBLnExFGaSreYO0VgKQIAD3wMZEk4xAHs",
                        "LMQAUJZni8ZMQGGWZ4aMaMFgwbMKFzNgkwEOMnGrLtLqtI/FUMMbDhgfMaKTJB0IJRAPgYpAo0YELGAl",
                        "pkhAZSAHDPhiQiYeBkSyjoIwdOtDBBAYKHAQFMgCQwRKAiMONJ7GO7n5fr+4/l/dd1T8rOZy1bu53JKs",
                        "BYfyvhzv77fqSfa1p3wUASX+XWFwDi8IVA6JAHwcDkYLgXBgBgdGnCfkNGaGCSBIZCEuYXAWYBAUAg9M",
                        "NhFULHQLEYBJCBACmBQAs9nkGTAQDzBkBVkAUEDDwHTFABjA4NoIMTZXNFwZMMQkMOAOCgFFQFwgT32A",
                        "QApxuVbHASIAFFQmMEQQAwEuKhsjSYBAmxERB4Yii0TBYYHoSZ7qqaSRAUgMGLgMpFQQFAkCg4cBKnLl",
                        "CRMGAoEGgCOGOCSdKCEwgBHABD0ibDB1k1YICoeenEmhJZjosZGIAQKAokuyOJ9MVkbYVk+tILgSZbMS",
                        "IigsWAC5pkLmcqGp7GFkZ3I8YcGGUnBlA4iyjTRNReGpS2lOntDAm0XEXopWBAcuYXbApOZSGGKFRti6",
                        "NMpiocZOemMiLF23MCAVqhYJMWFSsAVrJgAQAUvlMPNjdiXqrq7lt//1//////uzjzP8foVMhoXvdzwr",
                        "9+tvKFbN2jAJABL0BwEZgLgEmAMAeFgHQ4CgwKQL1CjAaAPMDYJgwTBbTFCwJMCkHcwOwfDHUNzBsDxY",
                        "gjCoF1pmDwQIxDw0BAWBwSCIGIgYBguJAOnWFgrEYHGDIgmBIklBOGGIkmLQGGT/8m9ogmMAYmC4QjR+",
                        "EAijRnMJCghK6S8CgJmAoDjoEBUCTBoHjAMFGZCEFyqEIICEwsAsxPBMxHEEw0HUwqEo5vY4HGswSRTE",
                        "wLEYHMUgYwEBEFomLAILBowIBUrzGghRFTLexer/+9RkZQD78mNGA93jcAAADSAAAAEr7Y0fL3eNwAAA",
                        "NIAAAAQKFoGAI8RxwCmACWaEDZCSDmVLMDgcCCUxUDDB4CEYRKx03MwMF02cLyGLfyswSEgcJzDwMDkO",
                        "7BioMO4YYYJohHMTBKzN3rMOJIOFYsThoKogpRqM2uzWa7lTogLApiNacdks6XbHEUXVMTkQ7SRS+4VM",
                        "pj8TGOQMhg0WHrWVZlbZgaEDDwDacxKMlQEkQI2vkeB03nzv61/6/n///yZj2tVWkiw6x5r5Xf//pbYg",
                        "s8YxbHqwABAAQoMB8BIIABAgBTXwEACYBYBLfmAsAcrwwFQDDA4AbMFUP4z0lgDGNB2MEoEswtDQwEB0",
                        "GAkAgNT6AAHz6WA0CCmgMAWiGgIHgOpTAoDHsMCg1BQLhA+mHwbGB4KmEVBm2oniwcGHgziMDxwIS1XQ",
                        "gFxICVUpShyMCwAbRIYEAW94iAkQgXSmEwFBABmDwho6mEBCG+Q6GNgOYPOoOCTOwg8hcCCMFskYWYlB",
                        "qlI6AC76KwOFb+ogIeQ4JBlgiwYkkRgIGgaIYaABZwDIUeAghJq8bIiC0u3dYeLAeoYEAzFguCS0TIjB",
                        "oLURGBeZeLaUBiQQBlmJAQASQYtBqGIiAZZJQr+7uQKXBWMHAJ5FlMGZU1W0YYAIKNAVOJoc7CIOiAWG",
                        "IQ2BQYjgi2/OW/ZDQLnY1Il8xckA5MHYIAAUgjcza5///71///6/4F5ywqmPA/n/qMf//Wpjt39NBwDB",
                        "EAMYEgBzSzASAgC4FCKxgBgGkQCRABgYNgH5hnBCHBumAZqgFxhAghhieM7MICGGgnBoLkgDJNBgOhAg",
                        "igBI2O2YDhNECABjBICwUFpg0JBgMHoOMgxNHkwGDMsdOevheDAcMIAmMPQaQCkQ6K4MBBPJgrGQBMZQ",
                        "ibALBSYOAGMAkYCAoyYKhEmWyAwoCIwaAow4HIgDwyTR00QcswDBQwMIEDFGkiHDmWvGAfEhMLAOjwPJ",
                        "mgEC12ggBRYA3lGQcJAzCwD/+9RkZA/7zmpFg93rcAAADSAAAAEs0YEWD3eNwAAANIAAAARmJ4GNEQ4m",
                        "OwAGCQ7mbMTmGgChUHgaAgBAMeF4SB6UjoSwzftl6BoXo4Cg+DghBgIiwMOAYQCSYGgCDgUMyQcGg2Cq",
                        "BGpYEl+BENbZkc1H1ew9v8M4bjjjMGYQ6ebrx9I4wODEaA4HAgbNA2qwHAWGDGXcBAvIsv3r9ZRpoys8",
                        "wX8kTDWA0hgaBxMCEARzusv3v/////zyyZbTsHxa6LBFn/M1B///1a///v5/U/X3v56swBgA2MBgH8lM",
                        "AADQwCQE0xRCB83oqCYYJQMRgViymdtfGYfIk5gIA/GQQ3mAQGGEYFkxBAAIQwNFyioBBwYpaA4SngFQ",
                        "hJgBJQKMAQtYgOjQMhCYgBGYpi0YFiUYGdSdxiYHBaHA20whBQw0AdmoUCZZAWA8BEqjQYGhCPBKKg4Q",
                        "Aq9BgABrlAAHDCYIygFTD8fjBYFzEYbT5EagUqjDgNKHeukxMWlKRAJQwcq4ZctYRDcaFxUAYYIG1JQE",
                        "YRDCmxmAU3yQDGkAWTAc7klhp7GEQ+ZZHbGzJgUDgIl4YoDEKymguBhYBPGYGH4YFEVA5Cs5AhSMFghN",
                        "IxAOGeiKQAdpBgbFQQYIDYsAmerj7/9+AZbRdmYm+qq6riwFDJxuRBEJsM5oEwOADBSkBAKZyAQaLCG/",
                        "z/yxl7/TyJUgrtebCOjVeuVqz3H8Ncx/////JuDfy4OBL9KVs2zw+6uRtrUWKVrU+tUIAwCcHAElqxID",
                        "QcAiCwA5gTgGCEFMwHwGjA/CCMDQG0wlRqjUklcMpcPgwYgGTK0MBIEQIGZEFZICpgWBq1TAwHCIMV9G",
                        "AoGxkwEAxyVjjwZpRGCIAGHQThw8mTgUmEIhGH0tnb4blAOwC/pADBEBr9FQCBIB3uMGgJUrEgPHgVFA",
                        "0MDgQdowJASGkJggAkUAMwdK0wCA8wuTg3OXYzMNSVmGfQc0IyWS0KhEIx4Aig2JAk4pgYQBBEKofAQv",
                        "a8rePA//+9RkYYf7Q2BFi93jdAAADSAAAAEt7YEUr3etyAAANIAAAASKGSwYqMcDwQ9TAAoOc5IzcAjB",
                        "gVMOkhvizw8XBkJKCsktxN4IpHiEQDRQKoGMDgFa5gY/ERMEYHMLDFrYIuhs8lGAAKLDowADJOw2Rd/v",
                        "/llllTMch9QBQtD40iNx4CGFRKdXHhQDwADjH4DUiHAOEQ1X//+AXKsrNkF2igMwIARYFwHJdb/8fzz7",
                        "//rf6gdoU0YBB0CIvoDM8Oabq7CK1b5Mg/KwGBOAQrEYBwFoQASDAFDAGAOAQAYABmR2JQNjCvAVMLIL",
                        "I4DzxDPoBKMKUFcxLAIwDAcQhWkYkaYRBcLA4YEBWRCItMHDss8wBCZsxAC5gmHihpgmJJgsGphAAxmO",
                        "B5hYPxi7RZ8SDMmtUoyERgqALxILBwcGAwPCQVSIw2ENlojEAZBl2AYCr9mBoSCw/uMYtC+YThAZAh2d",
                        "JKyYmAkYLkUYhAotkwyICEGAgKBgJkIUA0C4ZIQuMCQJKgSmBgTNWC4XpRxUaKCQjAUCR+EoZmGlCmBY",
                        "NtJJiRIgRMGQHGiRTHMUQFj9hkkRpY+DQrFhZbsBQMTjMGxiIjUGQNMWQOipgw5BkSEoQAhi0HTA5aru",
                        "D/////79CPAO9RgoJyoSUDxCOIKBIwCHMzgJ4iCEHBGYIBEpg7CWEg7//2s/9I39LrceEAZDwHTN3vNf",
                        "f5rff//1vjIWpzJACLylgBSsIMe/Wbs9+h5u3Q3/cY+38QBhCPAUCoBhgDgKiECJPMBAkBYBYwFQWwIA",
                        "ASgCGC2CIYK4sZpCYmmKCJCHBKGNAxv0SDCJBAwAwvFMMBQwHC4eFELhGhUmcCQFDgHBgJkQGA4DTBwa",
                        "zCMTwEJJkIJhgIGojm0T2trFM8iAMmO9YYAh60cwTAYwqAKMGEYPjQTiEGjCoIGqEofL0MDgZMAwAR2C",
                        "phFAjGCBbnh5dmgwQYeORpQAJqmPSqjQAQsY8CgjDhm4POCNA8WV5ACxoUjQRHCKNC2FGTT/+9RkY4D7",
                        "YGBFK93jcAAADSAAAAEtYXcUr3eN0AAANIAAAAQG6YiLhlICmAxMcg6BmEGFQYGhAupeYJPIsEWAmaBI",
                        "8sNv/KkkImYOIxfmCy7ycxh0smSgSKAY1cDBAHDEkuMjj5VAxmCiIZPDBrTquW//f/qDUAECmKSWzcqg",
                        "sw8O0KDDBqOcJMwcAh0VmPgiQAwwuK1OdY9/98s5x2mwzfQCh5Sx9Jrtyzj+6v3v//7VqrYXE8CdEuSN",
                        "Hjhzv40h7FHrcGsqWieAAAGCEAQYCwAQgAeZStowMABQKAUYDAGhgJgFCIBwwYQZzCHFcNJqsIyaQ8DA",
                        "oB1MahkLvmDQQA4VWDhAEK/W2TBSIgbC4HSEwQBAaA4UAAwCDWPBQCQgjygRTBEfwsDRiM558uBCMLJw",
                        "4GBGH5iGAT/mBwNg4IwMEAhAFDUoCQaD8ZAAwYDN3TA8Q2omC4OosRkw3BMLgmYsIQIGkCwJMKl4zgAX",
                        "OMFBhp5bcxIBUbhAEXEMDA8wCAqQxQJU+QcCRYkPOZAHDJRg3BglEhCejDQOgBIVjGQITfMbAMFC8RAQ",
                        "wAK4cYYyy2EAuUFAPUQHQCEENyjCRzMXgERi4zWSQuGjFfoGqpApiY1BAOIAyPJaf5//rvP3cJAURAEw",
                        "wNw41pqmTB4GKEwmdjppvMSgYwGSRYXkACMrCZV+WP7//x7aqwjUEmBRa7OpVepOb5+v7r+/+83/g+VA",
                        "EAyeXjQ1ON6xkkB2RQskPhwAgBLTAYBUwGAHioAQIwDzAIA8HgGh0CsDAEmBkB2YOYFphYA1m32IgAmZ",
                        "TBrCRGAhDAmCxODwB9MHgHLvmGYUDQOBQEWgKtMEwYQoGQCMOQJKAPGQMMNBNBQOmC41BcSDApOz5ECQ",
                        "gBFYSIJCQPTCQAF4iATlNhCERgaAioAADQ0CyVJguFz/GDwWM3MDgZDAcVVEBDmGwIGMIMHhxcgqGmNS",
                        "GZyAKXZiUipxjQdAgCT1AQGZQYBLxQHHjKAO84gGBQPXCMblecJTdHj/+9RkZg37VWDFE93jcAAADSAA",
                        "AAEt1YUUL3etwAAANIAAAAQKDzu3xMmg0HAYyyIVFAuCg4hFUCGHgc9z3kQYJQOPDKByUGqTWyDiw5Jg",
                        "AVBx+FQqYRG0iMQ4g3oFnbMeiAwkBgQKRAFJTW3r//vMp1XRMLUcisdiASGAEiDhSYJPZt9DCxHFhaGD",
                        "ZZJf+GaHLf/v+75WY5hKzBwHHgnAcdwdqTb5h+v/9/hd+PKcqzmAwZE7w8Kdb7g3LnXUU1HFn0BSrRHM",
                        "BkARK8LAUmBMAGHASEIHhgHACGAQCmYI4SBgcjMmgtNSYv4bZgmAbCSpGAgDGFYWjQjMEMJQDRlBABhg",
                        "UA0EwMCsuAgHjwKDoBmAIHKuMAgMMJAbAAMGPgzhgFARAT78B1YTDMCCIQBwFR4qHYAQbqQQImBQAoog",
                        "oLlPkIBGDQIzxEIbEE3QgqI+YXBoHHmYFoKc7q2YzhEYbDWhspiYKBcnGrsMAl8FAXdBoLhgMwWHC5Aw",
                        "hCZGl4zCIWHhIB6MLwPHBSMVZGCgMEAAs4BQDmGYhDwLEAIA0AYoQgOJCoVQJKAskQiCEmBdRRAtnZgU",
                        "Kw0DReUxiAtppgaiACjRsJhMBJgoCYwAokFvLWH//938GGBAgiwCskDBCMBQqMNAcQeMDgrNMiqJhIME",
                        "Q8MMwFIQBQnxu93//eGv4vtju5IShUmdM49gmd/n//93+896SeW83EFBTVCwIEwEzmfcVH7ftucpoXMb",
                        "lMpVAMAA4EldJgBgFGAYACIAMy75f4wKATzABAKAoGJgCAxmD+KcaIFPxkBh+GBcDGYLQNBgDAKmAsA+",
                        "UAHQUYEwBTiJ5iQHoBAFMAIBB4wsA4PAQI2jQOkUMB0FkwBgOUJhhagKK5MA4N80RQAR0AUwCAuQuAGF",
                        "gAgEETAZgNAZuFGzAUArVtAQNqtUwX8lgQB7AY4AEDgqWABULgICFMIAMox8x2DEJHMigkwEAUUhCaRY",
                        "xDwJsDIEKgGGQGYfNIckyoLi+scKgub5lAoS4cL/+9RkZw37mGlEk97jcgAADSAAAAEvYZ0QD3uNyAAA",
                        "NIAAAASh+MmggLBk6DwTOgFasFB8YGAJjYyDRAXsHH6yrQJIEVFYsenRMEhVCJOYBBdb5iE0EQoT5NKh",
                        "1FIwWpDsQdFQEBAMBAs4qPUu7l+//+2XbMOgl0CEDJhPyatOhgIKBRBGsnuBh47Rh4TFgDmBQWwaly5/",
                        "9y1+2Ey3tkGhBMyISrb63//////9Ydyeij7DV8qihu+H/peFr///y///V23/8vdn+qlLlIAwDgJTALAL",
                        "FAIx0E4wDAETAIBaMAQBkwLgbwCAQYawMZGFkTO8GEOA+YdQBI8AWYAIGJgLABDgAQhApTKFQGwMA6Cg",
                        "ATAsAXYsEAVjQEpAAQYFQGrCxQDUwKgUwYAiYMQGAsAkYC4FBo+g2IMmAIB0LA/kAFAVARKgBooCkyAD",
                        "AGBUDFEoMAyaRJBICWMGA2AlBI4BUVAEVNTBlCdMCgAIwYQxDPUAkM/AEwulzFYJYkIj4phHnygJ448Y",
                        "yDhMEl9gY3vcFQAoi0oQAREswiShJHmEQafUV5psJgUBmZCWDAQYTMaarcQUjGoKHExgLBBAyRhRiYZw",
                        "YMhcxqGkejBZlJgYYQNBoBkEQgMWmQFigFBItEMhtWhO7X//7/XcEXyYKNbhtK0QCExApzNQvMNhoPu5",
                        "MVzABSM5CVVooTICt8/L/gt1f62G/qAQqI3juTV5olz/x/8f138ufMU0TWnmQiIWD9HzDTj4f/6+9+99",
                        "+zaNZ8GdtKwNHgJ0ogKBGnkAQFzAfAxCAHAIBmCgJTAOBTMFYEAwJRfTTUnBMbEP0wKgPDF8JTBgAgAJ",
                        "JgEBaihhCAymQCD4iBQWAwwWCR4AYHKY5fYwdBlTNUhiCFbXzCsSSQBjC0oCfBy8I4DZEJQyAw0OwVBM",
                        "EA0YHgKChPMAwATHAwBpYhcCTAICHGMDAPmRkBCYik9zEwdwSBhhukpnyvZgEFGLCWPOpfgwPyYIsaVu",
                        "h620QwqQEwECJhYMSxrCMcr/+9RkXg/7JGVEg93jcAAADSAAAAEspY0QD3etyAAANIAAAARHAkscGBw0",
                        "GBwYIjgvaMHBwLBgmN5WBRgJCwvGAEOANljvDQZHBGYLATAjBoiV4IgaLEhUBigVDwrMOg4wAPRIgGET",
                        "meGCTpGFTAEBKBVsXOc//x5/xFkEDyaKioLLyC0KCqBMlJovqYLBhggELOBItU0l2Ouf8GuZ3bxz+EvM",
                        "CAtFqJ0OolIN/+/y///H9clT4yK+MgQrCtH+vmb/P//7/3lihx8i6fj1lOIiEXaLAAoKAnBoAJgMAZF6",
                        "mFGF4DmYJYkBmBW6GPeHUYGwP5jCAQAA8wGG4MDJCIwMDMiAtZJQCgWAIwgCNXpgQBwGCoZAUFCEpMwA",
                        "CQwND0wHCcw5EYhBgQKwT8Ol4YPGwvIKguNEUSBCYGBeicCgwIg1aQYdBizQcCEwSBmCjAUJmgCEAwgc",
                        "lBjAgmDEkHzIQHDq1BAcLZggJgOOp7TBMFmSrKMDQNe2/GVqhgoxowQBlXCpygD7CG71BUADJ0CBkOTA",
                        "WWSUEwSDZjyCwoAZgqHBEGa0jBMEnsUcgkgCMmHF/DAwGRIAX8MGAzVjMEw4GhrMEApMUQQUQEZ1mmQT",
                        "rVMExvAwzqhSOs93///PzmFuyZusWdgx2F4wDAgGAWa7BqRBISgaDjBbR9EWuf/6963s/b+vddmiULH6",
                        "xpb+OPe9w7/f//1at6lBMCtMz4iCLPDD5VTf/9uVKqXF++sX9bkqKwOh4CgwKgJjANAGCwCxgPgGAQBs",
                        "KggiACswLgBAUICYWgaZwOl2mgAAYYXoAo0OAVgNmAIEMRAdjIApgggfCQBwAAWFgVDAJAcAwGDzmAmA",
                        "nTFQAswJgAm6DgNRgAATmASAEYVQF4iAWMD4d40oQHDACABMHMJ9ZghBBEYBAgATKoN4cBKXZDgE4sYK",
                        "oDw8AQOAQiIBy0FAO5SMALjQO7KDBHBSMGQBwwIw9DL6EEMpAEwWlhYhLmMUDWFCoPMRh6nVPBYNDgKF",
                        "bQzD4CX/+9RkZw/78mvDg97jcgAADSAAAAErbYEQD3eNyAAANIAAAAT+CRCTAKSl/XzBoXBTSMHhg7V2",
                        "BJvFUnmHhSW3MUApOa0YIBBQAVjlAHQZBQtWk2OREIACoaZOYaNQGKxfwzcCgwUmT7OcMCrlkRFMBB1t",
                        "2qSz+c1nlnzdZX0wg1PiAFGcyqChaNAY2+rxIJGChOYlA77CgAUlfw3/6bDKfyvudt9RoXEQAgCSfc/v",
                        "4ZfzDn97+4YjEcHhlUa2PAr9f/cr34/cu583a/+75/97ju/aqYHAEssMBMAgHAHEoDgQB2AAADAPBABI",
                        "B4jAcMFQEowQRUTSAk7McUMMwUghhYuTA4GAwDxot0NRoPGJFqyYUSAFgMETFTAYERIBGYBgkt4EBMYa",
                        "BuGCECkrLNGADzFODhUATGwJigKwsEYkSAYAI8DReovoYDAAqqYTBaNAKSAaYJAm3QwKCp2hgDwECSaJ",
                        "gqSZMABiud5nQy5gsNFg3AoGRAwiTGmGAgESBOMiAHPIFAUIAUqmLBdCswGDYpJUQlvjI9FkuYIBR0tM",
                        "GcgMAgYZUHT+mAwCTAFshgELtqm7DDMXSdMv84q/wMc6MxiIR4DAUnGWRukSYurppoBr5DCOKgCBoKov",
                        "/H+fh/2Fiw2wmaaEYmKoYHgqfzjp2MCgMwCBxgFPo+EZ5//zcdtf7CJFp6QIIWg3L17/7zn17l7+/z8Z",
                        "VHXxVRl5KAxoF9//u4yNALseKWj/jowH3QCAAGAfQ8YBIAwAAEJALAAASpSYEwJJMCeYHYLRglBCmAqM",
                        "QZc1KxjzhoGBYBKYwiMYJACYdi+YDgZHwwMwKA5gSABQNCNwwDrwBgHFYPL6BQjtxKoTmDocmFoSmMgm",
                        "AQLzDaVD8kHEejCcdFhFmjRqiAGCzUDA0GjBYB4MAIQwYOgGYGAQ4hg6Ea/IZMQgAZeDicMHwbMTCtPL",
                        "ymElsMFQMSGxATVmkQvMOgh2B0CqeCAmYEAcFjRQBwBLlkwFhwwoCF2FUzhyqBIZNse8xeH/+9RkaAv7",
                        "R21Dq93jcgAADSAAAAEu4Z0MD3etyAAANIAAAARQSDAIQ1GAaNwwDsyLkuu7CXLGJatkZCanIgA4kkoo",
                        "HFEOFQyPDEZiCwBMV5MDMVUhkoTDwdjMNSH//mWu/qmWG7DrOkyjBp2MCgow4eTphiCAqYcEgBCsQnZf",
                        "K//Pu6S9npRJ05+mCgjVHE7uX5f/eVM//8tVK0FrjjowBJcVQegOz/98wn8qlj8/53+61hh+vy5+PMr2",
                        "M2AkBWAgFDAqAHRRBIEhIBEOADmA+CUYDIAYJAeMIMEAw2AMzdjG9GnVDCJBlAIOKYmNwVhwQCMAzAoD",
                        "F0mBobiwwmAAPGBYEFpjB0DwcGIqAIcD0XCgYgwKTDUKzHcaTA0KTHG3j6EWpsFB0PCqSBQYeAaOAwYM",
                        "BSgTHQKDgaZ2IQYbuShSEBi4Q8NKZ4oEgcWqHAwZKwOAAweNA2mZQxUBkMD4FGaqIEiA25gMJIOENaCL",
                        "7ExECphoCgwABhABJgQC4wBBWACyTEED2WiEcyIohUQjFiTjCkDi/xhmJ4QFY4CI0JSyHHbZ0o1M3oBC",
                        "gEkQJAkFQUDq7zBMBigAhGExhgK6QpisyZgiCIjA0wnHcwoAaVS+Q///rdfH4JcGINyclkphSDZggBoM",
                        "IY0aLUxSCwwJHIqAQy+NwLJ8P13lbkzL3aJAFhyJCgMKFUMV/e99+/nc//19DyDYepGcwIVAZZJS/jhz",
                        "HCvvPvP1rHG1fXybji3qFU4AQ4BkwCABzAVAfBoBZdYOA9IgEREByCgUQcAWYNoABgVh0moFFqY+ofIk",
                        "FwYuBKYKAIYLgOGCSiCYGguOgQBQQFgJMBQKDgLXcAQBCATLAImCILLcAgJGAgYmF4pmH4uGEQGmAVsH",
                        "wIQkAHmFYpg4ESEMjCkBVggEGgkFxKBBh4BD2BASyAqBGly0YwbBB1yAODBoBVQmHIamHgOGMZDnCi5m",
                        "NgMBSqPIGHjCgrhIVGJjwHbLAYqJGDoPcUmPZgUCggCKtqgZWusCDmD/+9RkZg77ZWhDC93jcgAADSAA",
                        "AAEvQcEID3eNwAAANIAAAASgMFAScloo0wBABTOIqYCYcGQcHoDQTpn3tLAWsQSHVNhACQQFm6CIMOEM",
                        "BYyKJRoTmCZiGFcYEZmgbAYa0kRov///lXWqjDLsph2WmICeZBBZg8iHdySYiA46VgEOGSSiYi3dTX83",
                        "yhsvGOAtfksT2X5MVs997ctU9y7zO3uu/V6UxnULg4kDo8RLO6SzhzCzna/nedv56xu4jMo96yYkoCAF",
                        "xQBUsgqMDAFRkwNQDDAEBEaUYHoMxg9gXGFyPIZJFrRiEimGA8C6DlgMDABEQ3A4NRAGRieFBKBAwBoO",
                        "DwmBQwLBKHgwMiIUioBpiAD63SEUDA0GTDkCTLoQzCEFjDfmD+cYC8QGWVHJBoWNJMMwUEqViMKDFgGa",
                        "QwzAODxwL2aaMFgVcsLiEChXCoAmHxGmE4DmER2nx5QmYwsYSU4YCWemPRMoGAhaYyAq2BgQqtVugkhD",
                        "JhYGEw7MIBxr6SgQrkwCU7hw0C4NO+NsziEwqVTBgHMNBYyqKEaGymEBtJKeYIAolA/xhgFr9MBDIxYG",
                        "1LE7mGDo0MfKgDBsw5RTWIJBwJM8nWURNpdLzvPw/D+vRBrwuizoQgYwEHjAxGMCn04K2DAIDFRYYNGK",
                        "3MGtS7e6/MsfjybjqhYAp0ykEg9mtSgs190lbd+3Wzxn/xZxIbdmzAMOkoTKxBSdwytY0urt+9IualGv",
                        "iWedaxf3vHDudW3V1h3CrQBgEARgBgGAYA0AgNF2TABAHDgGB4AowDgI1zGBaAUYLIBZgfAKmimNmZAA",
                        "P5gUgfFUGxoRwuIQkAw6CggAEgAJA8ODECgIYJgMpqIwxYEo8XVfoZB4wWBcwpAEiJ4KAaYNTUUkutYx",
                        "bE4oBQRgaAgqZ2TAuTAA3wsF7WzAoBrxIBqoIuAQGnBkChIVl3GDAyFAfGIxVGBqOGIiyDEmDjfLQxMs",
                        "QKgCBypCgWMvAyC2IDQCGQ2YEHIgADH0W74CHrX/+9RkYIL7CmxDs93jcgAADSAAAAEugbkIr3eNyAAA",
                        "NIAAAATxAPU1RgJGoasAhQg6Y8ATDEXFeqdAgFoQSuZBoLh2gMEgJXgVChiUJreC4LpRGLhImsEMGKMF",
                        "TqOhhtQcfyC/yy73f9uWIMl8k4+abwMJhh4GmDAaAs4RBlMNtWv085hh+u8/GbizRJiIVwsBWp16/42p",
                        "HYq5Zc1VkWMxHa8Yaeo8CgRiBAKUDV8sc5Jrm9czw5+PcOby3nl3//VbpZb5EAABQCAOAoGQCjAFAHEI",
                        "GYVAhQeKoIRgAARGA2CCYDoJxg6gkmqo+KZIoOIcAgZIi0EAQYKhGUDWMAoEAwCgCMEAPR3LTmBoDhAA",
                        "ggGw4QHpEh7LpiwHmHgImIYDgo6DAUNDFPEjpUfk5zDQuy8pKDphoAypDBMAh4LSoCYUAB4jAYKb4jC0",
                        "SCR7TAwG9wOYTgEXQMPxGMMBEMHSQOijdCCQGBQMXTLDKoBbVCeDkAKDoxuRS3hdJkQyNzDoqMKAkMI5",
                        "QFkrzCIkUCCxHMkBYkJZmXsmMgik4EANdJkoQumn8YPABEMW7SIMFixn1IR+rSkOAAANBswEDVdlgQGV",
                        "wa2ILBs4GDS2DFVY2oM/nda3hvurkbtlnnEZ2s9splEQofCMrGFUahUKBMDBRmmFn88+f3CdiF5bLZ35",
                        "phQKIx3aW12tR7mNbz5uM38nnvwVcTKGQHNJSF4bH/QY6xore5ZnSbxrWaWzhjj9Be/lNc5yrsAClQgA",
                        "QAMNVOCQAQwBwEnmBoEoOBXHAETAcAtCAHhCCWAQWQAGQYATGxhzhEGBEDKAiJMBQGGQlBwNEQLBgwRE",
                        "eApWccAUmAt3xEAxEDJfUMAIlA0VB1HMiDYEgKLACYCQoa7gqYNAkYXCczItaFQFUSMIgPJgRZyl7FgS",
                        "AULEQKkwERIVBCuOACvxI0wFEEwJAcGjOadmOdKODK0GY4yDmiDIhAQuQmHAoqKExSGBQMCwcAChqDBI",
                        "uqYQIl+3JFQpeooJhj6oye7/+9RkY4D7VnBDS93bcAAADSAAAAEulcEGzvdtwAAANIAAAAQ7Bku2YxsR",
                        "S7QGlAlGBkHJhBGt0ACGLd0IAZZ6wICBGTCMQXlEVDJSY4MnZhhcwrFjJjOSjACudicN37VJF+1GHrYM",
                        "uGDBgQw4uL6CMPEokxENDhM/saBRmRAAJA10Sqfr59zz/lFTS5+X/b+JgkCVxUuflSzNDvDutZ0FzlNT",
                        "wBBzrgYalCTzJLksn5Vn/LN76vLWf3LH853v/zvdVLn83qtlWAGAQKIPr4JglKwIGQBMFwiC4EgwFgsE",
                        "xgATpgoMAFG88h+E3uGEyeCEyaAMxBEhMNLowCBUxcC0AAkYTBOYLAuYVBCAgnT7SnMJwPIQFAQYEgFD",
                        "IGmDgQjRFmE4REIrGR9vG9ZWGKYJmGIdCQWOCYHAIDQPamWzWO3COFYDKCiAGxICYKEALq0JkmDQAp5j",
                        "w4kwrmJAAmX6fHnkJpokDloWDjQxBPIYEQUoqDGBohEDCMPLKkgGZIOhCSYUSprKbCEtRZHCEIdDIFg/",
                        "/qL6KlFTJTELjw8PXCZmV4IAdMxWxPmAwwPd5gCmDpmBAziqTMSK09SqlH/lQFNDbzAiAAgSUfqPBOyy",
                        "nkVeVr6TBRMDnYmMAM3jSbdMtMBUkMDezuqRH4wouAoXx678gkm4jILVagdmLyyNIDH6EIimq7F2Yqx6",
                        "7WlO89/X5coZBD7I4Q2V/ao6CMNu1a1JU5Y7rmWfbXJRuUcywryrn559vWbve42Z66oDAMYFAoBAJQfH",
                        "QQFQRMCwnCoQmAIAGNwSGEQLGGIPHrW0mlICmGgPmgTmYHFgWDZjIWA4WEIIMRA5wjBAUMTAZqZhIHBA",
                        "OL1mDwmIQqIgyw8IMyHxhYqhxhMf/o4uMzIIYMSFdCQiqTBtdgcNgMBkVQgJwAAQTP0rL5Skm28NrFYU",
                        "YFDxiULABFHQFGCl1JJkjWxIllaOxEKluQ4jVYlurFAA4FtxQkP5PhQCUmKApmgQZaNG0YZexRUOHXcC",
                        "4Av4hEX/+9RkYY76b29CA7zbcgAADSAAAAEtZcD8Lu9NwAAANIAAAAScQCYaEZITGCyRH2C1lGCg8hEI",
                        "o1pVYUJi7RiSEEcyepMKN0eeK54WM92bV+PT7opaF6wYFqhZwDBcwYHKCU0ozZAOjRElSaOxu5M6zq6z",
                        "52Ot2cdCGH2Es6l92W54Z2/qbz1rDHK9MR2L2Y1WZkmy/Xbn1aW9/61Ytbzq50ljG3rudn981hf5vV9I",
                        "ICAmNAYW2RtMFADRFAgTmKQQlsTFEbDHUkjH1VDml6DU8VDGQExg7MwNzL3Q0IQMdGjFwQdGDFggx4LB",
                        "oKZQIgAJMnBi2RiJEY2LBcSMjMEIjIVg0MsNCTwrXHP2hwIqYyaPiqA0oTGRsZDzGAERiy0EuwsEMHLq",
                        "FBGtkQAipy5qvJaYWOGUmhvLkYoZHVcGTDArciECiUnEQwxp4RDwQTT5CpMmeodQsHLdjyy7OpjToiCG",
                        "jOGnmGxPDRUKiwEtQIqblApxASEajBKa6KjoxYqimTQtyy7UbRih5NI3IQ3Pg86IwY8kBCwFbzm14zef",
                        "qpFJmldhvmFv6BQDRJaVBBhxxZ8xTY1+oOZAlECgy14cbjOOtAbJ5C2CGazDnlQ6shdRnyJK1XWWFZvA",
                        "kBcybNXfiehx6o+8Mvwrs6lzxzdE14DGvhmdkktcJl8PZSiHHr+IuPCnizdOKQzT1IRKIcgyXxH43Wr7",
                        "tSCYTEFNRTMuOTkgKAgAALBg5EJD0TWETsXKylWMLiJkROaEdmOjJrMIECghHABXCRplRpwVhSTGwxnx",
                        "ppDILNBAE6lcIiGfNmoHgUW2UDEzBjUlwKZFDAkiM5tNsCMkkOhdHiCVx8WQEIA0usI2E1JZJcygZPsV",
                        "KDUppxlAidwUKmwByA1R8yQQyL4ieLzB2QKsUUIT34FYkUjJWCg8BkoYlWKGnVO3A4AYLaURER8RnDyx",
                        "CidahshpxRAQgGAbkDxVYAAIaoRMyZtQc+CBjdKYovorAJkkvXcGC2kAFoHJGYodMod6BDD/+9Rkbgb7",
                        "eXA9M3rLcAAADSAAAAEtucDwLOstwAAANIAAAARYNFRWJCakSketxWO496AFoCwazCE0uNGh0IHDEiYC",
                        "GIFR44s0FBm+eNiTshYAcHAppII4qt8OL2zLflhaTmQADWi8Q8alsuhF2DmesMZpK39cx0GPIaw7LFzN",
                        "Pa87aqals0pmGKN1VbKnZgiCmxwfXgZQ2ag5p000qMOysKull8CvjWiVWwy6PxOSNBeVc8DLUbPwLJij",
                        "QCgLkFAyhp8LPoFZzK6BrRqMmqoDigi41ZQ6cUx6AyCgBfTDFDWhiofIJC+jVAzahjIgiwrNAaN+MNET",
                        "HYhQjMUFNCIEIcFaTIpUmTTpgcYLMnCXiBOVRqFIFJFUWZAgRMgcEBJgEiE2mQt1ZKuwQgDPoILQGFvF",
                        "vGXUwewDmmpCMQyUzZOMw9S0uaGCIagQ0aGM4djBCmDQBEISGAZU6QjIAIZkGweEX7UAHnAa2GWgwxYA",
                        "xBBhwBLILuwXhTCMwcS2CgiT5EYygyAzPNOIsZHBo4tMYoMvLzFyEJKSKdLDV+xZnD6l9S1ggGFk1cA0",
                        "oGHmtCWfEmwQAXvQRPG/6DLFkcXpLtOIqq1BxJc7jRnDSRTOXeg4sVoMRSTboqm0B0IdhaxFtwW6kDJF",
                        "O6xlqcy+IAAam0pS2ma+q9pAwHBkof0kFUzep91GYLelMWJJzLvTVnGBM1VEkM0huzHX/Ysr+G5uE0Rf",
                        "1r8IEZxYSECUkmas/cgmEmAHIqGBTgWGYpkascbJSY4QmNQhijEYICmyC4XCDAV5aIJBzPQgWDBQFTdF",
                        "hUaGVuIyorKGBYkKpWZyEPyZQMAYzEgVOlNUxcSHQND8kAy1KJhkYS1EFBIJAkjZU8Smz9EwOjO65aAw",
                        "QUCGEFgDxyA4qBgEAWNTIlIgANVIdEJXRwYMXVhCx6SA0ITEjx6mIqEUFBTMgEaYRGpiyZiDQ062DBwo",
                        "8WiG9wOPBhaYwwSgcmQNAs5SCHBhHaaQxhkmOYDQOKXp8tEbGsotUjv/+9RkbY37aXA7C1vLcAAADSAA",
                        "AAEr2cDsDWstwAAANIAAAAQgSYnD6WyNSSSaSOxdpnzAyEFdS5AxlGRUK8QYCIglEwwMuiX3RuaNF0w1",
                        "/L+XAvJCerYXmQ+RQLx8LwJel4S2qJCwqNJZlQ9DghcpUOhJ9pKoqslR6kEEv0ugZBcNo0XWUVgM7Vte",
                        "hFeGkvgc0XOgR/GPpuO/ApfxiDfsyV23zFUAbTjBATeYiy0tyrbXWEYW/ogAuijYpWLAFtAg8LXDhkQu",
                        "MMShM8JBK404YKjE5zU+zggTKjBY1FgNbB0lUphpIyLHgDbuG2RYF9Etx4osQDblbDVk0KhLIKCFbRQK",
                        "QhC2iOjHC1D/hDEvMDhqhxZhpKQqFSTCsRdIoJAVANUTFABYcu6hkWYXuXogFq6vy66YalpYAgF3lotM",
                        "BxgiKBQqygCEbfLDiqCa8SbiP0FDhDJUwIZHQEjgcU7jWVaRIdhap0c0xV7l4xEKb4wQMPPGIGrADSAC",
                        "gXbQjVMrYl6qsXnXWwVp6wagREKvdGYAjr/ToSmWFT0LMFBIsChewNc1d2k3goYBQAAGy0LgRpI9LpL9",
                        "FZPMWSeh5SoC8aonysLpS7RxEZasTvrEQEpDsPe5MFMcqDuONPNKlax0e1kSpxY0qdIFoLRFSuEhPYav",
                        "u0oBKQQRGREEqAt4lemPk1B8mnMPAgbUXDUpXQpJnbXWaJiCmopmXHJyQFDC2ODQwoRABWFL4OBMKXUp",
                        "sFShv6gC1NiV+u1cKTpbVWERlGOGYIZtJlsTWZModCQZZSEtJlMWC1cmpGZCJkMHvIJTFnUHgQmZwpMK",
                        "k0nY0JQMiYZqZUIRSYLByxBDwJGTXS2eBdylKqqeDJmirCGK8awqeoYSmkaKAoeHGo5GQSgmMSMBKhhK",
                        "TxtrLDGWYg8zgCRhmqmyDqZZoDssCyaZ7orVTcByTWmAtUBJRmFw6oKpFNYQiL30YIgFCQxaymK12ODI",
                        "xulJDQYsEquoKzwQClkVWshSqXs8xf1rj7KDAEL/+9Rkbg368HA5E1nLcAAADSAAAAEkwcDMR+MNwAAA",
                        "NIAAAAR2S2qtr2LBL+Vuhcw+6Jy6iUEMVSNcgKCl+ZqhaQnkiiDBxYV/l4rtSKSNLgoUGSQAkpGgKT6x",
                        "Yk1lxaBOZx3sSGBiZuHq4ctrMHIJVFkByplyqlclR5K56WsswIQEckxmplsVbEgn5dxTBAWDgUfYS65Z",
                        "1NV6GUJ1JhL6QeL1O4h1YAFkGUENMghUMvp4A5gxhawjI5jyN1mqJySrO21jLAmtr9YdK4y7yqq7AwwU",
                        "GlQkEiqwphi40fQqAlOHIAXjE1NpnDQozS1qGUQphrPWmK6Wi7jLoJaarc0Z24YftpqtzA0kQaJQxA4v",
                        "6yBjzTX6VKXmSkTzTBfRYy+WoLueNrzIWoKBN3aCzqS8cJbK9EASZK3EVmlqWpytIeeQQ2+SpmEtMZy9",
                        "DBlKWuJ1LxagqaCG2jONlpTc1Ilwk/lXp0tyhcO4U33neZC3Bv2WvtT0VmNPrAEDvzKr9mzGnZeiB3Fh",
                        "q3KbT6yiBpTZoH6XK2NzYaizgv406AYS4MAPM7NFDUja6zKBGdRN+aBymxq9LrJtK1qavVCozjOtabE5",
                        "6wrRGLJCsIU5TEFNRTMuOTkgKGFscGhhKao="
                    ];
                    pd.data.audio.binary = window.atob(audioString.join(""));
                    pd.data.audio.play   = function dom_load_audio():void {
                        const source:AudioBufferSourceNode  = pd
                                .test
                                .audio
                                .createBufferSource(),
                            buff:ArrayBuffer    = new ArrayBuffer(pd.data.audio.binary.length),
                            bytes:Uint8Array   = new Uint8Array(buff),
                            bytelen:number = buff.byteLength;
                        let z:number       = 0;
                        do {
                            bytes[z] = pd
                                .data
                                .audio
                                .binary
                                .charCodeAt(z);
                            z = z + 1;
                        } while (z < bytelen);
                        pd
                            .test
                            .audio
                            .decodeAudioData(buff, function dom_load_audio_decode(buffer:AudioBuffer):void {
                                source.buffer = buffer;
                                source.loop   = false;
                                source.connect(pd.test.audio.destination);
                                source.start(0, 0, 1.8);
                                // eslint-disable-next-line
                                console.log("You found a secret!");
                            });
                    };
                }
                if (pd.data.node.codeIn !== null) {
                    pd.data.node.codeIn.onkeyup = function dom_load_bindInUp(event:Event):void {
                        pd
                            .event
                            .recycle(event);
                    };
                    if (pd.test.ace === true) {
                        pd.data.node.codeIn.onfocus   = function dom_load_bindInFocus():void {
                            textareafocus(pd.data.node.codeIn);
                        };
                        pd.data.node.codeIn.onblur    = function dom_load_bindInBlur():void {
                            textareablur(pd.data.node.codeIn);
                        };
                        pd.data.node.codeIn.onkeydown = function dom_load_bindInDownCM(event:Event):void {
                            pd
                                .event
                                .areaTabOut(event, pd.data.node.codeIn);
                            pd
                                .event
                                .keydown(event);
                        };
                    } else {
                        pd.data.node.codeIn.onfocus   = function dom_load_bindInFocus():void {
                            textareafocus(pd.data.node.codeIn);
                        };
                        pd.data.node.codeIn.onblur    = function dom_load_bindInBlur():void {
                            textareablur(pd.data.node.codeIn);
                        };
                        pd.data.node.codeIn.onkeydown = function dom_load_bindInDown(event:Event):void {
                            pd
                                .event
                                .fixtabs(event, pd.data.node.codeIn);
                            pd
                                .event
                                .areaTabOut(event, pd.data.node.codeIn);
                            pd
                                .event
                                .keydown(event);
                        };
                    }
                }
                if (pd.data.node.codeOut !== null && pd.test.ace === true) {
                    pd.data.node.codeOut.onfocus   = function dom_load_bindOutFocus():void {
                        textareafocus(pd.data.node.codeOut);
                    };
                    pd.data.node.codeOut.onblur    = function dom_load_bindOutBlur():void {
                        textareablur(pd.data.node.codeOut);
                    };
                    pd.data.node.codeOut.onkeydown = function dom_load_bindTabOut() {
                        pd.event.areaTabOut(pd.data.node.codeOut);
                    };
                }
                window.onresize     = pd.app.fixHeight;
                window.onkeyup      = pd.event.areaShiftUp;
                document.onkeypress = backspace;
                document.onkeydown  = backspace;
            }
            if (page === "documentation") {
                let b:number           = 0,
                    colorParam:string  = (typeof location === "object" && typeof location.href === "string" && location.href.indexOf("?") > -1)
                        ? location
                            .href
                            .toLowerCase()
                            .split("?")[1]
                        : "";
                const docbuttons:NodeListOf<HTMLButtonElement>  = document.getElementsByTagName("button"),
                    docbuttonClick = function dom_load_documentation_showhide(event:Event):void {
                        const x:HTMLElement = <HTMLElement>event.target || <HTMLElement>event.srcElement,
                            span:HTMLSpanElement = x.getElementsByTagName("span")[0],
                            parent:HTMLElement = <HTMLElement>x
                                .parentNode
                                .parentNode,
                            target:HTMLDivElement = parent.getElementsByTagName("div")[0];
                        if (target === undefined) {
                            return;
                        }
                        if (span.innerHTML === "Show") {
                            target.setAttribute("class", "content-show");
                            span.innerHTML = "Hide";
                        } else {
                            target.setAttribute("class", "content-hide");
                            span.innerHTML = "Show";
                        }
                    },
                    colorScheme:HTMLSelectElement = pd.id("option-color"),
                    hashgo      = function dom_load_documentation_hashgo():void {
                        let hash:string     = "",
                            test:boolean     = false,
                            hashnode:HTMLElement,
                            parent:HTMLElement;
                        const body:HTMLBodyElement = document.getElementsByTagName("body")[0];
                        if (location.href.indexOf("#") > 0) {
                            hash     = location
                                .href
                                .split("#")[1];
                            hashnode = document.getElementById(hash);
                            if (hashnode !== null) {
                                parent = <HTMLElement>hashnode.parentNode;
                                test   = (parent.nodeName.toLowerCase() === "h2" || parent.getAttribute("class") === "content-hide");
                                if (test === true) {
                                    parent = <HTMLElement>parent.parentNode;
                                    parent.getElementsByTagName("button")[0].click();
                                } else {
                                    do {
                                        parent = <HTMLElement>parent.parentNode;
                                        test   = (parent.nodeName.toLowerCase() === "h2" || parent.getAttribute("class") === "content-hide");
                                    } while (test === false && parent.nodeName.toLowerCase() !== "body");
                                    if (test === true) {
                                        parent = <HTMLElement>parent.parentNode;
                                        parent.getElementsByTagName("button")[0].click();
                                    }
                                }
                                document.documentElement.scrollTop = hashnode.offsetTop;
                                body.scrollTop                     = hashnode.offsetTop;
                            }
                        }
                    },
                    colorChange = function dom_load_documentation_colorChange():void {
                        const options:NodeListOf<HTMLOptionElement> = colorScheme.getElementsByTagName("option"),
                            olen:number = options.length;
                        if (localStorage !== null && localStorage.settings !== undefined && localStorage.settings !== null && localStorage.settings.indexOf(":undefined") > 0) {
                            localStorage.settings = localStorage
                                .settings
                                .replace(/:undefined/g, ":false");
                        }
                        pd.data.settings = (localStorage.settings !== undefined)
                            ? JSON.parse(localStorage.settings)
                            : {};
                        if (colorParam.indexOf("c=") === 0 || colorParam.indexOf("&c=") > -1) {
                            if (colorParam.indexOf("&c=") > -1) {
                                colorParam.substr(colorParam.indexOf("&c=") + 1);
                            }
                            colorParam = colorParam.split("&")[0];
                            colorParam = colorParam.substr(colorParam.indexOf("=") + 1);
                            b = 0;
                            do {
                                if (options[b].value.toLowerCase() === colorParam) {
                                    node.selectedIndex = b;
                                    break;
                                }
                                b = b + 1;
                            } while (b < olen);
                        }
                        if (((olen > 0 && b !== olen) || olen === 0) && pd.data.settings.colorScheme !== undefined) {
                            colorScheme.selectedIndex = pd.data.settings.colorScheme;
                        }
                        pd
                            .event
                            .colorScheme();
                        colorScheme.onchange = pd.event.colorScheme;
                    };
                b = docbuttons.length;
                a = 0;
                do {
                    if (docbuttons[a].parentNode.nodeName.toLowerCase() === "h2") {
                        docbuttons[a].onclick = docbuttonClick;
                    }
                    a = a + 1;
                } while (a < b);
                if (colorScheme !== null) {
                    colorChange();
                }
                window.onhashchange = hashgo;
                hashgo();
            }
            if (page === "page") {
                let b:number          = 0,
                    options:NodeListOf<HTMLOptionElement>,
                    olen:number       = 0,
                    colorParam:string = (typeof location === "object" && typeof location.href === "string" && location.href.indexOf("?") > -1)
                        ? location
                            .href
                            .toLowerCase()
                            .split("?")[1]
                        : "";
                node    = pd.id("option-color");
                options = node.getElementsByTagName("option");
                olen    = options.length;
                if (node !== null) {
                    if (localStorage !== null && localStorage.settings !== undefined && localStorage.settings !== null && localStorage.settings.indexOf(":undefined") > 0) {
                        localStorage.settings = localStorage
                            .settings
                            .replace(/:undefined/g, ":false");
                    }
                    pd.data.settings = (localStorage.settings !== undefined)
                        ? JSON.parse(localStorage.settings)
                        : {};
                    if (colorParam.indexOf("c=") === 0 || colorParam.indexOf("&c=") > -1) {
                        if (colorParam.indexOf("&c=") > -1) {
                            colorParam.substr(colorParam.indexOf("&c=") + 1);
                        }
                        colorParam = colorParam.split("&")[0];
                        colorParam = colorParam.substr(colorParam.indexOf("=") + 1);
                        b = 0;
                        do {
                            if (options[b].value.toLowerCase() === colorParam) {
                                node.selectedIndex = b;
                                break;
                            }
                            b = b + 1;
                        } while (b < olen);
                    }
                    if (((olen > 0 && b !== olen) || olen === 0) && pd.data.settings.colorScheme !== undefined) {
                        node.selectedIndex = pd.data.settings.colorScheme;
                    }
                    pd
                        .event
                        .colorScheme();
                    node.onchange = pd.event.colorScheme;
                }
                {
                    let inca:number  = 0,
                        incb:number  = 0,
                        x:HTMLElement,
                        ol:NodeListOf<HTMLOListElement>,
                        li:NodeListOf<HTMLLIElement>,
                        lilen:number = 0;
                    const div:NodeListOf<HTMLDivElement> = document.getElementsByTagName("div"),
                        len:number   = div.length,
                        foldwrapper = function dom_load_pagefold() {
                            x.onclick = pd.event.beaufold(x);
                        };
                    inca = 0;
                    do {
                        if (div[inca].getAttribute("class") === "beautify") {
                            ol = div[inca].getElementsByTagName("ol");
                            if (ol[0].getAttribute("class") === "count") {
                                li    = ol[0].getElementsByTagName("li");
                                lilen = li.length;
                                incb  = 0;
                                do {
                                    if (li[incb].getAttribute("class") === "fold") {
                                        x = li[incb];
                                        foldwrapper();
                                    }
                                    incb = incb + 1;
                                } while (incb < lilen);
                            }
                        }
                        inca = inca + 1;
                    } while (inca < len);
                }
            }
            pd.test.load = false;
        },
        loadPrep = function dom_loadPrep():void {
            pd.data.node = {
                announce    : pd.id("announcement"),
                codeIn      : pd.id("input"),
                codeOut     : pd.id("output"),
                comment     : pd.id("option_comment"),
                headline    : pd.id("headline"),
                jsscope     : pd.id("jsscope-yes"),
                lang        : pd.id("language"),
                langdefault : pd.id("lang-default"),
                maxInputs   : pd.id("hideOptions"),
                modeBeau    : pd.id("modebeautify"),
                modeDiff    : pd.id("modediff"),
                modeMinn    : pd.id("modeminify"),
                modePars    : pd.id("modeparse"),
                page        : (function dom_dataPage():HTMLDivElement {
                    const divs:NodeListOf<HTMLDivElement> = document.getElementsByTagName("div");
                    if (divs.length === 0) {
                        return null;
                    }
                    return divs[0];
                }()),
                pars        : pd.id("Parse"),
                parsOps     : pd.id("parseops"),
                report      : {
                    code: {
                        box: pd.id("codereport")
                    },
                    feed: {
                        box: pd.id("feedreport")
                    },
                    stat: {
                        box: pd.id("statreport")
                    }
                },
                save        : pd.id("diff-save"),
                webtool     : pd.id("webtool")
            };
            load();
            if (pd.data.node.webtool !== null) {
                pd.data.node.webtool.style.display = "block";
            }
        };
    
    prettydiff.meta = meta;
    prettydiff.dom = pd;
    //namespace for data points and dom nodes
    pd.data.node = {
        analOps     : pd.id("analysisops"),
        announce    : pd.id("announcement"),
        codeIn      : pd.id("input"),
        codeOut     : pd.id("output"),
        comment     : pd.id("option_comment"),
        headline    : pd.id("headline"),
        jsscope     : pd.id("jsscope-yes"),
        lang        : pd.id("language"),
        langdefault : pd.id("lang-default"),
        maxInputs   : pd.id("hideOptions"),
        modeBeau    : pd.id("modebeautify"),
        modeDiff    : pd.id("modediff"),
        modeMinn    : pd.id("modeminify"),
        modePars    : pd.id("modeparse"),
        modeAnal    : pd.id("modeanalysis"),
        page        : (document.getElementsByTagName("div").length > 0)
            ? document.getElementsByTagName("div")[0]
            : null,
        pars        : pd.id("Parse"),
        parsOps     : pd.id("parseops"),
        report      : {
            code: {
                box: pd.id("codereport")
            },
            feed: {
                box: pd.id("feedreport")
            },
            stat: {
                box: pd.id("statreport")
            }
        },
        save        : pd.id("diff-save")
    };
    if (pd.test.agent.indexOf("msie 8.0;") > 0) {
        document.getElementsByTagName("body")[0].innerHTML = "<h1>Pretty Diff</h1> <p>Sorry, but Pretty Diff no longer supports IE8. <a href='" +
                "http://www.microsoft.com/en-us/download/internet-explorer.aspx'>Please upgrade</";
        return;
    }

    //namespace for Ace editors
    pd.ace              = {};
    //namespace for internal functions
    pd.app              = {
        //builds the Ace editors
        aceApply : function dom_app_aceApply(nodeName:string, maxWidth:boolean):any {
            const div:HTMLDivElement        = document.createElement("div"),
                span:HTMLSpanElement       = document.createElement("span"),
                node:HTMLDivElement       = pd.data.node[nodeName],
                parent:HTMLElement     = <HTMLElement>node.parentNode.parentNode,
                labels:NodeListOf<HTMLLabelElement> = parent.getElementsByTagName("label"),
                label:HTMLLabelElement = labels[labels.length - 1],
                attributes:NamedNodeMap = node.attributes,
                p:HTMLParagraphElement = document.createElement("p"),
                dollar:string     = "$",
                len:number        = attributes.length;
            let a:number          = 0,
                edit:any       = {};
            do {
                if (attributes[a].name !== "rows" && attributes[a].name !== "cols" && attributes[a].name !== "wrap") {
                    div.setAttribute(attributes[a].name, attributes[a].value);
                }
                a = a + 1;
            } while (a < len);
            label.parentNode.removeChild(label);
            p.appendChild(label);
            p.setAttribute("class", "inputLabel");
            parent.appendChild(p);
            parent.appendChild(div);
            parent.removeChild(node.parentNode);
            if (maxWidth === true) {
                div.style.width = "100%";
            }
            div.style.fontSize              = "1.4em";
            edit                            = ace.edit(div);
            pd.data.node[nodeName]          = div.getElementsByTagName("textarea")[0];
            edit[dollar + "blockScrolling"] = Infinity;
            return edit;
        },
        // Readjusts the heights of the editors to compensate for various changes to the
        // interface, like screen resize
        fixHeight: function dom_app_fixHeight():void {
            const input:HTMLElement = pd.id("input"),
                output:HTMLElement = pd.id("output"),
                height:number   = window.innerHeight || document.getElementsByTagName("body")[0].clientHeight;
            let math:number     = 0,
                headline:number = 0;
            if (pd.data.node.headline !== null && pd.data.node.headline.style.display === "block") {
                headline = 3.8;
            }
            if (pd.test.ace === true) {
                math = (height / 14) - (14.31 + headline);
                if (input !== null) {
                    input.style.height = math + "em";
                    pd
                        .ace
                        .codeIn
                        .setStyle("height:" + math + "em");
                    pd
                        .ace
                        .codeIn
                        .resize();
                }
                if (output !== null) {
                    output.style.height = math + "em";
                    pd
                        .ace
                        .codeOut
                        .setStyle("height:" + math + "em");
                    pd
                        .ace
                        .codeOut
                        .resize();
                }
            } else {
                math = (height / 14.4) - (15.425 + headline);
                if (input !== null) {
                    input.style.height = math + "em";
                }
                if (output !== null) {
                    output.style.height = math + "em";
                }
            }
        },
        //sets indentation size in Ace editors
        insize   : function dom_app_insize(el:HTMLInputElement):void {
            const value = Number(el.value);
            if (pd.data.node.codeIn !== null) {
                pd
                    .ace
                    .codeIn
                    .getSession()
                    .setTabSize(value);
            }
            if (pd.data.node.codeOut !== null) {
                pd
                    .ace
                    .codeOut
                    .getSession()
                    .setTabSize(value);
            }
        },
        // determine the specific language if auto or unknown all - change all language
        // modes? comes from pd.codeops, which is      fired on change of language
        // select list obj - the ace obj passed in. {} empty object if `all` is true
        // lang - a language passed in. "" empty string means auto detect
        langkey  : function dom_app_langkey(all:boolean, obj:any, lang:string):[string, string, string] {
            let sample:string      = "",
                // defaultt      = actual default lang value from the select list
                defaultt:string    = "",
                value:languageAuto;
            const language    = prettydiff.language;
            if (typeof language !== "object") {
                return ["", "", ""];
            }
            defaultt = (pd.data.node.langdefault === null || pd.data.node.langdefault.nodeName.toLowerCase() !== "select")
                ? "javascript"
                : language.setlangmode(pd.data.node.langdefault[pd.data.node.langdefault.selectedIndex].value);
            if (obj !== undefined && obj !== null) {
                if (pd.test.ace === true && obj.getValue !== undefined) {
                    sample = obj.getValue();
                    if (sample.indexOf("http") === 0 || sample.indexOf("file:///") === 0) {
                        if (obj === pd.ace.codeOut) {
                            sample = pd.data.diff;
                        } else {
                            sample = pd.data.source;
                        }
                    }
                } else if (typeof obj.value === "string") {
                    sample = obj.value;
                }
            }
            if (pd.data.node.lang !== null && pd.data.node.lang.selectedIndex > 0) {
                all  = true;
                lang = pd.data.node.lang[pd.data.node.lang.selectedIndex].value;
            }
            if (lang === "csv") {
                pd.data.langvalue = ["plain_text", "csv", "CSV"];
            } else if (lang === "text") {
                pd.data.langvalue = ["plain_text", "text", "Plain Text"];
            } else if (lang !== "") {
                pd.data.langvalue = [lang, language.setlangmode(lang), language.nameproper(lang)];
            } else if (sample !== "" || pd.test.ace === false) {
                pd.data.langvalue = language.auto(sample, defaultt);
            } else {
                pd.data.langvalue = [defaultt, language.setlangmode(defaultt), language.nameproper(defaultt)];
            }
            value = pd.data.langvalue;
            if (pd.test.ace === true) {
                if (all === true) {
                    if (all === true && lang === "") {
                        value             = language.auto(pd.ace.codeIn.getValue(), defaultt);
                        pd.data.langvalue = value;
                    }
                    if (value[0] === "tss") {
                        value[0] = "javascript";
                    } else if (value[0] === "dustjs") {
                        value[0] = "html";
                    } else if (value[0] === "markup") {
                        value[0] = "xml";
                    }
                    if (pd.data.node.codeIn !== null) {
                        pd
                            .ace
                            .codeIn
                            .getSession()
                            .setMode("ace/mode/" + value[0]);
                    }
                    if (pd.data.node.codeOut !== null) {
                        pd
                            .ace
                            .codeOut
                            .getSession()
                            .setMode("ace/mode/" + value[0]);
                    }
                }
            }
            if (all === true && lang !== "") {
                return value;
            }
            if (value.length < 1 && lang === "") {
                if (pd.data.node.codeIn !== null) {
                    value = language.auto(pd.data.node.codeIn.value, defaultt);
                }
                if (value.length < 1) {
                    return ["javascript", "script", "JavaScript"];
                }
                pd.data.langvalue = value;
            }
            if (lang === "text") {
                return ["text", "text", "Plain Text"];
            }
            return value;
        },
        //store tool changes into localStorage to maintain state
        options  : function dom_app_options(x?:HTMLElement):void {
            let input:HTMLInputElement,
                select:HTMLSelectElement,
                item:HTMLElement,
                node:string   = "",
                xname:string  = "",
                type:string   = "",
                id:string     = "",
                classy:string = "",
                h3:HTMLElement,
                body:HTMLElement;
            if (x === undefined || x.nodeType > 1) {
                return;
            }
            xname = x.nodeName.toLowerCase();
            if (xname === "div") {
                if (x.getAttribute("class") === "box") {
                    item = x;
                } else {
                    if (x.getElementsByTagName("input")[0] === undefined) {
                        return;
                    }
                    item = x.getElementsByTagName("input")[0];
                }
            } else if (xname === "input") {
                input = <HTMLInputElement>x;
                item = input;
            } else if (xname === "select") {
                select = <HTMLSelectElement>x;
                item = select;
            } else {
                input = <HTMLInputElement>x.getElementsByTagName("input")[0];
                item = input;
            }
            if (pd.test.load === false && item !== pd.data.node.lang) {
                item.focus();
            }
            node   = item
                .nodeName
                .toLowerCase();
            xname  = item.getAttribute("name");
            type   = item.getAttribute("type");
            id     = item.getAttribute("id");
            classy = item.getAttribute("class");
            if (pd.test.load === true) {
                return;
            }
            if (node === "input") {
                if (type === "radio") {
                    if (id === "beau-other") {
                        pd.data.settings.beauchar = pd
                            .id("beau-char")
                            .value;
                    } else {
                        pd.data.settings[xname] = id;
                    }
                    if (id === "diff-other") {
                        pd.data.settings.diffchar = pd
                            .id("diff-char")
                            .value;
                    } else {
                        pd.data.settings[xname] = id;
                    }
                } else if (type === "text") {
                    if (id === "beau-char") {
                        pd.data.settings.beauchar = input.value;
                    } else if (id === "diff-char") {
                        pd.data.settings.diffchar = input.value;
                    } else {
                        pd.data.settings[id] = input.value;
                    }
                }
            } else if (node === "select") {
                pd.data.settings[id] = select.selectedIndex;
            } else if (node === "div" && classy === "box") {
                h3   = item.getElementsByTagName("h3")[0];
                body = item.getElementsByTagName("div")[0];
                if (pd.data.settings[id] === undefined) {
                    pd.data.settings[id] = {};
                }
                if (body.style.display === "none" && h3.clientWidth < 175) {
                    pd.data.settings[id].min = true;
                    pd.data.settings[id].max = false;
                } else if (pd.data.settings[id].max === false || pd.data.settings[id].max === undefined) {
                    pd.data.settings[id].min  = false;
                    pd.data.settings[id].left = item.offsetLeft;
                    pd.data.settings[id].top  = item.offsetTop;
                    if (pd.test.agent.indexOf("macintosh") > 0) {
                        pd.data.settings[id].width  = (body.clientWidth - 20);
                        pd.data.settings[id].height = (body.clientHeight - 53);
                    } else {
                        pd.data.settings[id].width  = (body.clientWidth - 4);
                        pd.data.settings[id].height = (body.clientHeight - 36);
                    }
                }
            } else if (node === "button" && id !== null) {
                pd.data.settings[id] = item
                    .innerHTML
                    .replace(/\s+/g, " ");
            }
            localStorage.settings = JSON.stringify(pd.data.settings);
            if (classy === "box") {
                return;
            }
            if (pd.data.node.comment !== null && id !== null) {
                if (item.nodeName.toLowerCase() === "select") {
                    node = select[select.selectedIndex].value;
                } else {
                    node = input.value;
                }
                //pd.data.commentString = prettydiff.options.functions.domops(id, node, pd.data.commentString);
                if (pd.data.node.comment !== null) {
                    if (pd.data.commentString.length === 0) {
                        pd.data.node.comment.innerHTML = "/*prettydiff.com \u002a/";
                    } else if (pd.data.commentString.length === 1) {
                        pd.data.node.comment.innerHTML = "/*prettydiff.com " + pd
                            .data
                            .commentString[0]
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/api\./g, "") + " \u002a/";
                    } else {
                        pd.data.node.comment.innerHTML = "/*prettydiff.com " + pd
                            .data
                            .commentString
                            .join(", ")
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/api\./g, "") + " \u002a/";
                    }
                }
                localStorage.commentString = JSON
                    .stringify(pd.data.commentString)
                    .replace(/api\./g, "");
            }
        },
        //intelligently raise the z-index of the report windows
        zTop     : function dom_app_top(x:HTMLElement):void {
            const indexListed = pd.data.zIndex,
                indexes     = [
                    (pd.data.node.report.feed.box === null)
                        ? 0
                        : Number(pd.data.node.report.feed.box.style.zIndex),
                    (pd.data.node.report.code.box === null)
                        ? 0
                        : Number(pd.data.node.report.code.box.style.zIndex),
                    (pd.data.node.report.stat.box === null)
                        ? 0
                        : Number(pd.data.node.report.stat.box.style.zIndex)
                ];
            let indexMax    = Math.max(indexListed, indexes[0], indexes[1], indexes[2]) + 1;
            if (indexMax < 11) {
                indexMax = 11;
            }
            pd.data.zIndex = indexMax;
            if (x.nodeType === 1) {
                x.style.zIndex = String(indexMax);
            }
        }
    };
    //namespace for event handlers
    pd.event            = {
        //fixing areaTabOut in the case of unintentional back tabs
        areaShiftUp  : function dom_event_areaShiftUp(event:KeyboardEvent):void {
            if (event.keyCode === 16 && pd.test.tabesc.length > 0) {
                pd.test.tabesc = [];
            }
            if (event.keyCode === 17 || event.keyCode === 224) {
                pd.data.tabtrue = true;
            }
        },
        //allows visual folding of function in the JSPretty jsscope HTML output
        beaufold     : function dom_event_beaufold(el:HTMLElement):void {
            let a:number     = 0,
                b:string     = "";
            const title:string[] = el
                    .getAttribute("title")
                    .split("line "),
                parent:[HTMLElement, HTMLElement] = [<HTMLElement>el.parentNode, <HTMLElement>el.parentNode.nextSibling],
                min:number   = Number(title[1].substr(0, title[1].indexOf(" "))),
                max:number   = Number(title[2]),
                list:[NodeListOf<HTMLLIElement>, NodeListOf<HTMLLIElement>]  = [
                    parent[0].getElementsByTagName("li"),
                    parent[1].getElementsByTagName("li")
                ];
            a = min;
            if (el.innerHTML.charAt(0) === "-") {
                do {
                    list[0][a].style.display = "none";
                    list[1][a].style.display = "none";
                    a = a + 1;
                } while (a < max);
                el.innerHTML = "+" + el
                    .innerHTML
                    .substr(1);
            } else {
                do {
                    list[0][a].style.display = "block";
                    list[1][a].style.display = "block";
                    if (list[0][a].getAttribute("class") === "fold" && list[0][a].innerHTML.charAt(0) === "+") {
                        b = list[0][a].getAttribute("title");
                        b = b.substring(b.indexOf("to line ") + 1);
                        a = Number(b) - 1;
                    }
                    a = a + 1;
                } while (a < max);
                el.innerHTML = "-" + el
                    .innerHTML
                    .substr(1);
            }
        },
        //clears the Pretty Diff comment string
        clearComment : function dom_event_clearComment():void {
            localStorage.commentString = "[]";
            pd.data.commentString      = [];
            if (pd.data.node.comment !== null) {
                pd.data.node.comment.innerHTML = "/*prettydiff.com \u002a/";
            }
        },
        //change the color scheme of the web UI
        colorScheme  : function dom_event_colorScheme():void {
            const item:HTMLSelectElement = pd.id("option-color"),
                option:NodeListOf<HTMLOptionElement>    = item.getElementsByTagName("option"),
                optionLen:number = option.length,
                index:number     = (function dom_event_colorScheme_indexLen():number {
                    if (item.selectedIndex < 0 || item.selectedIndex > optionLen) {
                        item.selectedIndex = optionLen - 1;
                        return optionLen - 1;
                    }
                    return item.selectedIndex;
                }()),
                color:string     = option[index]
                    .innerHTML
                    .toLowerCase()
                    .replace(/\s+/g, ""),
                logo      = pd.id("pdlogo");
            let theme:string     = "",
                logoColor:string = "";
            document
                .getElementsByTagName("body")[0]
                .setAttribute("class", color);
            if (pd.test.ace === true) {
                if (color === "white") {
                    theme = "ace/theme/textmate";
                }
                if (color === "shadow") {
                    theme = "ace/theme/idle_fingers";
                }
                if (color === "canvas") {
                    theme = "ace/theme/textmate";
                }
                pd
                    .ace
                    .codeIn
                    .setTheme(theme);
                pd
                    .ace
                    .codeOut
                    .setTheme(theme);
            }
            pd.data.color = color;
            if (logo !== null) {
                if (color === "canvas") {
                    logoColor = "664";
                } else if (color === "shadow") {
                    logoColor = "999";
                } else {
                    logoColor = "666";
                }
                logo.style.borderColor = "#" + logoColor;
                logo
                    .getElementsByTagName("g")[0]
                    .setAttribute("fill", "#" + logoColor);
            }
            if (pd.test.load === false) {
                pd
                    .app
                    .options(item);
            }
        },
        // allows grabbing and resizing columns (from the third column) in the diff
        // side-by-side report
        colSliderGrab: function dom_event_colSliderGrab(event:Event, node:HTMLElement):boolean {
            let subOffset:number   = 0,
                withinRange:boolean = false,
                offset:number      = 0,
                status:string      = "ew",
                width:number       = 0,
                total:number       = 0,
                diffLeft:HTMLElement,
                par1:HTMLElement,
                par2:HTMLElement;
            const touch:boolean       = (event !== null && event.type === "touchstart"),
                diffRight:HTMLElement   = <HTMLElement>node.parentNode,
                diff:HTMLElement        = <HTMLElement>diffRight.parentNode,
                lists:NodeListOf<HTMLOListElement>       = diff.getElementsByTagName("ol"),
                counter:number     = lists[0].clientWidth,
                data:number        = lists[1].clientWidth,
                min:number         = ((total - counter - data - 2) - width),
                max:number         = (total - width - counter),
                minAdjust:number   = min + 15,
                maxAdjust:number   = max - 15;
            diffLeft = <HTMLElement>diffRight.previousSibling;
            par1 = <HTMLElement>lists[2].parentNode;
            par2 = <HTMLElement>lists[2].parentNode.parentNode;
            offset = par1.offsetLeft - par2.offsetLeft;
            width = par1.clientWidth;
            total = par2.clientWidth;
            event.preventDefault();
            if (typeof pd.data.node === "object" && pd.data.node.report.code.box !== null) {
                offset = offset + pd.data.node.report.code.box.offsetLeft;
                offset = offset - pd.data.node.report.code.body.scrollLeft;
            } else {
                par1 = <HTMLElement>document.body.parentNode;
                subOffset = (par1.scrollLeft > document.body.scrollLeft)
                    ? par1.scrollLeft
                    : document.body.scrollLeft;
                offset    = offset - subOffset;
            }
            offset             = offset + node.clientWidth;
            node.style.cursor  = "ew-resize";
            diff.style.width   = (total / 10) + "em";
            diff.style.display = "inline-block";
            if (diffLeft.nodeType !== 1) {
                do {
                    diffLeft = <HTMLElement>diffLeft.previousSibling;
                } while (diffLeft.nodeType !== 1);
            }
            diffLeft.style.display   = "block";
            diffRight.style.width    = (diffRight.clientWidth / 10) + "em";
            diffRight.style.position = "absolute";
            if (touch === true) {
                document.ontouchmove  = function dom_event_colSliderGrab_Touchboxmove(f:TouchEvent):void {
                    f.preventDefault();
                    subOffset = offset - f.touches[0].clientX;
                    if (subOffset > minAdjust && subOffset < maxAdjust) {
                        withinRange = true;
                    }
                    if (withinRange === true && subOffset > maxAdjust) {
                        diffRight.style.width = ((total - counter - 2) / 10) + "em";
                        status                = "e";
                    } else if (withinRange === true && subOffset < minAdjust) {
                        diffRight.style.width = ((total - counter - data - 2) / 10) + "em";
                        status                = "w";
                    } else if (subOffset < max && subOffset > min) {
                        diffRight.style.width = ((width + subOffset) / 10) + "em";
                        status                = "ew";
                    }
                    document.ontouchend = function dom_event_colSliderGrab_Touchboxmove_drop(f:TouchEvent):void {
                        f.preventDefault();
                        node.style.cursor = status + "-resize";
                        document.ontouchmove = null;
                        document.ontouchend  = null;
                    };
                };
                document.ontouchstart = null;
            } else {
                document.onmousemove = function dom_event_colSliderGrab_Mouseboxmove(f:MouseEvent):void {
                    f.preventDefault();
                    subOffset = offset - f.clientX;
                    if (subOffset > minAdjust && subOffset < maxAdjust) {
                        withinRange = true;
                    }
                    if (withinRange === true && subOffset > maxAdjust) {
                        diffRight.style.width = ((total - counter - 2) / 10) + "em";
                        status                = "e";
                    } else if (withinRange === true && subOffset < minAdjust) {
                        diffRight.style.width = ((total - counter - data - 2) / 10) + "em";
                        status                = "w";
                    } else if (subOffset < max && subOffset > min) {
                        diffRight.style.width = ((width + subOffset) / 10) + "em";
                        status                = "ew";
                    }
                    document.onmouseup = function dom_event_colSliderGrab_Mouseboxmove_drop(f:MouseEvent):void {
                        f.preventDefault();
                        node.style.cursor = status + "-resize";
                        document.onmousemove = null;
                        document.onmouseup   = null;
                    };
                };
                document.onmousedown = null;
            }
            return false;
        },
        //allows visual folding of consecutive equal lines in a diff report
        difffold     : function dom_event_difffold(node:HTMLElement):void {
            let a:number         = 0,
                b:number         = 0,
                max:number,
                lists:NodeListOf<HTMLLIElement>[];
            const title:string[]     = node
                    .getAttribute("title")
                    .split("line "),
                min:number       = Number(title[1].substr(0, title[1].indexOf(" "))),
                inner:string     = node.innerHTML,
                parent:HTMLElement    = <HTMLElement>node.parentNode.parentNode,
                par1:HTMLElement = <HTMLElement>parent.parentNode,
                listnodes:NodeListOf<HTMLOListElement> = (parent.getAttribute("class") === "diff")
                    ? parent.getElementsByTagName("ol")
                    : par1.getElementsByTagName("ol"),
                listLen:number   = listnodes.length;
            do {
                lists.push(listnodes[a].getElementsByTagName("li"));
                a = a + 1;
            } while (a < listLen);
            max = (max >= lists[0].length)
                ? lists[0].length
                : Number(title[2]);
            if (inner.charAt(0) === "-") {
                node.innerHTML = "+" + inner.substr(1);
                a = min;
                if (min < max) {
                    do {
                        b = 0;
                        do {
                            lists[b][a].style.display = "none";
                            b = b + 1;
                        } while (b < listLen);
                        a = a + 1;
                    } while (a < max);
                }
            } else {
                node.innerHTML = "-" + inner.substr(1);
                a = min;
                if (min < max) {
                    do {
                        b = 0;
                        do {
                            lists[b][a].style.display = "block";
                            b = b + 1;
                        } while (b < listLen);
                        a = a + 1;
                    } while (a < max);
                }
            }
        },
        //submits the comment card
        feedsubmit   : function dom_event_feedsubmit(auto:boolean):void {
            let a:number = 0;
            const datapack:any  = {},
                namecheck:any = (localStorage.settings !== undefined)
                    ? JSON.parse(localStorage.settings)
                    : {},
                radios:NodeListOf<HTMLInputElement> = pd
                    .id("feedradio1")
                    .parentNode
                    .parentNode
                    .getElementsByTagName("input"),
                text      = (pd.id("feedtextarea") === null)
                    ? ""
                    : pd
                        .id("feedtextarea")
                        .value,
                email:string     = (pd.id("feedemail") === null)
                    ? ""
                    : pd
                        .id("feedemail")
                        .value,
                xhr:XMLHttpRequest = new XMLHttpRequest(),
                sendit    = function dom_event_feedsubmit_sendit():void {
                    const node:HTMLElement = pd.id("feedintro");
                    xhr.withCredentials = true;
                    xhr.open("POST", "http://prettydiff.com:8000/feedback/", true);
                    xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
                    xhr.send(JSON.stringify(datapack));
                    pd
                        .data
                        .node
                        .report
                        .feed
                        .box
                        .getElementsByTagName("button")[1]
                        .click();
                    if (node !== null) {
                        node.innerHTML = "Please feel free to submit feedback about Pretty Diff at any time by answering t" +
                                "he following questions.";
                    }
                };
            if (auto === true) {
                datapack.name     = pd.data.settings.knownname;
                datapack.settings = pd.data.settings;
                datapack.stats    = pd.data.stat;
                datapack.type     = "auto";
                sendit();
                return;
            }
            if (pd.id("feedradio1") === null || namecheck.knownname !== pd.data.settings.knownname) {
                return;
            }
            a = radios.length - 1;
            if (a > 0) {
                do {
                    if (radios[a].checked === true) {
                        break;
                    }
                    a = a - 1;
                } while (a > -1);
            }
            if (a < 0) {
                return;
            }
            datapack.comment  = text;
            datapack.email    = email;
            datapack.name     = pd.data.settings.knownname;
            datapack.rating   = a + 1;
            datapack.settings = pd.data.settings;
            datapack.stats    = pd.data.stat;
            datapack.type     = "feedback";
            sendit();
        },
        //nullifies the current "file" event
        filenull     : function dom_event_filenull(event:Event):void {
            event.stopPropagation();
            event.preventDefault();
        },
        // this function allows typing of tab characters into textareas without the
        // textarea loosing focus
        fixtabs      : function dom_event_fixtabs(event:KeyboardEvent, node:HTMLInputElement):boolean {
            let start:string = "",
                end:string   = "",
                val:string   = "",
                sel:number   = 0;
            if (typeof event !== "object" || event === null || event.type !== "keydown" || event.keyCode !== 9 || typeof node.selectionStart !== "number" || typeof node.selectionEnd !== "number") {
                return true;
            }
            val              = node.value;
            sel              = node.selectionStart;
            start            = val.substring(0, sel);
            end              = val.substring(sel, val.length);
            node.value          = start + "\t" + end;
            node.selectionStart = sel + 1;
            node.selectionEnd   = sel + 1;
            event.preventDefault();
            return false;
        },
        //tests if a key press is a short command
        keydown      : function dom_event_keydown(event:KeyboardEvent):void {
            if (pd.test.keypress === true && (pd.test.keystore.length === 0 || event.keyCode !== pd.test.keystore[pd.test.keystore.length - 1]) && event.keyCode !== 17 && event.keyCode !== 224) {
                pd
                    .test
                    .keystore
                    .push(event.keyCode);
            }
            if (event.keyCode === 17 || event.ctrlKey === true || event.keyCode === 224) {
                pd.test.keypress = true;
            }
        },
        //alters available options depending upon language selection
        langOps      : function dom_event_langOps(node:HTMLElement):void {
            let name:string = node.nodeName.toLowerCase(),
                select:HTMLSelectElement,
                lang:string = "",
                xml:boolean  = false,
                dqp:HTMLElement  = pd.id("diffquanp"),
                dqt:HTMLElement  = pd.id("difftypep"),
                db:HTMLElement   = pd.id("diffbeautify"),
                csvp:HTMLElement = pd.id("csvcharp"),
                hd:HTMLInputElement   = pd.id("htmld-yes"),
                he:HTMLInputElement   = pd.id("htmld-no"),
                hm:HTMLInputElement   = pd.id("htmlm-yes"),
                hn:HTMLInputElement   = pd.id("htmlm-no"),
                hp:HTMLInputElement   = pd.id("phtml-yes"),
                hq:HTMLInputElement   = pd.id("phtml-no"),
                hy:HTMLInputElement   = pd.id("html-yes"),
                hz:HTMLInputElement   = pd.id("html-no");
            if (node.nodeType === 1 && name === "select") {
                select = <HTMLSelectElement>node;
                xml  = (select.getElementsByTagName("option")[select.selectedIndex].innerHTML === "XML" || select.getElementsByTagName("option")[select.selectedIndex].innerHTML === "JSTL");
            }
            lang = (pd.data.node.lang === null)
                ? "javascript"
                : (pd.data.node.lang.nodeName === "select")
                    ? pd.data.node.lang[pd.data.node.lang.selectedIndex].value
                    : pd.data.node.lang.value;
            if (pd.data.langvalue[0] === undefined) {
                pd.data.langvalue[0] = lang;
            }
            if (pd.data.node.modeDiff !== null && pd.data.node.modeDiff.checked === true) {
                if (pd.data.node.minnOps !== null) {
                    pd.data.node.minnOps.style.display = "none";
                }
                if (pd.data.node.beauOps !== null) {
                    pd.data.node.beauOps.style.display = "none";
                }
                if (pd.data.node.parsOps !== null) {
                    pd.data.node.parsOps.style.display = "none";
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
            } else if (pd.data.node.modeBeau !== null && pd.data.node.modeBeau.checked === true) {
                if (pd.data.node.minnOps !== null) {
                    pd.data.node.minnOps.style.display = "none";
                }
                if (pd.data.node.diffOps !== null) {
                    pd.data.node.diffOps.style.display = "none";
                }
                if (pd.data.node.parsOps !== null) {
                    pd.data.node.parsOps.style.display = "none";
                }
                if (pd.data.node.beauOps !== null) {
                    if (lang === "csv") {
                        pd.data.node.beauOps.style.display = "none";
                    } else {
                        pd.data.node.beauOps.style.display = "block";
                    }
                }
            } else if (pd.data.node.modeMinn !== null && pd.data.node.modeMinn.checked === true) {
                if (pd.data.node.beauOps !== null) {
                    pd.data.node.beauOps.style.display = "none";
                }
                if (pd.data.node.diffOps !== null) {
                    pd.data.node.diffOps.style.display = "none";
                }
                if (pd.data.node.parsOps !== null) {
                    pd.data.node.parsOps.style.display = "none";
                }
                if (pd.data.node.minnOps !== null) {
                    if (lang === "csv") {
                        pd.data.node.minnOps.style.display = "none";
                    } else {
                        pd.data.node.minnOps.style.display = "block";
                    }
                }
            } else if (pd.data.node.modePars !== null && pd.data.node.modePars.checked === true) {
                if (pd.data.node.beauOps !== null) {
                    pd.data.node.beauOps.style.display = "none";
                }
                if (pd.data.node.diffOps !== null) {
                    pd.data.node.diffOps.style.display = "none";
                }
                if (pd.data.node.minnOps !== null) {
                    pd.data.node.minnOps.style.display = "none";
                }
                if (pd.data.node.minnOps !== null) {
                    if (lang === "csv") {
                        pd.data.node.parsOps.style.display = "none";
                    } else {
                        pd.data.node.parsOps.style.display = "block";
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
                if (hp !== null) {
                    hp.checked = true;
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
                if (hq !== null) {
                    hq.checked = true;
                }
            } else {
                if (pd.data.settings.presumehtmld === "htmld-no" && he !== null) {
                    he.checked = true;
                }
                if (pd.data.settings.presumehtmlm === "htmlm-no" && hn !== null) {
                    hn.checked = true;
                }
                if (pd.data.settings.presumehtml === "html-no" && hz !== null) {
                    hz.checked = true;
                }
                if (pd.data.settings.presumehtml === "phtml-no" && hq !== null) {
                    hq.checked = true;
                }
                if (pd.data.settings.presumehtmld === "htmld-yes" && hd !== null) {
                    hd.checked = true;
                }
                if (pd.data.settings.presumehtmlm === "htmlm-yes" && hm !== null) {
                    hm.checked = true;
                }
                if (pd.data.settings.presumehtml === "html-yes" && hy !== null) {
                    hy.checked = true;
                }
                if (pd.data.settings.presumehtml === "phtml-yes" && hp !== null) {
                    hp.checked = true;
                }
            }
            if (select === pd.data.node.lang) {
                if (pd.data.node.langdefault !== null) {
                    if (lang === "auto") {
                        pd.data.node.langdefault.parentNode.parentNode.style.display = "block";
                        pd.data.node.langdefault.disabled                 = false;
                    } else {
                        pd.data.node.langdefault.parentNode.parentNode.style.display = "none";
                    }
                }
                if (lang === "auto") {
                    pd
                        .app
                        .langkey(true, {}, "");
                } else {
                    pd
                        .app
                        .langkey(true, {}, lang);
                }
                if (pd.test.load === false && pd.data.mode !== "diff") {
                    pd
                        .app
                        .hideOutput(select);
                }
                pd
                    .app
                    .options(select);
            } else {
                pd
                    .app
                    .options(select);
            }
        },
        //maximize report window to available browser window
        maximize     : function dom_event_maximize(node:HTMLElement):void {
            let parent:HTMLElement,
                save:boolean    = false,
                box:HTMLElement,
                id:string      = "",
                heading:HTMLElement,
                body:HTMLElement,
                top:number,
                left:number,
                buttons:NodeListOf<HTMLButtonElement>,
                resize:HTMLButtonElement;
            if (node.nodeType !== 1) {
                return;
            }
            parent = <HTMLElement>document.body.parentNode;
            left = (parent.scrollLeft > document.body.scrollLeft)
                ? parent.scrollLeft
                : document.body.scrollLeft;
            top = (parent.scrollTop > document.body.scrollTop)
                ? parent.scrollTop
                : document.body.scrollTop;
            parent = <HTMLElement>node.parentNode;
            buttons = parent.getElementsByTagName("button");
            resize  = buttons[buttons.length - 1];
            save    = (parent.innerHTML.indexOf("save") > -1);
            box     = <HTMLElement>parent.parentNode;
            id      = box.getAttribute("id");
            heading = box.getElementsByTagName("h3")[0];
            body    = box.getElementsByTagName("div")[0];
            pd
                .app
                .zTop(box);

            //maximize
            if (node.innerHTML === "\u2191") {
                node.innerHTML = "\u2193";
                node.setAttribute("title", "Return this dialogue to its prior size and location.");
                pd.data.settings[id].max = true;
                pd.data.settings[id].min = false;
                localStorage.settings = JSON.stringify(pd.data.settings);
                pd.data.settings[id].top    = box.offsetTop;
                pd.data.settings[id].left   = box.offsetLeft;
                pd.data.settings[id].height = body.clientHeight - 36;
                pd.data.settings[id].width  = body.clientWidth - 3;
                pd.data.settings[id].zindex = box.style.zIndex;
                box.style.top               = (top / 10) + "em";
                box.style.left              = (left / 10) + "em";
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
                pd.data.settings[id].max = false;
                node.innerHTML              = "\u2191";
                node.setAttribute("title", "Maximize this dialogue to the browser window.");
                box.style.top  = (pd.data.settings[id].top / 10) + "em";
                box.style.left = (pd.data.settings[id].left / 10) + "em";
                if (save === true) {
                    heading.style.width = ((pd.data.settings[id].width / 10) - 9.76) + "em";
                } else {
                    heading.style.width = ((pd.data.settings[id].width / 10) - 6.76) + "em";
                }
                body.style.width     = (pd.data.settings[id].width / 10) + "em";
                body.style.height    = (pd.data.settings[id].height / 10) + "em";
                box.style.zIndex     = pd.data.settings[id].zindex;
                resize.style.display = "block";
                pd
                    .app
                    .options(box);
            }
        },
        //minimize report windows to the default size and location
        minimize     : function dom_event_minimize(e:Event, steps:number):boolean {
            const node:HTMLElement = <HTMLElement>e.srcElement || <HTMLElement>e.target;
            let parent:HTMLElement,
                parentNode:HTMLElement,
                box:HTMLElement,
                final:number    = 0,
                id:string        = "",
                body:HTMLElement,
                heading:HTMLElement,
                buttons:NodeListOf<HTMLButtonElement>,
                save:boolean      = false,
                buttonMin:HTMLButtonElement,
                buttonMax:HTMLButtonElement,
                left:number      = 0,
                top:number       = 0,
                buttonRes:HTMLButtonElement,
                step:number      = (steps < 1)
                    ? 1
                    : steps,
                growth    = function dom_event_minimize_growth():boolean {
                    let width:number        = 17,
                        height:number       = 3,
                        leftTarget:number   = 0,
                        topTarget:number    = 0,
                        widthTarget:number  = 0,
                        heightTarget:number = 0,
                        incW:number         = 0,
                        incH:number         = 0,
                        incL:number         = 0,
                        incT:number         = 0,
                        saveSpace:number    = (save === true)
                            ? 9.45
                            : 6.45,
                        grow         = function dom_event_minimize_growth_grow():boolean {
                            width                    = width + incW;
                            height                   = height + incH;
                            left                = left + incL;
                            top                 = top + incT;
                            body.style.width    = width + "em";
                            body.style.height   = height + "em";
                            heading.style.width = (width - saveSpace) + "em";
                            box.style.left      = left + "em";
                            box.style.top       = top + "em";
                            if (width + incW < widthTarget || height + incH < heightTarget) {
                                setTimeout(dom_event_minimize_growth_grow, 1);
                            } else {
                                box.style.left      = leftTarget + "em";
                                box.style.top       = topTarget + "em";
                                body.style.width    = widthTarget + "em";
                                body.style.height   = heightTarget + "em";
                                heading.style.width = (widthTarget - saveSpace) + "em";
                                pd
                                    .app
                                    .options(box);
                                return false;
                            }
                            return true;
                        };
                    pd
                        .app
                        .zTop(box);
                    buttonMin.innerHTML   = "\u035f";
                    parent.style.display  = "block";
                    box.style.borderWidth = ".1em";
                    box.style.right       = "auto";
                    body.style.display    = "block";
                    heading.getElementsByTagName("button")[0].style.cursor = "move";
                    heading.style.borderLeftStyle                          = "none";
                    heading.style.borderTopStyle                           = "none";
                    heading.style.margin                                   = "-0.1em 1.7em -3.2em -0.1em";
                    if (pd.test.agent.indexOf("macintosh") > 0) {
                        saveSpace = (save === true)
                            ? 8
                            : 5;
                    }
                    if (typeof pd.data.settings[id].left === "number") {
                        leftTarget   = (pd.data.settings[id].left / 10);
                        topTarget    = (pd.data.settings[id].top / 10);
                        widthTarget  = (pd.data.settings[id].width / 10);
                        heightTarget = (pd.data.settings[id].height / 10);
                    } else {
                        top                    = top + 4;
                        pd.data.settings[id].left   = 200;
                        pd.data.settings[id].top    = (top * 10);
                        pd.data.settings[id].width  = 550;
                        pd.data.settings[id].height = 450;
                        leftTarget                  = 10;
                        topTarget                   = 2;
                        widthTarget                 = 55;
                        heightTarget                = 45;
                    }
                    widthTarget  = widthTarget - 0.3;
                    heightTarget = heightTarget - 3.55;
                    if (step === 1) {
                        box.style.left    = leftTarget + "em";
                        box.style.top     = ((window.innerHeight / 10) - 30) + "em";
                        body.style.width  = widthTarget + "em";
                        body.style.height = heightTarget + "em";
                        heading.style.width    = (widthTarget - saveSpace) + "em";
                        pd
                            .app
                            .options(box);
                        return false;
                    }
                    incW                    = (widthTarget > width)
                        ? ((widthTarget - width) / step)
                        : ((width - widthTarget) / step);
                    incH                    = (heightTarget > height)
                        ? ((heightTarget - height) / step)
                        : ((height - heightTarget) / step);
                    incL                    = (leftTarget - left) / step;
                    incT                    = (topTarget - top) / step;
                    box.style.right    = "auto";
                    body.style.display = "block";
                    grow();
                    return false;
                },
                shrinkage = function dom_event_minimize_shrinkage():boolean {
                    let width        = body.clientWidth / 10,
                        height       = body.clientHeight / 10,
                        incL         = (((window.innerWidth / 10) - final - 17) - left) / step,
                        incT         = 0,
                        incW         = (width === 17)
                            ? 0
                            : (width > 17)
                                ? ((width - 17) / step)
                                : ((17 - width) / step),
                        incH         = height / step,
                        shrink       = function dom_event_minimize_shrinkage_shrink():boolean {
                            left                = left + incL;
                            top                 = top + incT;
                            width                    = width - incW;
                            height                   = height - incH;
                            body.style.width    = width + "em";
                            heading.style.width = width + "em";
                            body.style.height   = height + "em";
                            box.style.left      = left + "em";
                            box.style.top       = top + "em";
                            if (width - incW > 16.8) {
                                setTimeout(dom_event_minimize_shrinkage_shrink, 1);
                            } else {
                                box.style.left      = "auto";
                                box.style.top       = "auto";
                                box.style.right     = final + "em";
                                pd.data.settings[id].max = false;
                                body.style.display  = "none";
                                heading.getElementsByTagName("button")[0].style.cursor = "pointer";
                                heading.style.margin                                   = "-0.1em 0em -3.2em -0.1em";
                                box.style.zIndex                                            = "2";
                                pd
                                    .app
                                    .options(box);
                                return false;
                            }
                            return true;
                        };
                    parentNode = <HTMLElement>box.parentNode;
                    incT = (((parentNode.offsetTop / 10) - top) / step);
                    buttonMin.innerHTML = "\u2191";
                    //if a maximized window is minimized
                    if (buttonMax.innerHTML === "\u2191") {
                        if (pd.test.agent.indexOf("macintosh") > 0) {
                            pd.data.settings[id].top    = box.offsetTop;
                            pd.data.settings[id].left   = box.offsetLeft;
                            pd.data.settings[id].height = body.clientHeight - 17;
                            pd.data.settings[id].width  = body.clientWidth - 17;
                        } else {
                            pd.data.settings[id].top    = box.offsetTop;
                            pd.data.settings[id].left   = box.offsetLeft;
                            pd.data.settings[id].height = body.clientHeight;
                            pd.data.settings[id].width  = body.clientWidth;
                        }
                        if (pd.data.zIndex > 2) {
                            pd.data.zIndex      = pd.data.zIndex - 3;
                            parent.style.zIndex = pd.data.zIndex;
                        }
                    } else {
                        buttonMax.innerHTML         = "\u2191";
                        pd.data.settings[id].top    = pd.data.settings[id].top + 1;
                        pd.data.settings[id].left   = pd.data.settings[id].left - 7;
                        pd.data.settings[id].height = pd.data.settings[id].height + 35.5;
                        pd.data.settings[id].width  = pd.data.settings[id].width + 3;
                    }
                    parent.style.display = "none";
                    shrink();
                    return false;
                };
            if (node.parentNode.nodeName.toLowerCase() === "h3") {
                heading = <HTMLElement>node.parentNode;
                box     = <HTMLElement>heading.parentNode;
                parent  = box.getElementsByTagName("p")[0];
            } else {
                parent  = (node.parentNode.nodeName.toLowerCase() === "a")
                    ? <HTMLElement>node.parentNode.parentNode
                    : <HTMLElement>node.parentNode;
                box     = <HTMLElement>parent.parentNode;
                heading = box.getElementsByTagName("h3")[0];
            }
            id                      = box.getAttribute("id");
            body                    = box.getElementsByTagName("div")[0];
            buttons                 = parent.getElementsByTagName("button");
            save                    = (parent.innerHTML.indexOf("save") > -1);
            buttonMin               = (save === true)
                ? buttons[1]
                : buttons[0];
            buttonMax               = (save === true)
                ? buttons[2]
                : buttons[1];
            left                    = (box.offsetLeft / 10 > 1)
                ? box.offsetLeft / 10
                : 1;
            top                     = (box.offsetTop / 10 > 1)
                ? box.offsetTop / 10
                : 1;
            buttonRes               = (save === true)
                ? buttons[3]
                : buttons[2];
            buttonRes.style.display = "block";
            if (box === pd.data.node.report.feed.box) {
                if (pd.test.filled.feed === true) {
                    step = 1;
                }
                final = 38.8;
            }
            if (box === pd.data.node.report.code.box) {
                if (pd.test.filled.code === true) {
                    step = 1;
                }
                final = 19.8;
            }
            if (box === pd.data.node.report.stat.box) {
                if (pd.test.filled.stat === true) {
                    step = 1;
                }
                final = 0.8;
            }
            if (typeof e.preventDefault === "function") {
                e.preventDefault();
            }
            if (buttonMin.innerHTML === "\u035f") {
                shrinkage();
            } else {
                growth();
            }
            return false;
        },
        //toggles between modes
        modeToggle   : function dom_event_modeToggle(mode:string):void {
            const cycleOptions = function dom_event_modeToggle_cycleOptions():void {
                    const li:HTMLLIElement[] = pd.id("addOptions").getElementsByTagName("li"),
                        lilen:number = li.length;
                    let a:number = 0,
                        div:HTMLDivElement,
                        modeat:string;
                    do {
                        if (li[a].getAttribute("data-mode") !== "any") {
                            div = li[a].getElementsByTagName("div")[0];
                            modeat = li[a].getAttribute("data-mode");
                            if (modeat !== mode && mode !== "diff") {
                                div.innerHTML = `This option is not available in mode '${mode}'.`;
                                div.style.display = "block";
                            } else if (mode === "diff" && modeat !== "diff" && modeat !== "beautify") {
                                div.innerHTML = `This option is not available in mode '${mode}'.`;
                                div.style.display = "block";
                            } else {
                                div.style.display = "none";
                            }
                        }
                        a = a + 1;
                    } while (a < lilen);
                },
                makeChanges = function dom_event_modeToggle_makeChanges():void {
                    const text:string = mode.charAt(0).toUpperCase() + mode.slice(1),
                        ci:HTMLElement = pd.id("codeInput"),
                        cilabel:NodeListOf<HTMLLabelElement> = ci.getElementsByTagName("label"),
                        output:HTMLElement = pd.id("output"),
                        outLabel:HTMLElement = <HTMLElement>ci.getElementsByClassName("inputLabel")[1],
                        sourceLabel:HTMLElement = pd.id("inputlabel").parentNode,
                        outputLabel:HTMLElement = pd.id("outputlabel").parentNode,
                        outputFile:HTMLElement = pd.id("outputfile").parentNode;
                    if (mode === "diff") {
                        ci.getElementsByTagName("h2")[0].innerHTML = "Compare Code";
                        cilabel[0].innerHTML = "Base File";
                        cilabel[2].innerHTML = "Compare code sample";
                        cilabel[5].innerHTML = " Compare new code"
                        outLabel.style.marginTop = "0";
                        sourceLabel.style.display = "block";
                        outputLabel.style.display = "block";
                        outputFile.style.display = "block";
                        if (pd.test.ace === true) {
                            pd
                                .ace
                                .codeOut
                                .setReadOnly(false);
                            parent = <HTMLElement>output.parentNode;
                            parent.setAttribute("class", "output");
                        } else {
                            output.getElementsByTagName("textarea")[0].readOnly = false;
                            parent = <HTMLElement>output.parentNode.parentNode;
                            parent.setAttribute("class", "output");
                        }
                    } else {
                        ci.getElementsByTagName("h2")[0].innerHTML = text;
                        cilabel[0].innerHTML = `${text} file`;
                        cilabel[2].innerHTML = `${text} code sample`;
                        cilabel[5].innerHTML = `${text} output`;
                        outLabel.style.marginTop = "3.6em";
                        sourceLabel.style.display = "none";
                        outputLabel.style.display = "none";
                        outputFile.style.display = "none";
                        if (pd.test.ace === true) {
                            pd
                                .ace
                                .codeOut
                                .setReadOnly(true);
                            parent = <HTMLElement>output.parentNode;
                            parent.setAttribute("class", "readonly");
                        } else {
                            output.getElementsByTagName("textarea")[0].readOnly = false;
                            parent = <HTMLElement>output.parentNode.parentNode;
                            parent.setAttribute("class", "readonly");
                        }
                    }
                };
            let parent:HTMLElement;
            if (mode === "analysis") {
                pd.data.mode = "anal";
            }
            if (mode === "beautify") {
                pd.data.mode = "beau";
            }
            if (mode === "diff") {
                pd.data.mode = "diff";
            }
            if (mode === "minify") {
                pd.data.mode = "minn";
            }
            if (mode === "parse") {
                pd.data.mode = "pars";
            }
            makeChanges();
            cycleOptions();
        },
        //reset tool to default configuration
        reset        : function dom_event_reset():void {
            let nametry:string = "",
                name:string    = "";
            localStorage.codeIn  = "";
            localStorage.codeOut  = "";
            localStorage.commentString = "[]";
            if (pd.data.settings === undefined || pd.data.settings.knownname === undefined) {
                if (pd.data.settings === undefined) {
                    pd.data.settings = {
                        feedback: {
                            newb   : false,
                            veteran: false
                        }
                    };
                }
                if (localStorage.settings !== undefined) {
                    nametry = JSON.stringify(localStorage.settings);
                }
                if (localStorage.settings === undefined || nametry === "" || nametry.indexOf("knownname") < 0) {
                    name = "\"" + Math
                        .random()
                        .toString()
                        .slice(2) + Math
                        .random()
                        .toString()
                        .slice(2) + "\"";
                }
                pd.data.settings.knownname = name;
            }
            if (pd.data.settings.feedback === undefined) {
                pd.data.settings.feedback = {
                    newb   : false,
                    veteran: false
                };
            }
            localStorage.settings = "{\"feedback\":{\"newb\":" + pd.data.settings.feedback.newb + ",\"veteran\":" + pd.data.settings.feedback.veteran + "},\"codereport\":{},\"statreport\":{},\"knownname\":" + pd.data.settings.knownname + "}";
            pd.data.commentString = [];
            if (pd.data.node.comment !== null) {
                pd.data.node.comment.innerHTML = "/*prettydiff.com \u002a/";
            }
            pd.data.node.modeDiff.checked = true;
            location.reload();
        },
        //resize report window to custom width and height on drag
        resize       : function dom_event_resize(e:MouseEvent, x:HTMLElement):void {
            let bodyWidth:number  = 0,
                bodyHeight:number = 0;
            const parent:HTMLElement     = <HTMLElement>x.parentNode,
                save:boolean       = (parent.innerHTML.indexOf("save") > -1),
                box:HTMLElement        = <HTMLElement>parent.parentNode,
                body:HTMLDivElement       = box.getElementsByTagName("div")[0],
                offX:number = e.clientX,
                offY:number = e.clientY,
                heading:HTMLHeadingElement    = box.getElementsByTagName("h3")[0],
                mac:boolean        = (pd.test.agent.indexOf("macintosh") > 0),
                offsetw:number    = (mac === true)
                    ? 20
                    : 4,
                offseth:number    = (mac === true)
                    ? 54
                    : 36,
                drop       = function dom_event_resize_drop():void {
                    document.onmousemove = null;
                    bodyWidth            = body.clientWidth;
                    bodyHeight           = body.clientHeight;
                    pd
                        .app
                        .options(box);
                    document.onmouseup = null;
                },
                boxsize    = function dom_event_resize_boxsize(f:MouseEvent):void {
                    body.style.width = ((bodyWidth + ((f.clientX - offsetw) - offX)) / 10) + "em";
                    if (save === true) {
                        heading.style.width = (((bodyWidth + (f.clientX - offX)) / 10) - 10.15) + "em";
                    } else {
                        heading.style.width = (((bodyWidth + (f.clientX - offX)) / 10) - 7.15) + "em";
                    }
                    body.style.height  = ((bodyHeight + ((f.clientY - offseth) - offY)) / 10) + "em";
                    document.onmouseup = drop;
                };
            bodyWidth  = body.clientWidth,
            bodyHeight = body.clientHeight
            pd
                .app
                .zTop(box);
            document.onmousemove = boxsize;
            document.onmousedown = null;
        },
        //toggle between parsed html diff report and raw text representation
        save         : function dom_event_save(x:HTMLElement):boolean {
            const anchor:boolean     = (x.nodeName.toLowerCase() === "a"),
                top:HTMLElement        = (x.parentNode.parentNode.nodeName.toLowerCase() === "p")
                    ? <HTMLElement>x.parentNode.parentNode.parentNode
                    : <HTMLElement>x.parentNode.parentNode,
                button:HTMLElement     = (anchor === true)
                    ? x.getElementsByTagName("button")[0]
                    : x,
                body:HTMLElement       = top.getElementsByTagName("div")[0],
                bodyInner:string  = body
                    .innerHTML
                    .replace(/\u0020xmlns=("|')http:\/\/www\.w3\.org\/1999\/xhtml("|')/g, ""),
                ro:HTMLInputElement         = pd.id("savepref-report"),
                reportonly:boolean = (ro !== null && ro.checked === true);
            let pageHeight = 0,
                content:NodeListOf<HTMLElement>,
                span:HTMLElement       = pd.id("inline"),
                lastChild:HTMLElement;
            if (bodyInner === "") {
                return;
            }
            if (reportonly === true && anchor === true) {
                x.removeAttribute("href");
            }

            // added support for Firefox and Opera because they support long URIs.  This
            // extra support allows for local file creation.
            if (anchor === true && button.innerHTML === "S") {
                if (bodyInner === "" || ((/Please\u0020try\u0020using\u0020the\u0020option\u0020labeled\u0020((&lt;)|<)em((&gt;)|>)Plain\u0020Text\u0020\(diff\u0020only\)((&lt;)|<)\/em((&gt;)|>)\./).test(bodyInner) === true && (/div\u0020class=("|')diff("|')/).test(bodyInner) === false)) {
                    return false;
                }
                if (reportonly === true) {
                    x.setAttribute("href", "data:text/prettydiff;charset=utf-8," + encodeURIComponent(bodyInner));
                } else {
                    x.setAttribute("href", "data:text/prettydiff;charset=utf-8," + encodeURIComponent(prettydiff.finalFile.order.join("")));
                }
                x.onclick = function dom_event_save_rebind() {
                    pd
                        .event
                        .save(x);
                };

                // prompt to save file created above.  below is the creation of the modal with
                // instructions about file extension.
                lastChild = pd.data.node.page.lastChild;
                if (lastChild.nodeType > 1 || lastChild.nodeName.toLowerCase() === "script") {
                    do {
                        lastChild = <HTMLElement>lastChild.previousSibling;
                    } while (lastChild.nodeType > 1 || lastChild.nodeName.toLowerCase() === "script");
                }
                pageHeight = lastChild.offsetTop + lastChild.clientHeight + 20;
                lastChild  = document.createElement("div");
                lastChild.onmousedown = function dom_event_save_remove() {
                    lastChild.parentNode.removeChild(lastChild);
                };
                lastChild.setAttribute("id", "modalSave");
                span              = document.createElement("span");
                span.style.width  = (pd.data.node.page.clientWidth + 10) + "px";
                span.style.height = pageHeight + "px";
                lastChild.appendChild(span);
                span           = document.createElement("p");
                span.innerHTML = "Just rename the file extension from '<strong>.part</strong>' to '<strong>.xhtml<" +
                                     "/strong>'. <em>Click anywhere to close this reminder.</em>";
                lastChild.appendChild(span);
                pd
                    .data
                    .node
                    .page
                    .appendChild(lastChild);
                span.style.left = (((pd.data.node.page.clientWidth + 10) - span.clientWidth) / 2) + "px";
                return false;
            }
            // Webkit and IE get the old functionality of a textarea with HTML text content
            // to copy and paste into a text file.
            pd
                .app
                .zTop(top);
            prettydiff.finalFile.order[7] = pd.data.color;
            if (pd.data.mode === "diff") {
                prettydiff.finalFile.order[12] = prettydiff.finalFile.script.diff;
            } else if (pd.data.mode === "beau" && pd.data.langvalue[0] === "javascript" && ((pd.id("jsscope-yes") !== null && pd.id("jsscope-yes").checked === true) || (pd.id("jsscope-html") !== null && pd.id("jsscope-html").checked === true))) {
                prettydiff.finalFile.order[12] = prettydiff.finalFile.script.beautify;
            } else {
                prettydiff.finalFile.order[12] = prettydiff.finalFile.script.minimal;
            }
            if (button.innerHTML === "S") {
                if (pd.data.mode === "diff") {
                    pd.data.node.save.checked = true;
                }
                button.innerHTML = "H";
                button.setAttribute("title", "Convert output to rendered HTML.");
                body.innerHTML = "<textarea rows='40' cols='80'>" + pd
                    .data
                    .html
                    .join("")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;") + "</textarea>";
                return false;
            }
            if (pd.data.mode === "diff") {
                pd.data.node.save.checked = false;
            }
            button.innerHTML = "S";
            button.setAttribute("title", "Convert report to text that can be saved.");
            body.innerHTML = prettydiff.finalFile.order[10];
            content        = body.getElementsByTagName("ol");
            if (content.length > 0) {
                if (pd.data.mode === "diff") {
                    content[2].onmousedown  = function dom_event_save_mousedown() {
                        pd.event.colSliderGrab(content[2].onmousedown, content[2]);
                    };
                    content[2].ontouchstart = function dom_event_save_touchstart() {
                        pd.event.colSliderGrab(content[2].ontouchstart, content[2]);
                    };
                }
                content = content[0].getElementsByTagName("li");
                pageHeight = content.length - 1;
                do {
                    if (content[pageHeight].getAttribute("class") === "fold") {
                        if (pd.data.mode === "beau") {
                            content[pageHeight].onclick = pd.event.beaufold;
                        } else if (pd.data.mode === "diff") {
                            content[pageHeight].onclick = function dom_event_save_difffold() {
                                pd.event.difffold(content[pageHeight]);
                            }
                        }
                    }
                    pageHeight = pageHeight - 1;
                } while (pageHeight > -1);
            }
            pd
                .app
                .options(x.parentNode);
            return false;
        },
        //analyzes combinations of consecutive key presses
        sequence     : function dom_event_sequence(event:KeyboardEvent):void {
            const seq   = pd.test.keysequence,
                len   = seq.length,
                key   = event.keyCode;
            if (len === 0 || len === 1) {
                if (key === 38) {
                    pd
                        .test
                        .keysequence
                        .push(true);
                } else {
                    pd.test.keysequence = [];
                }
            } else if (len === 2 || len === 3) {
                if (key === 40) {
                    pd
                        .test
                        .keysequence
                        .push(true);
                } else {
                    pd.test.keysequence = [];
                }
            } else if (len === 4 || len === 6) {
                if (key === 37) {
                    pd
                        .test
                        .keysequence
                        .push(true);
                } else {
                    pd.test.keysequence = [];
                }
            } else if (len === 5 || len === 7) {
                if (key === 39) {
                    pd
                        .test
                        .keysequence
                        .push(true);
                } else {
                    pd.test.keysequence = [];
                }
            } else if (len === 8) {
                if (key === 66) {
                    pd
                        .test
                        .keysequence
                        .push(true);
                } else {
                    pd.test.keysequence = [];
                }
            } else if (len === 9) {
                if (key === 65) {
                    if (pd.data.audio !== undefined) {
                        pd
                            .data
                            .audio
                            .play();
                    }
                    const active:HTMLElement = <HTMLElement>document.activeElement,
                        color:HTMLSelectElement  = pd.id("option-color"),
                        max:number    = color
                            .getElementsByTagName("option")
                            .length - 1,
                        change = function dom_event_sequence_colorChange_change():void {
                            color.selectedIndex = ind;
                            pd
                                .event
                                .colorScheme();
                            if (active === document.documentElement || active === null || active === document.getElementsByTagName("body")[0]) {
                                color.blur();
                            } else {
                                active.focus();
                            }
                        };
                    let ind:number    = color.selectedIndex;
                    ind = ind - 1;
                    if (ind < 0) {
                        ind = max;
                    }
                    change();
                    ind = ind + 1;
                    if (ind > max) {
                        ind = 0;
                    }
                    setTimeout(change, 1500);
                }
                pd.test.keysequence = [];
            }
        }
    };

    // recycle bundles arguments in preparation for executing prettydiff references
    // events: beaufold, colSliderGrab, difffold, minimize, save
    pd.event.recycle    = function dom_event_recycle(event:KeyboardEvent):boolean {
        let output:string = "",
            lang:[string, string, string],
            errortext:string   = "",
            requests:boolean    = false,
            requestd:boolean    = false,
            completed:boolean   = false,
            autotest:boolean    = false,
            node:HTMLInputElement        = pd.id("jsscope-html"),
            codesize:number = 0;
        const domain:RegExp      = (/^((https?:\/\/)|(file:\/\/\/))/),
            lf:HTMLInputElement        = pd.id("lterminator-crlf"),
            textout:boolean     = ((pd.data.node.jsscope === null || pd.data.node.jsscope.checked === false) && (node === null || node.checked === false)),
            execOutput  = function dom_event_recycle_execOutput():void {
                let diffList:NodeListOf<HTMLOListElement>,
                    button:HTMLButtonElement,
                    buttons:NodeListOf<HTMLButtonElement>,
                    pdlang:string     = "",
                    parent:HTMLElement,
                    chromeSave:boolean = false,
                    size:number = 0;
                const commanumb  = function dom_event_recycle_execOutput_commanumb(numb):string {
                        let str:string = "",
                            len:number = 0,
                            arr:string[] = [];
                        if (typeof numb !== "number" || isNaN(numb) === true) {
                            return numb;
                        }
                        str = String(numb);
                        if (str.length < 4) {
                            return str;
                        }
                        arr = str.split("");
                        len = str.length - 4
                        do {
                            arr[len] = arr[len] + ",";
                            len = len - 3;
                        } while (len > -1);
                        return arr.join("");
                    };
                if (pd.options.newline === true) {
                    output = output.replace(/(\s+)$/, "\r\n");
                } else {
                    output = output.replace(/(\s+)$/, "");
                }
                node = pd.id("showOptionsCallOut");
                pd.data.zIndex = pd.data.zIndex + 1;
                if (autotest === true) {
                    pd.options.lang = "auto";
                }
                button           = pd
                    .data
                    .node
                    .report
                    .code
                    .box
                    .getElementsByTagName("p")[0]
                    .getElementsByTagName("button")[0];
                if (button.getAttribute("class") === "save" && button.innerHTML === "H") {
                    chromeSave       = true;
                    button.innerHTML = "S";
                }
                if (pd.options.mode === "parse" || (pd.options.lang === "csv" && pd.data.mode !== "diff")) {
                    pdlang = JSON.stringify(output);
                    if (pdlang.length > 125000) {
                        pd.test.filled.code = true;
                    } else {
                        pd.test.filled.code = false;
                    }
                    if (pd.data.node.report.code.box !== null) {
                        if (pd.options.lang === "csv") {
                            let a:number       = 0,
                                b:number       = output.length,
                                c:number       = 0,
                                d:number       = 0,
                                cells:number   = 0,
                                heading:boolean = false,
                                tr:HTMLElement,
                                table:HTMLElement,
                                td:HTMLElement,
                                body:HTMLElement,
                                div:HTMLElement;
                            do {
                                if (output[a].length > cells) {
                                    cells = output[a].length;
                                }
                                a = a + 1;
                            } while (a < b);
                            if (b > 5) {
                                c = output[0].length;
                                a = 0;
                                do {
                                    if (isNaN(Number(output[0][a])) === false || (output[0][a].length < 4 && output[0][a].length < output[1][a].length && output[0][a].length < output[2][a].length)) {
                                        break;
                                    }
                                    a = a + 1;
                                } while (a < c);
                                if (a === c) {
                                    a = 0;
                                    do {
                                        if (output[1][a] !== undefined && (isNaN(Number(output[1][a].charAt(0))) === false || output[1][a].length < 4)) {
                                            break;
                                        }
                                        a = a + 1;
                                    } while (a < c);
                                    if (a < c) {
                                        do {
                                            if (output[2][d] !== undefined && (isNaN(Number(output[2][d].charAt(0))) === false || output[2][d].length < 4)) {
                                                if (d === a) {
                                                    heading = true;
                                                }
                                                break;
                                            }
                                            d = d + 1;
                                        } while (d < c);
                                    }
                                }
                            }
                            div   = document.createElement("div");
                            table = document.createElement("table");
                            div.setAttribute("class", "doc");
                            table.setAttribute("class", "analysis");
                            table.setAttribute("summary", "CSV data");
                            a = 0;
                            if (heading === true) {
                                a            = 1;
                                body         = document.createElement("thead");
                                tr           = document.createElement("tr");
                                td           = document.createElement("th");
                                td.innerHTML = "Index";
                                tr.appendChild(td);
                                c = 0;
                                do {
                                    td = document.createElement("th");
                                    if (output[0][c] !== undefined) {
                                        td.innerHTML = output[0][c];
                                    }
                                    tr.appendChild(td);
                                    c = c + 1;
                                } while (c < cells);
                                body.appendChild(tr);
                                table.appendChild(body);
                            }
                            body = document.createElement("tbody");
                            do {
                                tr = document.createElement("tr");
                                td = document.createElement("td");
                                if (a === 0) {
                                    td.innerHTML = "Index";
                                } else {
                                    td.innerHTML = String(a);
                                }
                                tr.appendChild(td);
                                c = 0;
                                do {
                                    td = document.createElement("td");
                                    if (output[a][c] !== undefined) {
                                        td.innerHTML = output[a][c];
                                    }
                                    tr.appendChild(td);
                                    c = c + 1;
                                } while (c < cells);
                                body.appendChild(tr);
                                a = a + 1;
                            } while (a < b);
                            table.appendChild(body);
                            div.appendChild(table);
                            pd
                                .data
                                .node
                                .report
                                .code
                                .body
                                .appendChild(div);
                            if (pd.data.mode === "beau") {
                                pd.data.stat.beau = pd.data.stat.beau + 1;
                                node              = pd.id("stbeau");
                                if (node !== null) {
                                    node.innerHTML = pd.data.stat.beau;
                                }
                            } else if (pd.data.mode === "minn") {
                                pd.data.stat.minn = pd.data.stat.minn + 1;
                                node              = pd.id("stminn");
                                if (node !== null) {
                                    node.innerHTML = pd.data.stat.minn;
                                }
                            } else if (pd.data.mode === "pars") {
                                pd.data.stat.pars = pd.data.stat.pars + 1;
                                node              = pd.id("stpars");
                                if (node !== null) {
                                    node.innerHTML = pd.data.stat.pars;
                                }
                            }
                        } else if (pd.options.mode === "parse") {
                            let table:string[] = [],
                                build:string = "",
                                render:HTMLInputElement = pd.id("parsehtml-yes");
                            if (pd.options.parseFormat !== "htmltable" || render === null || (pd.options.parseFormat === "htmltable" && render.checked === false)) {
                                if (pd.data.node.codeParsOut !== null && pd.options.lang !== "csv") {
                                    build = JSON.stringify(JSON.parse(output).data);
                                    if (pd.options.parseFormat === "htmltable") {
                                        build = build.slice(1, build.length - 1).replace(/\\"/g, "\"");
                                    }
                                    if (pd.test.ace === true) {
                                        pd
                                            .ace
                                            .parsOut
                                            .setValue(build);
                                        pd
                                            .ace
                                            .parsOut
                                            .clearSelection();
                                    } else {
                                        pd.data.node.codeParsOut.value = build;
                                    }
                                }
                                return;
                            }
                            if (pd.data.node.report.code.box !== null) {
                                table.push("<div class='report'><h4>Parsed Output</h4>");
                                table.push(JSON.parse(output).data);
                                table.push("</div>");
                                build = table.join("");
                                if (build.length > 75000) {
                                    pd.test.filled.code = true;
                                } else {
                                    pd.test.filled.code = false;
                                }
                                if (autotest === true) {
                                    pd.data.node.report.code.body.innerHTML = "<p>Code type is set to <strong>auto</strong>. <span>Presumed language is <em>" + pd.data.langvalue[2] + "</em>.</span></p>" + build;
                                } else {
                                    pd.data.node.report.code.body.innerHTML = build;
                                }
                                if (pd.data.node.report.code.body.style.display === "none") {
                                    pd.data.node.report.code.box.getElementsByTagName("h3")[0].click();
                                }
                                pd.data.node.report.code.box.style.top   = (pd.data.settings.codereport.top / 10) + "em";
                                pd.data.node.report.code.box.style.right = "auto";
                            }
                            pd.data.stat.pars = pd.data.stat.pars + 1;
                            node              = pd.id("stpars");
                            if (node !== null) {
                                node.innerHTML = pd.data.stat.pars;
                            }
                        }
                    } else if (pd.data.node.codeParsOut !== null && pd.options.lang !== "csv") {
                        if (pd.test.ace === true) {
                            pd
                                .ace
                                .parsOut
                                .setValue(pdlang);
                            pd
                                .ace
                                .parsOut
                                .clearSelection();
                        } else {
                            pd.data.node.codeParsOut.value = pdlang;
                        }
                    }
                } else if (pd.options.mode === "beautify") {
                    prettydiff.finalFile.order[11] = prettydiff.finalFile.script.beautify;
                    if (pd.data.node.codeOut !== null && pd.options.jsscope !== "report") {
                        if (pd.test.ace === true) {
                            pd
                                .ace
                                .beauOut
                                .setValue(output);
                            pd
                                .ace
                                .beauOut
                                .clearSelection();
                        } else {
                            pd.data.node.codeOut.value = output;
                        }
                    }
                    if (pd.data.node.report.code.box !== null) {
                        if (pd.options.jsscope === "report" && pd.data.langvalue[1] === "javascript" && output.indexOf("Error:") !== 0) {
                            pd.data.node.report.code.body.innerHTML = output;
                            if (pd.data.node.report.code.body.style.display === "none") {
                                pd.data.node.report.code.box.getElementsByTagName("h3")[0].click();
                            }
                            pd.data.node.report.code.box.style.top   = (pd.data.settings.codereport.top / 10) + "em";
                            pd.data.node.report.code.box.style.right = "auto";
                            diffList                                 = pd
                                .data
                                .node
                                .report
                                .code
                                .body
                                .getElementsByTagName("ol");
                            if (diffList.length > 0) {
                                const list:NodeListOf<HTMLLIElement> = diffList[0].getElementsByTagName("li");
                                let a:number    = 0,
                                    b:number    = list.length;
                                do {
                                    if (list[a].getAttribute("class") === "fold") {
                                        list[a].onclick = function dom_event_recycle_execOutput_beaufold() {
                                            pd.event.beaufold(list[a]);
                                        }
                                    }
                                    a = a + 1;
                                } while (a < b);
                            }
                        }
                    }
                    pd.data.stat.beau = pd.data.stat.beau + 1;
                    node              = pd.id("stbeau");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.beau;
                    }
                } else if (pd.options.mode === "diff" && pd.data.node.report.code.box !== null) {
                    buttons          = pd
                        .data
                        .node
                        .report
                        .code
                        .box
                        .getElementsByTagName("p")[0]
                        .getElementsByTagName("button");
                    prettydiff.finalFile.order[11] = prettydiff.finalFile.script.diff;
                    if (output.length > 0 && output.length > 125000) {
                        pd.test.filled.code = true;
                    } else {
                        pd.test.filled.code = false;
                    }
                    pd.data.node.report.code.body.innerHTML = "<p>Code type is set to <strong>auto</strong>. Presumed language is <em>" + pd.data.langvalue[2] + "</em>.</p><p><strong>Execution time:</strong> <em>" + meta.time + "</em></p>" + output;
                    if (autotest === true && pd.data.node.report.code.body.firstChild !== null) {
                        if (pd.data.node.report.code.body.firstChild.nodeType > 1) {
                            pd
                                .data
                                .node
                                .report
                                .code
                                .body
                                .removeChild(pd.data.node.report.code.body.firstChild);
                        }
                    }
                    if (pd.data.node.report.code.body.innerHTML.toLowerCase().indexOf("<textarea") === -1) {
                        diffList = pd
                            .data
                            .node
                            .report
                            .code
                            .body
                            .getElementsByTagName("ol");
                        if (diffList.length > 0) {
                            const cells:NodeListOf<HTMLLIElement> = diffList[0].getElementsByTagName("li"),
                                len:number   = cells.length;
                            let a:number     = 0;
                            do {
                                if (cells[a].getAttribute("class") === "fold") {
                                    cells[a].onclick = function dom_event_recycle_execOutput_() {
                                        pd.event.difffold(cells[a]);
                                    }
                                }
                                a = a + 1;
                            } while (a < len);
                        }
                        if (pd.options.diffview === "sidebyside" && diffList.length > 2) {
                            diffList[2].onmousedown  = function dom_event_save_mousedown() {
                                pd.event.colSliderGrab(diffList[2].onmousedown, diffList[2]);
                            };
                            diffList[2].ontouchstart = function dom_event_save_touchstart() {
                                pd.event.colSliderGrab(diffList[2].ontouchstart, diffList[2]);
                            };
                        }
                    }
                    pd.data.stat.diff = pd.data.stat.diff + 1;
                    node              = pd.id("stdiff");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.diff;
                    }
                } else if (pd.options.mode === "minify") {
                    if (output.length > 125000) {
                        pd.test.filled.code = true;
                    } else {
                        pd.test.filled.code = false;
                    }
                    if (pd.data.node.codeMinnOut !== null) {
                        if (pd.test.ace === true) {
                            pd
                                .ace
                                .minnOut
                                .setValue(output);
                            pd
                                .ace
                                .minnOut
                                .clearSelection();
                        } else {
                            pd.data.node.codeMinnOut.value = output;
                        }
                    }
                    pd.data.stat.minn = pd.data.stat.minn + 1;
                    node              = pd.id("stminn");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.minn;
                    }
                } else if (pd.options.mode === "analysis") {
                    if (output.length > 125000) {
                        pd.test.filled.code = true;
                    } else {
                        pd.test.filled.code = false;
                    }
                    if (pd.id("analysishtml-yes") !== null && pd.id("analysishtml-yes").checked === true && pd.data.node.report.code.box !== null) {
                        if (autotest === true) {
                            pd.data.node.report.code.body.innerHTML = "<p>Code type is set to <strong>auto</strong>. <span>Presumed language is <em>" + pd.data.langvalue[2] + "</em>.</span></p>" + output;
                        } else {
                            pd.data.node.report.code.body.innerHTML = output;
                        }
                        if (pd.data.node.report.code.body.style.display === "none") {
                            pd.data.node.report.code.box.getElementsByTagName("h3")[0].click();
                        }
                        pd.data.node.report.code.box.style.top   = (pd.data.settings.codereport.top / 10) + "em";
                        pd.data.node.report.code.box.style.right = "auto";
                    } else if (pd.data.node.codeAnalOut !== null) {
                        if (pd.test.ace === true) {
                            pd
                                .ace
                                .analOut
                                .setValue(output);
                            pd
                                .ace
                                .analOut
                                .clearSelection();
                        } else {
                            pd.data.node.codeAnalOut.value = output.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        }
                    }
                    pd.data.stat.anal = pd.data.stat.anal + 1;
                    node              = pd.id("stanal");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.anal;
                    }
                }
                if (pd.data.node.announce !== null) {
                    if (errortext.indexOf("end tag") > 0 || errortext.indexOf("Duplicate id") > 0) {
                        pd
                            .data
                            .node
                            .announce
                            .setAttribute("class", "error");
                        pd.data.node.announce.innerHTML = errortext;
                    } else if (pd.id("jserror") !== null) {
                        pd
                            .data
                            .node
                            .announce
                            .removeAttribute("class");
                        pd.data.node.announce.innerHTML = "<strong>" + pd
                            .id("jserror")
                            .getElementsByTagName("strong")[0]
                            .innerHTML + "</strong> <span>See 'Code Report' for details</span>";
                    } else {
                        if (meta.lang[0] === "jsx") {
                            pd.data.node.announce.innerHTML = "Presumed language is <strong>React JSX</strong>.";
                        } else if (autotest === true) {
                            pd.data.node.announce.innerHTML = "Code type is set to <em>auto</em>. Presumed language is <strong>" + pd.data.langvalue[2] + "</strong>.";
                        } else {
                            pd.data.node.announce.innerHTML = "Language set to <strong>" + pd.data.langvalue[2] + "</strong>.";
                        }
                        if (pd.options.mode === "parse" && pd.options.parseFormat !== "htmltable") {
                            pdlang = "tokens";
                        } else {
                            pdlang = "characters";
                        }
                        if (meta.error === "" || meta.error === undefined) {
                            pd.data.node.announce.innerHTML = pd.data.node.announce.innerHTML + "<span><em>Execution time:</em> <strong>" + meta.time.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</strong>. <em>Output size:</em> <strong>" + commanumb(meta.outsize) + " " + pdlang + "</strong></span>";
                        } else {
                            pd.data.node.announce.innerHTML = pd.data.node.announce.innerHTML + "<span><strong>" + meta.error.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</strong></span>";
                        }
                    }
                }
                buttons = pd
                    .data
                    .node
                    .report
                    .code
                    .box
                    .getElementsByTagName("p")[0]
                    .getElementsByTagName("button");
                if (chromeSave === true) {
                    pd
                        .event
                        .save(buttons[0]);
                } else if (pd.data.node.save !== null && pd.data.node.save.checked === true) {
                    if (buttons[0].parentNode.nodeName.toLowerCase() === "a") {
                        pd
                            .event
                            .save(buttons[0].parentNode);
                    } else {
                        pd
                            .event
                            .save(buttons[0]);
                    }
                }
                parent = <HTMLElement>buttons[1].parentNode;
                if (parent.style.display === "none" && (pd.data.mode === "diff" || (pd.data.mode === "beau" && pd.options.jsscope === "report" && lang[1] === "javascript"))) {
                    pd
                        .event
                        .minimize(buttons[1].onclick, 1, buttons[1]);
                }
                lang[0] = lang[0].toLowerCase();
                if (pd.data.langvalue[1] === "csv") {
                    pd.data.stat.csv = pd.data.stat.csv + 1;
                    node             = pd.id("stcsv");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.csv;
                    }
                } else if (pd.data.langvalue[1] === "plain text") {
                    pd.data.stat.text = pd.data.stat.text + 1;
                    node              = pd.id("sttext");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.text;
                    }
                } else if (pd.data.langvalue[1] === "javascript") {
                    pd.data.stat.js = pd.data.stat.js + 1;
                    node            = pd.id("stjs");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.js;
                    }
                } else if (pd.data.langvalue[1] === "markup" || pd.data.langvalue[1] === "html" || pd.data.langvalue[1] === "xml" || pd.data.langvalue[1] === "xhtml") {
                    pd.data.stat.markup = pd.data.stat.markup + 1;
                    node                = pd.id("stmarkup");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.markup;
                    }
                } else if (pd.data.langvalue[1] === "css") {
                    pd.data.stat.css = pd.data.stat.css + 1;
                    node             = pd.id("stcss");
                    if (node !== null) {
                        node.innerHTML = pd.data.stat.css;
                    }
                }
                if (pd.options.mode === "diff" && pd.options.source !== undefined && pd.options.diff !== undefined && pd.options.diff.length > pd.options.source.length) {
                    size = pd.options.diff.length;
                } else if (pd.options.source !== undefined) {
                    size = pd.options.source.length;
                }
                if (size > pd.data.stat.large) {
                    pd.data.stat.large = size;
                    const td = pd.id("stlarge");
                    if (td !== null) {
                        td.innerHTML = String(size);
                    }
                }
                localStorage.stat = JSON.stringify(pd.data.stat);
            };

        meta.error = "";
        node = pd.id("showOptionsCallOut");
        if (node !== null) {
            node
                .parentNode
                .removeChild(node);
        }
        if (pd.test.accessibility === true) {
            pd.options.accessibility = true;
        }
        pd.options.crlf = (lf !== null && lf.checked === true);
        if (typeof event === "object" && event !== null && event.type === "keyup") {
            // jsscope does not get the convenience of keypress execution, because its
            // overhead is costly do not execute keypress from alt, home, end, or arrow keys
            if ((textout === false && pd.data.mode === "beau") || event.altKey === true || event.keyCode === 16 || event.keyCode === 18 || event.keyCode === 35 || event.keyCode === 36 || event.keyCode === 37 || event.keyCode === 38 || event.keyCode === 39 || event.keyCode === 40) {
                return false;
            }
            if (pd.test.keypress === true) {
                if (pd.test.keystore.length > 0) {
                    pd
                        .test
                        .keystore
                        .pop();
                    if (event.keyCode === 17 || event.ctrlKey === true || event.keyCode === 224) {
                        pd.test.keypress = false;
                        pd.test.keystore = [];
                    } else {
                        if (pd.test.keystore.length === 0) {
                            pd.test.keypress = false;
                        }
                        return false;
                    }
                }
            }
            if ((event.keyCode === 17 || event.ctrlKey === true || event.keyCode === 224) && pd.test.keypress === true && pd.test.keystore.length === 0) {
                pd.test.keypress = false;
                return false;
            }
        }

        //gather updated dom nodes
        pd.options.api         = "dom";
        node            = pd.id("csvchar");
        pd.options.csvchar     = (node === null || node.value.length === 0)
            ? ","
            : node.value;
        pd.options.lang        = (pd.data.node.lang === null)
            ? "javascript"
            : (pd.data.node.lang.nodeName.toLowerCase() === "select")
                ? pd
                    .data
                    .node
                    .lang[pd.data.node.lang.selectedIndex]
                    .value
                    .toLowerCase()
                : pd
                    .data
                    .node
                    .lang
                    .value
                    .toLowerCase();
        pd.options.langdefault = (pd.data.node.langdefault !== null)
            ? pd.data.node.langdefault[pd.data.node.langdefault.selectedIndex].value
            : "javascript";
        pd.options.newline     = (pd.id("newline-yes") !== null && pd.id("newline-yes").checked === true);
        if (pd.options.lang === "auto") {
            autotest = true;
        }

        //determine options based upon mode of operations
        if (pd.param !== undefined) {
            const keys = Object.keys(pd.param),
                len = keys.length;
            let a = 0;
            do {
                pd.options[keys[a]] = pd.param[keys[a]];
                a = a + 1;
            } while (a < len);
        }
        if (pd.data.mode === "beau") {
            pd.options.mode = "beautify";
        } else if (pd.data.mode === "minn") {
            pd.options.mode = "minify";
        } else if (pd.data.mode === "pars") {
            pd.options.mode = "parse";
        } else if (pd.data.mode === "anal") {
            pd.options.mode = "analysis";
        } else {
            pd.options.mode = "diff";
        }
        if (domain.test(pd.options.source) === true && pd.test.xhr === true) {
            const filetest:boolean       = (pd.options.source.indexOf("file:///") === 0),
                protocolRemove:string = (filetest === true)
                    ? pd.options
                        .source
                        .split(":///")[1]
                    : pd.options
                        .source
                        .split("://")[1],
                slashIndex:number     = (protocolRemove !== undefined)
                    ? protocolRemove.indexOf("/")
                    : 0,
                xhr:XMLHttpRequest            = new XMLHttpRequest();
            if ((slashIndex > 0 || pd.options.source.indexOf("http") === 0) && typeof protocolRemove === "string" && protocolRemove.length > 0) {
                requests = true;
                xhr.onreadystatechange = function dom_event_recycle_xhrSource_statechange() {
                    const appDelay = function dom_event_recycle_xhrSource_statechange_appDelay() {
                        output = prettydiff.app();
                        if (output === undefined) {
                            setTimeout(dom_event_recycle_xhrSource_statechange_appDelay, 100);
                        } else {
                            execOutput();
                        }
                    };
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200 || xhr.status === 0) {
                            pd.options.source = xhr
                                .responseText
                                .replace(/\r\n/g, "\n");
                            if (pd.data.mode !== "diff" || requestd === false || (requestd === true && completed === true)) {
                                pd.data.source = pd.options.source;
                                if (pd.test.ace === true) {
                                    if (pd.data.mode !== "diff") {
                                        lang = pd
                                            .app
                                            .langkey(false, pd.ace[pd.data.mode + "In"], "");
                                    } else if (pd.data.langvalue[1] === "text") {
                                        lang = ["text", "text", "Plain Text"];
                                    } else {
                                        lang = pd
                                            .app
                                            .langkey(false, pd.ace.codeIn, "");
                                    }
                                } else if (pd.data.mode === "diff" && pd.data.langvalue[1] === "text") {
                                    lang = ["text", "text", "Plain Text"];
                                } else {
                                    lang = pd
                                        .app
                                        .langkey(false, {
                                            value: pd.data.source
                                        }, "");
                                }
                                pd.options.lang = lang[0];
                                pd.options.lexer = lang[1];
                                if (pd.data.mode === "diff") {
                                    pd.data.diff = pd.options.diff;
                                } else {
                                    pd.data.diff = "";
                                }
                                output = prettydiff.app();
                                if (output === undefined) {
                                    if (pd.test.delayExecution === true) {
                                        pd.test.delayExecution = false;
                                        setTimeout(appDelay, 2000);
                                    }
                                } else {
                                    execOutput();
                                }
                                return;
                            }
                        } else {
                            pd.options.source = "Error: transmission failure receiving source code from address.";
                        }
                    }
                };
                if (filetest === true) {
                    xhr.open("GET", pd.options.source.replace(/(\s*)$/, "").replace(/%26/g, "&").replace(/%3F/, "?"), true);
                } else {
                    xhr.open("GET", "proxy.php?x=" + pd.options.source.replace(/(\s*)$/, "").replace(/%26/g, "&").replace(/%3F/, "?"), true);
                }
                xhr.send();
            }
        }
        if (pd.data.node.report.stat.box !== null) {
            pd.data.stat.usage  = pd.data.stat.usage + 1;
            pd.data.stat.useday = Math.round(pd.data.stat.usage / ((Date.now() - pd.data.stat.fdate) / 86400000));
            node                = pd.id("stusage");
            if (node !== null) {
                node.innerHTML = pd.data.stat.usage;
            }
            node = pd.id("stuseday");
            if (node !== null) {
                node.innerHTML = pd.data.stat.useday;
            }
        }
        if (pd.options.source === undefined || (pd.data.mode === "diff" && pd.options.diff === undefined)) {
            return;
        }
        if (requests === false && requestd === false) {
            // sometimes the Ace getValue method fires too early on copy/paste.  I put in a
            // 50ms delay in this case to prevent operations from old input

            if (pd.test.ace === true && pd.options.mode !== "diff") {
                pd.options.source     = pd
                    .ace
                    .codeIn
                    .getValue();
                lang       = (pd.data.langvalue[0] !== "plain_text")
                    ? pd
                        .app
                        .langkey(false, pd.ace.codeIn, "")
                    : lang;
                pd.options.lang = lang[0];
                pd.options.lexer = lang[1];
                pd.data.source = pd.options.source;
                pd.data.diff   = "";
                output         = prettydiff.app();
                execOutput();
            } else {
                pd.data.source = pd.options.source;
                if (pd.data.langvalue[1] === "text") {
                    lang = ["text", "text", "Plain Text"];
                } else if (pd.data.langvalue[1] === "csv") {
                    lang = ["csv", "csv", "CSV"];
                } else if (pd.test.ace === true) {
                    lang = pd
                        .app
                        .langkey(false, pd.ace.codeIn, "");
                } else {
                    lang = pd
                        .app
                        .langkey(false, {
                            value: pd.options.source
                        }, "");
                }
                pd.options.lang = lang[0];
                pd.options.lexer = lang[1];
                if (pd.data.mode === "diff") {
                    pd.data.diff = pd.options.diff;
                } else {
                    pd.data.diff = "";
                }
                output = prettydiff.app();
                execOutput();
            }
        }
    };

    // toggles an editor between 100% and 50% width if the output isn't textual
    // references apps: langkey, options references events: recycle
    pd.app.hideOutput   = function dom_app_hideOutput(x:HTMLElement):void {
        let node:HTMLElement,
            parent:HTMLElement,
            state:boolean     = false,
            targetOut:HTMLElement,
            targetIn:HTMLElement;
        const restore   = function dom_app_hideOutput_restore():void {
                parent = <HTMLElement>targetOut.parentNode;
                parent.style.display = "block";
                if (targetOut !== null) {
                    node             = <HTMLElement>targetIn.parentNode;
                    node.style.width = "49%";
                    if (pd.test.ace === true) {
                        pd
                            .ace
                            .codeIn
                            .resize();
                    }
                    targetIn.onkeyup   = pd.event.recycle;
                    targetIn.onkeydown = function dom_app_hideOutput_restore_bindTargetInDown(event:Event):void {
                        if (pd.test.ace === false) {
                            pd
                                .event
                                .fixtabs(event, targetIn);
                        }
                        pd
                            .event
                            .keydown(event);
                        pd
                            .event
                            .recycle(event);
                    };
                }
                if (x === undefined) {
                    return;
                }
                pd
                    .app
                    .options(x);
            },
            langval:string   = (pd.data.node.lang === null)
                ? "javascript"
                : ((pd.data.node.lang.nodeName === "select")
                    ? pd.data.node.lang[pd.data.node.lang.selectedIndex].value
                    : pd.data.node.lang.value);
        if (x.nodeType === 1 && x.nodeName.toLowerCase() !== "input" && x !== pd.data.node.lang) {
            x = x.getElementsByTagName("input")[0];
        }
        state = (x === pd.data.node.jsscope || langval === "csv");
        targetOut = pd.data.node.codeOut;
        targetIn  = pd.data.node.codeIn;
        parent = <HTMLElement>targetOut.parentNode;
        if (targetOut === null || (state === true && parent.style.display === "none") || (state === false && parent.style.display === "block")) {
            if (pd.test.load === false) {
                pd
                    .app
                    .options(x);
            }
            return;
        }
        if (langval !== "csv" && pd.data.mode !== "beau") {
            state = false;
        }
        if (langval === "auto" || langval === "javascript" || langval === "csv") {
            if (state === true) {
                parent.style.display = "none";
                if (targetIn !== null) {
                    node             = <HTMLElement>targetIn.parentNode;
                    node.style.width = "100%";
                    if (pd.test.ace === true) {
                        pd
                            .ace
                            .codeIn
                            .resize();
                    }
                    if (pd.test.ace === true) {
                        targetIn.onkeyup = function dom_app_hideOutput_langkeyEditor(event:Event):void {
                            pd
                                .app
                                .langkey(false, pd.ace.codeIn, "");
                            pd
                                .event
                                .recycle(event);
                        };
                    } else {
                        targetIn.onkeyup = function dom_app_hideOutput_langkeyTextarea(event:Event):void {
                            pd
                                .event
                                .recycle(event);
                        };
                    }
                }
                if (langval === "csv") {
                    x = pd.data.node.lang;
                }
                if (pd.test.load === false) {
                    pd
                        .app
                        .options(x);
                }
            } else if (x === pd.data.node.modeBeau || x === pd.id("jsscope-no")) {
                restore();
            } else {
                pd
                    .app
                    .options(x);
            }
        } else if (x === pd.data.node.modeBeau) {
            restore();
        } else {
            pd
                .app
                .options(x);
        }
    };

    // provides interaction to simulate a text input into a radio buttonset with
    // appropriate accessibility response references app: options
    pd.app.indentchar   = function dom_app_indentchar():void {
        const insize:HTMLInputElement = pd.id("option-insize"),
            inchar:HTMLInputElement = pd.id("option-inchar");
        if (pd.test.ace === true) {
            if (inchar !== null && inchar.value === " ") {
                pd
                    .ace
                    .codeIn
                    .getSession()
                    .setUseSoftTabs(true);
                pd
                    .ace
                    .codeOut
                    .getSession()
                    .setUseSoftTabs(true);
                if (insize !== null && isNaN(Number(insize.value)) === false) {
                    pd
                        .ace
                        .codeIn
                        .getSession()
                        .setTabSize(Number(inchar.value));
                    pd
                        .ace
                        .codeOut
                        .getSession()
                        .setTabSize(Number(inchar.value));
                }
            } else {
                pd
                    .ace
                    .codeIn
                    .getSession()
                    .setUseSoftTabs(false);
                pd
                    .ace
                    .codeOut
                    .getSession()
                    .setUseSoftTabs(false);
            }
        }
        if (pd.test.load === false) {
            pd
                .app
                .options(inchar);
        }
    };

    // provide a means for keyboard users to escape a textarea references events:
    // sequence
    pd.event.areaTabOut = function dom_event_areaTabOut(event:KeyboardEvent, node:HTMLElement):void {
        let len:number   = pd.test.tabesc.length,
            esc:boolean   = false,
            key:number   = 0;
        key  = event.keyCode;
        if (key === 17 || key === 224) {
            if (pd.data.tabtrue === false && (pd.test.tabesc[0] === 17 || pd.test.tabesc[0] === 224 || len > 1)) {
                return;
            }
            pd.data.tabtrue = false;
        }
        if (node.nodeName.toLowerCase() === "textarea") {
            if (pd.test.ace === true) {
                if (node === pd.data.node.codeOut) {
                    esc = true;
                }
            }
            if (node === pd.data.node.codeIn) {
                esc = true;
            }
        }
        if (esc === true) {
            esc             = false;
            pd.data.tabtrue = false;
            if ((len === 1 && pd.test.tabesc[0] !== 16 && key !== pd.test.tabesc[0]) || (len === 2 && key !== pd.test.tabesc[1])) {
                pd.test.tabesc = [];
                return;
            }
            if (len === 0 && (key === 16 || key === 17 || key === 224)) {
                return pd
                    .test
                    .tabesc
                    .push(key);
            }
            if (len === 1 && (key === 17 || key === 224)) {
                if (pd.test.tabesc[0] === 17 || pd.test.tabesc[0] === 224) {
                    esc = true;
                } else {
                    return pd
                        .test
                        .tabesc
                        .push(key);
                }
            } else if (len === 2 && (key === 17 || key === 224)) {
                esc = true;
            } else if (len > 0) {
                pd.test.tabesc = [];
            }
            if (esc === true) {
                if (len === 2) {
                    //back tab

                    if (node === pd.data.node.codeIn) {
                        pd
                            .id("inputfile")
                            .focus();
                    } else if (node === pd.data.node.codeOut) {
                        pd
                            .data
                            .node
                            .codeIn
                            .focus();
                    }
                } else {
                    //forward tab

                    if (node === pd.data.node.codeOut) {
                        pd
                            .id("button-primary")
                            .getElementsByTagName("button")[0]
                            .focus();
                    } else if (node === pd.data.node.codeIn) {
                        pd
                            .data
                            .node
                            .codeOut
                            .focus();
                    }
                }
                if (pd.test.tabesc[0] === 16) {
                    pd.test.tabesc = [16];
                } else {
                    pd.test.tabesc = [];
                }
            }
        }
        pd
            .event
            .sequence(event);
    };

    //read from files if the W3C File API is supported references events: recycle
    pd.event.file       = function dom_event_file(input:HTMLInputElement):void {
        let a:number         = 0,
            id:string        = "",
            files:FileList,
            textarea:HTMLTextAreaElement,
            parent:HTMLElement,
            reader:FileReader,
            fileStore:string[] = [],
            fileCount:number = 0;
        id    = input.getAttribute("id");
        files = input.files;
        if (pd.test.fs === true && files[0] !== null && typeof files[0] === "object") {
            if (input.nodeName === "input") {
                parent = <HTMLElement>input.parentNode.parentNode;
                textarea = parent.getElementsByTagName("textarea")[0];
            }
            const fileLoad  = function dom_event_file_onload(event:Event):void {
                    const tscheat:string = "result";
                    fileStore.push(event.target[tscheat]);
                    if (a === fileCount) {
                        if (pd.test.ace === true) {
                            if (id === "outputfile") {
                                pd
                                    .ace
                                    .codeOut
                                    .setValue(fileStore.join("\n\n"));
                                pd
                                    .ace
                                    .codeOut
                                    .clearSelection();
                            } else {
                                pd
                                    .ace
                                    .codeIn
                                    .setValue(fileStore.join("\n\n"));
                                pd
                                    .ace
                                    .codeIn
                                    .clearSelection();
                            }
                        } else {
                            pd.data.node.codeIn.value = fileStore.join("\n\n");
                        }
                        if (pd.data.mode !== "diff") {
                            pd
                                .event
                                .recycle();
                        }
                    }
                },
                fileError = function dom_event_file_onerror(event:ErrorEvent):void {
                    if (textarea !== undefined) {
                        textarea.value = "Error reading file:\n\nThis is the browser's descriptiong: " + event.error.name;
                    }
                    fileCount   = -1;
                };
            fileCount = files.length;
            do {
                reader         = new FileReader();
                reader.onload  = fileLoad;
                reader.onerror = fileError;
                if (files[a] !== undefined) {
                    reader.readAsText(files[a], "UTF-8");
                }
                a = a + 1;
            } while (a < fileCount);
            if (pd.data.mode !== "diff") {
                pd
                    .event
                    .recycle();
            }
        }
    };

    //callback for filedrop event references events: file
    pd.event.filedrop   = function dom_event_filedrop(event:Event):void {
        event.stopPropagation();
        event.preventDefault();
        pd
            .event
            .file();
    };

    //basic drag and drop for the report windows references events: minimize
    pd.event.grab       = function dom_event_grab(event:Event):boolean {
        const x:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target,
            box:HTMLElement        = (x.nodeName.toLowerCase() === "h3")
                ? <HTMLElement>x.parentNode
                : <HTMLElement>x.parentNode.parentNode,
            parent:HTMLElement     = box.getElementsByTagName("p")[0],
            save:boolean       = (parent.innerHTML.indexOf("save") > -1),
            minifyTest:boolean = (parent.style.display === "none"),
            buttons:NodeListOf<HTMLButtonElement>    = box
                .getElementsByTagName("p")[0]
                .getElementsByTagName("button"),
            minButton:HTMLButtonElement  = (save === true)
                ? buttons[1]
                : buttons[0],
            resize:HTMLButtonElement     = (save === true)
                ? buttons[3]
                : buttons[2],
            touch:boolean      = (event !== null && event.type === "touchstart"),
            mouseEvent = <MouseEvent>event,
            touchEvent = <TouchEvent>event,
            mouseX = (touch === true)
                ? 0
                : mouseEvent.clientX,
            mouseY = (touch === true)
                ? 0
                : mouseEvent.clientY,
            touchX = (touch === true)
                ? touchEvent.touches[0].clientX
                : 0,
            touchY = (touch === true)
                ? touchEvent.touches[0].clientY
                : 0,
            filled:boolean     = ((box === pd.data.node.report.stat.box && pd.test.filled.stat === true) || (box === pd.data.node.report.feed.box && pd.test.filled.feed === true) || (box === pd.data.node.report.code.box && pd.test.filled.code === true)),    
            drop       = function dom_event_grab_drop(e:Event):boolean {
                const headingWidth = box.getElementsByTagName("h3")[0].clientWidth;
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
                resize.style.top   = "100%";
                pd
                    .app
                    .options(box);
                e.preventDefault();
                return false;
            },
            boxmoveTouch    = function dom_event_grab_boxmoveTouch(f:TouchEvent):boolean {
                f.preventDefault();
                box.style.right = "auto";
                box.style.left      = ((boxLeft + (f.touches[0].clientX - touchX)) / 10) + "em";
                box.style.top       = ((boxTop + (f.touches[0].clientY - touchY)) / 10) + "em";
                document.ontouchend = drop;
                return false;
            },
            boxmoveClick = function dom_event_grab_boxmoveClick(f:MouseEvent):boolean {
                f.preventDefault();
                box.style.right = "auto";
                box.style.left     = ((boxLeft + (f.clientX - mouseX)) / 10) + "em";
                box.style.top      = ((boxTop + (f.clientY - mouseY)) / 10) + "em";
                document.onmouseup = drop;
                return false;
            };
        let boxLeft:number    = box.offsetLeft,
            boxTop:number     = box.offsetTop,
            body:HTMLElement       = box.getElementsByTagName("div")[0],
            heading:HTMLElement    = (box.firstChild.nodeType > 1)
                ? <HTMLElement>box.firstChild.nextSibling
                : <HTMLElement>box.firstChild,
            max:number        = document.getElementsByTagName("body")[0].clientHeight;
        if (minifyTest === true) {
            if (filled === true) {
                box.style.right = "auto";
            } else {
                box.style.left = "auto";
            }
            pd
                .event
                .minimize(event, 50, minButton);
            return false;
        }
        pd
            .app
            .zTop(box);
        event.preventDefault();
        if (body.nodeType !== 1) {
            do {
                body = <HTMLElement>body.previousSibling;
            } while (body.nodeType !== 1);
        }
        if (heading.nodeType !== 1) {
            do {
                heading = <HTMLElement>heading.nextSibling;
            } while (heading.nodeType !== 1);
        }
        heading = <HTMLElement>heading.lastChild;
        if (heading.nodeType !== 1) {
            do {
                heading = <HTMLElement>heading.previousSibling;
            } while (heading.nodeType !== 1);
        }
        body.style.opacity = ".5";
        heading.style.top  = (box.clientHeight / 20) + "0em";
        box.style.height   = ".1em";
        resize.style.top   = ((Number(body.style.height.replace("em", "")) + 5.45) / 1.44) + "em";
        if (touch === true) {
            document.ontouchmove  = boxmoveTouch;
            document.ontouchstart = null;
        } else {
            document.onmousemove = boxmoveClick;
            document.onmousedown = null;
        }
        pd
            .app
            .options(box);
        return false;
    };

    if (pd.data.node.page === null || pd.data.node.page === undefined || pd.data.node.page.getAttribute("id") === null) {
        window.onload = loadPrep;
    } else {
        load();
    }
}());
