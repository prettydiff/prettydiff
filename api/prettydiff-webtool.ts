/*global ace*/
/*jshint laxbreak: true*/
/*jslint for: true*/
/*****************************************************************************
 This is written by Austin Cheney on 3 Mar 2009.

 Please see the license.txt file associated with the Pretty Diff
 application for license information.
 ****************************************************************************/
if ((/^http:\/\/((\w|-)+\.)*prettydiff\.com/).test(location.href) === true || location.href.indexOf("www.prettydiff.com") > -1) {
    let loc:string = location.href.replace("http", "https").replace("https://www.", "https://");
    location.replace(loc);
}
(function dom_init():void {
    "use strict";
    const id = function dom_id(x:string):any {
            if (document.getElementById === undefined) {
                return;
            }
            return document.getElementById(x);
        },
        page = (function dom__dataPage():HTMLDivElement {
            const divs:HTMLCollectionOf<HTMLDivElement> = document.getElementsByTagName("div");
            if (divs.length === 0) {
                return null;
            }
            return divs[0];
        }()),
        textarea = {
            codeIn: id("input"),
            codeOut: id("output"),
        },
        aceStore:any = {
            codeIn: {},
            codeOut: {},
            height: 0
        },
        method:domMethods = {
            app: {},
            event: {}
        },
        data:any = {
            commentString: [],
            langvalue: ["javascript", "javascript", "JavaScript"],
            mode: "diff",
            settings: {
                report: {
                    code: {},
                    feed: {},
                    stat: {}
                }
            },
            tabtrue: false,
            zIndex: 0
        },
        report = {
            code: {
                body: null,
                box: id("codereport")
            },
            feed: {
                body: null,
                box: id("feedreport")
            },
            stat: {
                body: null,
                box: id("statreport")
            }
        },
        test = {
            // delect if Ace Code Editor is supported
            ace           : (location.href.toLowerCase().indexOf("ace=false") < 0 && typeof ace === "object"),
            // get the lowercase useragent string
            agent         : (typeof navigator === "object")
                ? navigator
                    .userAgent
                    .toLowerCase()
                : "",
            // test for standard web audio support
            audio         : ((typeof AudioContext === "function" || typeof AudioContext === "object") && AudioContext !== null)
                ? new AudioContext()
                : null,
            // delays the toggling of test.load to false for asynchronous code sources
            delayExecution: false,
            // am I served from the Pretty Diff domain
            domain        : (location.href.indexOf("prettydiff.com") < 15 && location.href.indexOf("prettydiff.com") > -1),
            // If the output is too large the report must open and minimize in a single step
            filled        : {
                code: false,
                feed: false,
                stat: false
            },
            // test for support of the file api
            fs            : (typeof FileReader === "function"),
            // stores keypress state to avoid execution of event.execute from certain key
            // combinations
            keypress      : false,
            keysequence   : [],
            // supplement to ensure keypress is returned to false only after other keys
            // other than ctrl are released
            keystore      : [],
            // some operations should not occur as the page is initially loading
            load          : true,
            // whether to save things locally
            store         : (id("localStorage-no") !== null && id("localStorage-no").checked === true)
                ? false
                : true,
            // supplies alternate keyboard navigation to editable text areas
            tabesc        : []
        },
        load                = function dom_load():void {
            const pages:string            = (page === null || page === undefined || page.getAttribute("id") === null)
                    ? ""
                    : page.getAttribute("id"),
                security = function dom_load_security():void {
                    const scripts:HTMLCollectionOf<HTMLScriptElement> = document.getElementsByTagName("script"),
                        exclusions:string[] = [
                            "js/webtool.js",
                            "browser-demo.js",
                            "node_modules/ace-builds"
                        ],
                        len:number = scripts.length,
                        exlen:number = exclusions.length;
                    let a:number = 0,
                        b:number = 0,
                        src:string = "";
                    // this prevents errors, but it also means you are executing too early.
                    if (len > 0) {
                        do {
                            src = scripts[a].getAttribute("src");
                            if (src === null) {
                                break;
                            }
                            if (src.indexOf("?") > 0) {
                                src = src.slice(0, src.indexOf("?"));
                            }
                            b = 0;
                            do {
                                if (src.indexOf(exclusions[b]) > -1) {
                                    break;
                                }
                                b = b + 1;
                            } while (b < exlen);
                            if (b === exlen) {
                                break;
                            }
                            a = a + 1;
                        } while (a < len);
                        if (a < len) {
                            let warning:HTMLDivElement = document.createElement("div");
                                warning.setAttribute("id", "security-warning");
                                warning.innerHTML = `<h1>Warning</h1><h2>This page contains unauthorized script and may be a security risk.</h2><code>${(src === null) ? scripts[a].innerHTML : src}</code>`;
                                document.getElementsByTagName("body")[0].insertBefore(warning, document.getElementsByTagName("body")[0].firstChild);
                        }
                    }
                };
            if (pages === "webtool") {
                let a:number = 0,
                    x:HTMLInputElement,
                    inputs:HTMLCollectionOf<HTMLInputElement>,
                    selects:HTMLCollectionOf<HTMLSelectElement>,
                    buttons:HTMLCollectionOf<HTMLButtonElement>,
                    inputsLen:number       = 0,
                    idval:string              = "",
                    name:string            = "",
                    type:string            = "",
                    parent:HTMLElement;
                const aceApply = function dom_load_aceApply(nodeName:string, maxWidth:boolean):any {
                        const div:HTMLDivElement        = document.createElement("div"),
                            node:HTMLDivElement       = textarea[nodeName],
                            parent:HTMLElement     = <HTMLElement>node.parentNode.parentNode,
                            labels:HTMLCollectionOf<HTMLLabelElement> = parent.getElementsByTagName("label"),
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
                        textarea[nodeName]          = div.getElementsByTagName("textarea")[0];
                        edit[`${dollar}blockScrolling`] = Infinity;
                        if (nodeName === "codeIn") {
                            const slider:HTMLElement = document.createElement("span"),
                                span:HTMLElement = document.createElement("span"),
                                p:HTMLElement = document.createElement("p"),
                                description:string = "Slide this control left and right to adjust the 'options.wrap' value for word wrapping the code.";
                            p.innerHTML = description;
                            p.setAttribute("id", "ace-slider-description");
                            p.style.display = "none";
                            span.innerHTML = `<button title="${description}" aria-describedby="ace-slider-description">\u25bc</button>`;
                            slider.appendChild(span);
                            slider.appendChild(p);
                            slider.setAttribute("id", "slider");
                            span.onmousedown = method.event.aceSlider;
                            parent.insertBefore(slider, div);
                        }
                        return edit;
                    },
                    aces = function dom_load_aces(event:Event):void {
                        const el:HTMLInputElement = <HTMLInputElement>event.srcElement || <HTMLInputElement>event.target,
                            elId:string   = el.getAttribute("id"),
                            acedisable      = function dom_load_aces_acedisable():void {
                                let addy:string   = "",
                                    loc:number    = location
                                        .href
                                        .indexOf("ace=false"),
                                    place:string[]  = [],
                                    symbol:string = "?";
                                method.app.options(event);
                                if (elId === "ace-yes" && loc > 0) {
                                    place = location
                                        .href
                                        .split("ace=false");
                                    if (place[1].indexOf("&") < 0 && place[1].indexOf("%26") < 0) {
                                        place[0] = place[0].slice(0, place[0].length - 1);
                                    }
                                    location.replace(place.join(""));
                                } else if (elId === "ace-no" && loc < 0) {
                                    addy = location.href;
                                    addy = addy.slice(0, addy.indexOf("#") + 1);
                                    if (location.href.indexOf("?") < location.href.length - 1 && location.href.indexOf("?") > 0) {
                                        symbol = "&";
                                    }
                                    location.replace(`${addy + symbol}ace=false`);
                                }
                            };
                        if (el.checked === true) {
                            acedisable();
                        }
                    },
                    areaShiftUp = function dom_load_areaShiftUp(event:KeyboardEvent):void {
                        if (event.keyCode === 16 && test.tabesc.length > 0) {
                            test.tabesc = [];
                        }
                        if (event.keyCode === 17 || event.keyCode === 224) {
                            data.tabtrue = true;
                        }
                    },
                    areaTabOut = function dom_load_areaTabOut(event:KeyboardEvent):void {
                        const node:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target;
                        let len:number   = test.tabesc.length,
                            esc:boolean   = false,
                            key:number   = 0;
                        key  = event.keyCode;
                        if (key === 17 || key === 224) {
                            if (data.tabtrue === false && (test.tabesc[0] === 17 || test.tabesc[0] === 224 || len > 1)) {
                                return;
                            }
                            data.tabtrue = false;
                        }
                        if (node.nodeName.toLowerCase() === "textarea") {
                            if (test.ace === true) {
                                if (node === textarea.codeOut) {
                                    esc = true;
                                }
                            }
                            if (node === textarea.codeIn) {
                                esc = true;
                            }
                        }
                        if (esc === true) {
                            esc             = false;
                            data.tabtrue = false;
                            if ((len === 1 && test.tabesc[0] !== 16 && key !== test.tabesc[0]) || (len === 2 && key !== test.tabesc[1])) {
                                test.tabesc = [];
                                return;
                            }
                            if (len === 0 && (key === 16 || key === 17 || key === 224)) {
                                test
                                    .tabesc
                                    .push(key);
                                return;
                            }
                            if (len === 1 && (key === 17 || key === 224)) {
                                if (test.tabesc[0] === 17 || test.tabesc[0] === 224) {
                                    esc = true;
                                } else {
                                    test
                                        .tabesc
                                        .push(key);
                                    return;
                                }
                            } else if (len === 2 && (key === 17 || key === 224)) {
                                esc = true;
                            } else if (len > 0) {
                                test.tabesc = [];
                            }
                            if (esc === true) {
                                if (len === 2) {
                                    //back tab
                                    if (node === textarea.codeIn) {
                                        id("inputfile").focus();
                                    } else if (node === textarea.codeOut) {
                                        textarea
                                            .codeIn
                                            .focus();
                                    }
                                } else {
                                    //forward tab
                                    if (node === textarea.codeOut) {
                                        id("button-primary")
                                            .getElementsByTagName("button")[0]
                                            .focus();
                                    } else if (node === textarea.codeIn) {
                                        textarea
                                            .codeOut
                                            .focus();
                                    }
                                }
                                if (test.tabesc[0] === 16) {
                                    test.tabesc = [16];
                                } else {
                                    test.tabesc = [];
                                }
                            }
                        }
                        method
                            .event
                            .sequence(event);
                    },
                    backspace       = function dom_load_backspace(event:KeyboardEvent):boolean {
                        const bb:Element = <Element>event.srcElement || <Element>event.target;
                        if (event.keyCode === 8) {
                            if (bb.nodeName === "textarea" || (bb.nodeName === "input" && (bb.getAttribute("type") === "text" || bb.getAttribute("type") === "password"))) {
                                return true;
                            }
                            return false;
                        }
                        if (event.type === "keydown") {
                            method.event.sequence(event);
                        }
                        return true;
                    },
                    clearComment = function dom_load_clearComment():void {
                        const comment = id("commentString");
                        localStorage.setItem("commentString", "[]");
                        data.commentString      = [];
                        if (comment !== null) {
                            comment.innerHTML = "/*prettydiff.com \u002a/";
                        }
                    },
                    feeds = function dom_load_feeds(el:HTMLInputElement):void {
                        const feedradio       = function dom_load_feeds_feedradio(event:Event):boolean {
                            let parent:HTMLElement,
                                aa:number,
                                radios:HTMLCollectionOf<HTMLInputElement>;
                            const elly:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target,
                                item:HTMLElement   = <HTMLElement>elly.parentNode,
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
                            method.app.options(event);
                            event.preventDefault();
                            return false;
                        };
                        el.onfocus = feedradio;
                        el.onblur  = function dom_load_feeds_feedblur():void {
                            const item = <HTMLElement>el.parentNode;
                            item.setAttribute("class", "active");
                        },
                        el.onclick = feedradio;
                        parent = <HTMLElement>x.parentNode;
                        parent = parent.getElementsByTagName("label")[0];
                        parent.onclick = feedradio;
                    },
                    feedsubmit = function dom_load_feedsubmit():void {
                        let a:number = 0;
                        const datapack:any  = {},
                            namecheck:any = (localStorage.getItem("settings") !== undefined && localStorage.getItem("settings") !== null)
                                ? JSON.parse(localStorage.getItem("settings"))
                                : {},
                            radios:HTMLCollectionOf<HTMLInputElement> = id("feedradio1")
                                .parentNode
                                .parentNode
                                .getElementsByTagName("input"),
                            text      = (id("feedtextarea") === null)
                                ? ""
                                :id("feedtextarea")
                                    .value,
                            email:string     = (id("feedemail") === null)
                                ? ""
                                : id("feedemail")
                                    .value,
                            xhr:XMLHttpRequest = new XMLHttpRequest(),
                            sendit    = function dom_load_feedsubmit_sendit():void {
                                const node:HTMLElement = id("feedintro");
                                xhr.withCredentials = true;
                                xhr.open("POST", "https://prettydiff.com:8000/feedback/", true);
                                xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
                                xhr.send(JSON.stringify(datapack));
                                report
                                    .feed
                                    .box
                                    .getElementsByTagName("button")[1]
                                    .click();
                                if (node !== null) {
                                    node.innerHTML = "Please feel free to submit feedback about Pretty Diff at any time by answering t" +
                                            "he following questions.";
                                }
                            };
                        if (id("feedradio1") === null || namecheck.knownname !== data.settings.knownname) {
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
                        datapack.name     = data.settings.knownname;
                        datapack.rating   = a + 1;
                        datapack.settings = data.settings;
                        datapack.type     = "feedback";
                        sendit();
                    },
                    file = function dom_load_file(event:Event):void {
                        const input:HTMLInputElement = <HTMLInputElement>event.srcElement || <HTMLInputElement>event.target;
                        let a:number         = 0,
                            id:string        = "",
                            files:FileList,
                            textareaEl:HTMLTextAreaElement,
                            parent:HTMLElement,
                            reader:FileReader,
                            fileStore:string[] = [],
                            fileCount:number = 0;
                        id    = input.getAttribute("id");
                        files = input.files;
                        if (test.fs === true && files[0] !== null && typeof files[0] === "object") {
                            if (input.nodeName === "input") {
                                parent = <HTMLElement>input.parentNode.parentNode;
                                textareaEl = parent.getElementsByTagName("textarea")[0];
                            }
                            const fileLoad  = function dom_event_file_onload(event:Event):void {
                                    const tscheat:string = "result";
                                    fileStore.push(event.target[tscheat]);
                                    if (a === fileCount) {
                                        if (test.ace === true) {
                                            if (id === "outputfile") {
                                                aceStore
                                                    .codeOut
                                                    .setValue(fileStore.join("\n\n"));
                                                aceStore
                                                    .codeOut
                                                    .clearSelection();
                                            } else {
                                                aceStore
                                                    .codeIn
                                                    .setValue(fileStore.join("\n\n"));
                                                aceStore
                                                    .codeIn
                                                    .clearSelection();
                                            }
                                        } else {
                                            textarea.codeIn.value = fileStore.join("\n\n");
                                        }
                                        if (options.mode !== "diff") {
                                            method
                                                .event
                                                .execute();
                                        }
                                    }
                                };
                            fileCount = files.length;
                            do {
                                reader  = new FileReader();
                                reader.onload  = fileLoad;
                                reader.onerror = function dom_event_file_onerror(event:any):void {
                                    if (textareaEl !== undefined) {
                                        textareaEl.value = `Error reading file:\n\nThis is the browser's description: ${event.error.name}`;
                                    }
                                    fileCount   = -1;
                                };
                                if (files[a] !== undefined) {
                                    reader.readAsText(files[a], "UTF-8");
                                }
                                a = a + 1;
                            } while (a < fileCount);
                            if (options.mode !== "diff") {
                                method
                                    .event
                                    .execute();
                            }
                        }
                    },
                    fixHeight = function dom_load_fixHeight():void {
                        const input:HTMLElement = id("input"),
                            output:HTMLElement = id("output"),
                            headlineNode:HTMLElement = id("headline"),
                            height:number   = window.innerHeight || document.getElementsByTagName("body")[0].clientHeight;
                        let math:number     = 0,
                            headline:number = 0;
                        if (headlineNode !== null && headlineNode.style.display === "block") {
                            headline = 3.8;
                        }
                        if (test.ace === true) {
                            math = (height / 14) - (15.81 + headline);
                            aceStore.height = math;
                            if (input !== null) {
                                input.style.height = `${math}em`;
                                aceStore
                                    .codeIn
                                    .setStyle(`height:${math}em`);
                                aceStore
                                    .codeIn
                                    .resize();
                            }
                            if (output !== null) {
                                output.style.height = `${math}em`;
                                aceStore
                                    .codeOut
                                    .setStyle(`height:${math}em`);
                                aceStore
                                    .codeOut
                                    .resize();
                            }
                        } else {
                            math = (height / 14.4) - (15.425 + headline);
                            if (input !== null) {
                                input.style.height = `${math}em`;
                            }
                            if (output !== null) {
                                output.style.height = `${math}em`;
                            }
                        }
                    },
                    indentchar   = function dom_load_indentchar():void {
                        const insize:HTMLInputElement = id("option-indent_size"),
                            inchar:HTMLInputElement = id("option-indent_char"),
                            tabSizeNumber:number = (insize === null || isNaN(Number(insize.value)) === true)
                                ? 4
                                : Number(insize.value),
                            tabSize:number = (tabSizeNumber < 1)
                                ? 4
                                : tabSizeNumber;
                        if (test.ace === true) {
                            if (inchar !== null && inchar.value === " ") {
                                aceStore
                                    .codeIn
                                    .getSession()
                                    .setUseSoftTabs(true);
                                aceStore
                                    .codeOut
                                    .getSession()
                                    .setUseSoftTabs(true);
                                aceStore
                                    .codeIn
                                    .getSession()
                                    .setTabSize(tabSize);
                                aceStore
                                    .codeOut
                                    .getSession()
                                    .setTabSize(tabSize);
                            } else {
                                aceStore
                                    .codeIn
                                    .getSession()
                                    .setUseSoftTabs(false);
                                aceStore
                                    .codeOut
                                    .getSession()
                                    .setUseSoftTabs(false);
                            }
                        }
                    },
                    insize   = function dom_load_insize():void {
                        const insize:HTMLInputElement = id("option-indent_size"),
                            tabSizeNumber:number = (insize === null || isNaN(Number(insize.value)) === true)
                                ? 4
                                : Number(insize.value),
                            tabSize:number = (tabSizeNumber < 1)
                                ? 4
                                : tabSizeNumber;
                        if (test.ace === true) {
                            aceStore
                                .codeIn
                                .getSession()
                                .setTabSize(tabSize);
                            aceStore
                                .codeOut
                                .getSession()
                                .setTabSize(tabSize);
                        }
                    },
                    modes = function dom_load_modes(event:Event):void {
                        const elly:HTMLElement = <HTMLElement>event.target || <HTMLElement>event.srcElement,
                            mode = elly.getAttribute("id").replace("mode", "");
                        method.event.modeToggle(mode);
                        method.app.options(event);
                    },
                    numeric = function dom_load_numeric(event:Event):void {
                        const el:HTMLInputElement = <HTMLInputElement>event.srcElement || <HTMLInputElement>event.target;
                        let val = el.value,
                            negative:boolean = (/^(\s*-)/).test(val),
                            split:string[] = val.replace(/\s|-/g, "").split(".");
                        if (split.length > 1) {
                            val = `${split[0].replace(/\D/g, "")}.${split[1].replace(/\D/, "")}`;
                        } else {
                            val = split[0].replace(/\D/g, "");
                        }
                        if (negative === true) {
                            val = `-${val}`;
                        }
                        el.value = val;
                        if (el === id("option-indent_char")) {
                            indentchar();
                        } else if (el === id("option-indent_size")) {
                            insize();
                        }
                        if (test.load === false) {
                            method.app.options(event);
                        }
                    },
                    prepBox = function dom_load_prepBox(boxName:string):void {
                        if (report[boxName].box === null || (test.domain === false && boxName === "feed")) {
                            return;
                        }
                        const jsscope = id("option-jsscope"),
                            buttonGroup:HTMLElement = report[boxName]
                                .box
                                .getElementsByTagName("p")[0],
                            title:HTMLButtonElement = report[boxName]
                                .box
                                .getElementsByTagName("h3")[0]
                                .getElementsByTagName("button")[0],
                            filedrop = function dom_load_prepBox_filedrop(event:Event):void {
                                event.stopPropagation();
                                event.preventDefault();
                                file(event);
                            },
                            filenull = function dom_load_prepBox_filenull(event:Event):void {
                                event.stopPropagation();
                                event.preventDefault();
                            };
                        if (test.fs === true) {
                            report[boxName].box.ondragover  = filenull;
                            report[boxName].box.ondragleave = filenull;
                            report[boxName].box.ondrop      = filedrop;
                        }
                        report[boxName].body.onmousedown = function dom_load_prepBox_top():void {
                            method.app.zTop(report[boxName].body.parentNode);
                        };
                        parent = <HTMLElement>title.parentNode;
                        title.onmousedown                         = method.event.grab;
                        title.ontouchstart                        = method.event.grab;
                        title.onfocus                             = method.event.minimize;
                        title.onblur                              = function dom_load_prepBox_blur():void {
                            title.onclick = null;
                        };
                        if (data.settings.report[boxName] === undefined) {
                            data.settings.report[boxName] = {};
                        }
                        if (boxName === "code" && jsscope !== null && jsscope[jsscope.selectedIndex].value === "report" && buttonGroup.innerHTML.indexOf("save") < 0) {
                            if (test.agent.indexOf("firefox") > 0 || test.agent.indexOf("presto") > 0) {
                                let saveNode:HTMLElement = document.createElement("a");
                                saveNode.setAttribute("href", "#");
                                saveNode.onclick   = method.event.save;
                                saveNode.innerHTML = "<button class='save' title='Convert report to text that can be saved.' tabindex=" +
                                                    "'-1'>S</button>";
                                buttonGroup.insertBefore(saveNode, buttonGroup.firstChild);
                            } else {
                                let saveNode:HTMLElement = document.createElement("button");
                                saveNode.setAttribute("class", "save");
                                saveNode.setAttribute("title", "Convert report to text that can be saved.");
                                saveNode.innerHTML = "S";
                                buttonGroup.insertBefore(saveNode, buttonGroup.firstChild);
                            }
                        }
                        if (data.settings.report[boxName].min === false) {
                            buttonGroup.style.display = "block";
                            title.style.cursor    = "move";
                            if (buttonGroup.innerHTML.indexOf("save") > 0) {
                                buttonGroup.getElementsByTagName("button")[1].innerHTML = "\u035f";
                                if (test.agent.indexOf("macintosh") > 0) {
                                    parent.style.width = `${(data.settings.report[boxName].width / 10) - 8.15}em`;
                                } else {
                                    parent.style.width = `${(data.settings.report[boxName].width / 10) - 9.75}em`;
                                }
                            } else {
                                buttonGroup.getElementsByTagName("button")[0].innerHTML = "\u035f";
                                if (test.agent.indexOf("macintosh") > 0) {
                                    parent.style.width = `${(data.settings.report[boxName].width / 10) - 5.15}em`;
                                } else {
                                    parent.style.width = `${(data.settings.report[boxName].width / 10) - 6.75}em`;
                                }
                            }
                            if (data.settings.report[boxName].top < 15) {
                                data.settings.report[boxName].top = 15;
                            }
                            report[boxName].box.style.right    = "auto";
                            report[boxName].box.style.left     = `${data.settings.report[boxName].left / 10}em`;
                            report[boxName].box.style.top      = `${data.settings.report[boxName].top / 10}em`;
                            report[boxName].body.style.width   = `${data.settings.report[boxName].width / 10}em`;
                            report[boxName].body.style.height  = `${data.settings.report[boxName].height / 10}em`;
                            report[boxName].body.style.display = "block";
                        }
                        if (boxName === "feed") {
                            id("feedsubmit").onclick = feedsubmit;
                        }
                    },
                    select = function dom_load_select(event:Event):void {
                        const elly:HTMLSelectElement = <HTMLSelectElement>event.target || <HTMLSelectElement>event.srcElement;
                        selectDescription(elly);
                        method.app.options(event);
                        if (elly.getAttribute("id") === "option-color") {
                            method.event.colorScheme(event);
                        }
                    },
                    selectDescription = function dom_load_selectDescription(el:HTMLSelectElement):void {
                        const opts:HTMLCollectionOf<HTMLOptionElement> = el.getElementsByTagName("option"),
                            desc:string = opts[el.selectedIndex].getAttribute("data-description"),
                            opt:HTMLOptionElement = <HTMLOptionElement>el[el.selectedIndex],
                            value:string = opt.value,
                            parent:HTMLElement = <HTMLElement>el.parentNode,
                            span:HTMLSpanElement = parent.getElementsByTagName("span")[0];
                        span.innerHTML = ` <strong>${value}</strong> \u2014 ${desc}`;
                    },
                    textareablur    = function dom_load_textareablur(event:Event):void {
                        const el:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target,
                            tabkey = id("textareaTabKey");
                        if (tabkey === null) {
                            return;
                        }
                        tabkey.style.display = "none";
                        if (test.ace === true) {
                            const item = <HTMLElement>el.parentNode;
                            item.setAttribute("class", item.getAttribute("class").replace(" filefocus", ""));
                        }
                    },
                    textareafocus   = function dom_load_textareafocus(event:Event):void {
                        const el:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target,
                            tabkey:HTMLElement = id("textareaTabKey"),
                            aria:HTMLElement   = id("arialive");
                        if (tabkey === null) {
                            return;
                        }
                        tabkey.style.zIndex = String(data.zIndex + 10);
                        if (aria !== null) {
                            aria.innerHTML = tabkey.innerHTML;
                        }
                        if (options.mode === "diff") {
                            tabkey.style.right = "51%";
                            tabkey.style.left  = "auto";
                        } else {
                            tabkey.style.left  = "51%";
                            tabkey.style.right = "auto";
                        }
                        tabkey.style.display = "block";
                        if (test.ace === true) {
                            let item = <HTMLElement>el.parentNode;
                            item.setAttribute("class", `${item.getAttribute("class")} filefocus`);
                        }
                    };

                // prep default announcement text
                {
                    const headline  = id("headline"),
                        headtext    = (headline === null)
                            ? null
                            : headline.getElementsByTagName("p")[0],
                        x           = Math.random(),
                        circulation = [
                            "Available in your editor with <a href=\"https://unibeautify.com/\">Unibeautify</a>",
                            "Updated to <a href=\"https://www.npmjs.com/package/prettydiff\">NPM</a>.",
                            "Check out the <a href=\"https://sparser.io/demo/\">parsing utility</a> that makes this possible.",
                            "Supporting <a href=\"documentation.xhtml#languages\">45 languages</a> as of version 101.0.11"
                        ];
                    if (headline !== null) {
                        headtext.innerHTML = circulation[Math.floor(x * circulation.length)];
                        if (location.href.indexOf("ignore") > 0) {
                            headline.innerHTML = "<h2>BETA TEST SITE.</h2> <p>Official Pretty Diff is at <a href=\"https://prettydiff.com/\">https://prettydiff.com/</a></p> <span class=\"clear\"></span>";
                        }
                    }
                }

                // changing the default value of diff_format and complete_document for the browser tool
                {
                    let el:HTMLElement = document.getElementById("option-diff_format"),
                        ops:HTMLCollectionOf<HTMLOptionElement> = el.getElementsByTagName("option"),
                        sel:HTMLSelectElement,
                        a:number = 0;
                    options.diff_format = "html";
                    sel = <HTMLSelectElement>el;
                    if (ops[0].innerHTML !== "html") {
                        do {
                            a = a + 1;
                        } while (a < ops.length && ops[a].innerHTML !== "html");
                    }
                    if (a < ops.length) {
                        sel.selectedIndex = a;
                    }
                }

                // build the Ace editors
                if (test.ace === true) {
                    const insize:HTMLInputElement = id("option-indent_size"),
                        tabSizeNumber:number = (insize === null || isNaN(Number(insize.value)) === true)
                            ? 4
                            : Number(insize.value),
                        tabSize:number = (tabSizeNumber < 1)
                            ? 4
                            : tabSizeNumber;
                    if (textarea.codeIn !== null) {
                        aceStore.codeIn = aceApply("codeIn", true);
                    }
                    if (textarea.codeOut !== null) {
                        aceStore.codeOut = aceApply("codeOut", true);
                    }
                    aceStore
                        .codeIn
                        .getSession()
                        .setTabSize(tabSize);
                    aceStore
                        .codeOut
                        .getSession()
                        .setTabSize(tabSize);
                }
                x = id("ace-no");
                if (test.ace === false && x !== null && x.checked === false) {
                    x.checked = true;
                }

                // preps stored settings
                // should come after events are assigned
                if (localStorage.getItem("settings") !== undefined && localStorage.getItem("settings") !== null) {
                    if (localStorage.getItem("settings").indexOf(":undefined") > 0 && test.store === true) {
                        localStorage.setItem("settings", localStorage.getItem("settings").replace(/:undefined/g, ":false"));
                    }
                    data.settings = JSON.parse(localStorage.getItem("settings"));
                    const keys:string[] = Object.keys(data.settings),
                        keylen:number = keys.length;
                    let a:number = 0,
                        el:HTMLElement,
                        sel:HTMLSelectElement,
                        name:string,
                        opt:HTMLOptionElement,
                        numb:number;
                    do {
                        if (keys[a] !== "report" && keys[a] !== "knownname" && keys[a] !== "feedback") {
                            el = id(keys[a]) || id(data.settings[keys[a]]);
                            if (el !== null) {
                                name = el.nodeName.toLowerCase();
                                if (name === "select") {
                                    sel = <HTMLSelectElement>el;
                                    sel.selectedIndex = data.settings[keys[a]];
                                    opt = <HTMLOptionElement>sel[sel.selectedIndex];
                                    options[keys[a].replace("option-", "")] = opt.value;
                                    if (keys[a] === "option-color") {
                                        method.event.colorScheme(null);
                                    }
                                } else {
                                    if (keys[a] === "mode") {
                                        id(data.settings[keys[a]]).checked = true;
                                        options.mode = data.settings[keys[a]].replace("mode", "");
                                        method.event.modeToggle(options.mode);
                                    } else if (typeof data.settings[keys[a]] === "string" && data.settings[keys[a]].indexOf("option-true-") === 0) {
                                        id(data.settings[keys[a]]).checked = true;
                                        options[keys[a].replace("option-", "")] = true;
                                    } else if (typeof data.settings[keys[a]] === "string" && data.settings[keys[a]].indexOf("option-false-") === 0) {
                                        id(data.settings[keys[a]]).checked = true;
                                    } else if (keys[a].indexOf("option-") === 0) {
                                        if (id(keys[a]).getAttribute("data-type") === "number") {
                                            numb = Number(data.settings[keys[a]]);
                                            if (isNaN(numb) === false) {
                                                id(keys[a]).value = data.settings[keys[a]];
                                                options[keys[a].replace("option-", "")] = numb;
                                                if (test.ace === true && keys[a] === "option-wrap") {
                                                    if (numb < 1) {
                                                        numb = 80;
                                                    }
                                                    aceStore.codeIn.setPrintMarginColumn(numb);
                                                    aceStore.codeOut.setPrintMarginColumn(numb);
                                                }
                                            }
                                        } else {
                                            id(keys[a]).value = data.settings[keys[a]];
                                            options[keys[a].replace("option-", "")] = data.settings[keys[a]];
                                        }
                                        if (keys[a] === "option-indent_size") {
                                            insize();
                                        } else if (keys[a] === "option-indent_char") {
                                            indentchar();
                                        }
                                    } else if (id(data.settings[keys[a]]) !== null) {
                                        id(data.settings[keys[a]]).checked = true;
                                    }
                                }
                            }
                        }
                        a = a + 1;
                    } while (a < keylen)
                    if (data.settings.report === undefined) {
                        data.settings.report = {
                            code: {},
                            feed: {},
                            stat: {}
                        };
                    }
                    if (data.settings.knownname === undefined && test.store === true) {
                        data.settings.knownname = `${Math
                            .random()
                            .toString()
                            .slice(2) + Math
                            .random()
                            .toString()
                            .slice(2)}`;
                        localStorage.setItem("settings", JSON.stringify(data.settings));
                    }
                } else {
                    data.settings.knownname = `${Math
                        .random()
                        .toString()
                        .slice(2) + Math
                        .random()
                        .toString()
                        .slice(2)}`;
                }
                if (options.diff === undefined) {
                    options.diff = "";
                }
                if (localStorage.getItem("source") !== undefined && localStorage.getItem("source") !== null) {
                    options.source = localStorage.getItem("source");
                    if (test.ace === true) {
                        aceStore.codeIn.setValue(options.source);
                    } else {
                        textarea.codeIn.value = options.source;
                    }
                }
                if (localStorage.getItem("diff") !== undefined && localStorage.getItem("diff") !== null) {
                    options.diff = localStorage.getItem("diff");
                    if (options.mode === "diff") {
                        if (test.ace === true) {
                            aceStore.codeOut.setValue(options.diff);
                        } else {
                            textarea.codeOut.value = options.diff;
                        }
                    }
                }

                //  feedback dialogue config data (current disabled)
                if (data.settings.feedback === undefined) {
                    data.settings.feedback         = {};
                    data.settings.feedback.newb    = false;
                    data.settings.feedback.veteran = false;
                }
                x = id("feedsubmit");
                if (x !== null) {
                    x.onclick = feedsubmit;
                }

                // assigns event handlers to input elements
                inputs    = document.getElementsByTagName("input");
                inputsLen = inputs.length;
                a = 0;
                do {
                    x = inputs[a];
                    type = x.getAttribute("type");
                    idval   = x.getAttribute("id");
                    if (type === "radio") {
                        name = x.getAttribute("name");
                        if (id === data.settings[name]) {
                            x.checked = true;
                        }
                        if (idval.indexOf("feedradio") === 0) {
                            feeds(x);
                        } else if (name === "mode") {
                            x.onclick = modes;
                        } else if (name === "ace-radio") {
                            x.onclick = aces;
                        } else {
                            x.onclick = method.app.options;
                        }
                    } else if (type === "text") {
                        if (x.getAttribute("data-type") === "number") {
                            x.onkeyup = numeric;
                        } else {
                            x.onkeyup = method.app.options;
                        }
                        if (data.settings[idval] !== undefined) {
                            x.value = data.settings[idval];
                        }
                        if (idval === "option-language" && options.mode !== "diff" && x.value === "text") {
                            x.value = "auto";
                        }
                    } else if (type === "file") {
                        x.onchange = file;
                        x.onfocus  = function dom_load_filefocus():void {
                            x.setAttribute("class", "filefocus");
                        };
                        x.onblur   = function dom_load_fileblur():void {
                            x.removeAttribute("class");
                        };
                    }
                    a = a + 1;
                } while (a < inputsLen);

                // assigns event handlers to select elements
                selects    = document.getElementsByTagName("select");
                inputsLen = selects.length;
                a = 0;
                if (inputsLen > 0) { 
                    do {
                        idval = selects[a].getAttribute("id");
                        if (idval === "option-color") {
                            if (data.settings["option-color"] !== undefined) {
                                selects[a].selectedIndex = Number(data.settings["option-color"]);
                                selectDescription(selects[a]);
                            }
                        } else {
                            if (typeof data.settings[idval] === "number") {
                                selects[a].selectedIndex = data.settings[idval];
                                selectDescription(selects[a]);
                            }
                        }
                        selects[a].onchange = select;
                        a = a + 1;
                    } while (a < inputsLen);
                }

                // assigns event handlers to buttons
                buttons    = document.getElementsByTagName("button");
                inputsLen = buttons.length;
                a = 0;
                do {
                    name  = buttons[a].getAttribute("class");
                    idval = buttons[a].getAttribute("id");
                    if (name === null) {
                        if (buttons[a].value === "Execute") {
                            buttons[a].onclick = method.event.execute;
                        } else if (idval === "resetOptions") {
                            buttons[a].onclick = method.event.reset;
                        }
                    } else if (name === "minimize") {
                        buttons[a].onclick = method.event.minimize;
                    } else if (name === "maximize") {
                        buttons[a].onclick = method.event.maximize;
                        parent = <HTMLElement>buttons[a].parentNode.parentNode;
                        if (data.settings[parent.getAttribute("id")] !== undefined && data.settings[parent.getAttribute("id")].max === true) {
                            buttons[a].click();
                        }
                    } else if (name === "resize") {
                        buttons[a].onmousedown = method.event.resize;
                    } else if (name === "save") {
                        buttons[a].onclick = method.event.save;
                    }
                    a = a + 1;
                } while (a < inputsLen);

                // preps the file inputs
                if (test.fs === false) {
                    x = id("inputfile");
                    if (x !== null) {
                        x.disabled = true;
                    }
                    x = id("outputfile");
                    if (x !== null) {
                        x.disabled = true;
                    }
                }

                // prep the floating GUI windows
                // should come after store settings are processed
                report.feed.body = (report.feed.box === null)
                    ? null
                    : report
                        .feed
                        .box
                        .getElementsByTagName("div")[0];
                report.code.body = (report.code.box === null)
                    ? null
                    : report
                        .code
                        .box
                        .getElementsByTagName("div")[0];
                report.stat.body = (report.stat.box === null)
                    ? null
                    : report
                        .stat
                        .box
                        .getElementsByTagName("div")[0];
                prepBox("feed");
                prepBox("code");
                prepBox("stat");

                // sets default configurations from URI query string
                // should come after all configurations are processed, so as to override
                if (typeof location === "object" && typeof location.href === "string" && location.href.indexOf("?") > -1) {
                    let b:number        = 0,
                        c:number        = 0,
                        paramLen:number = 0,
                        param:string[]    = [],
                        colors:HTMLCollectionOf<HTMLOptionElement>,
                        lang:HTMLInputElement = id("option-language"),
                        source:string   = "",
                        diff:string     = "";
                    const color:HTMLSelectElement    = id("option-color"),
                        params   = location
                            .href
                            .split("?")[1]
                            .split("&");
                    if (color !== null) {
                        colors = color.getElementsByTagName("option");
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
                            if (param[1] === "analysis" && id("modeanalysis") !== null) {
                                method
                                    .event
                                    .modeToggle("analysis");
                                id("modeanalysis").checked = true;
                            } else if (param[1] === "beautify" && id("modebeautify") !== null) {
                                method
                                    .event
                                    .modeToggle("beautify");
                                id("modebeautify").checked = true;
                            } else if (param[1] === "diff" && id("modediff") !== null) {
                                method
                                    .event
                                    .modeToggle("diff");
                                id("modediff").checked = true;
                            } else if (param[1] === "minify" && id("modeminify") !== null) {
                                method
                                    .event
                                    .modeToggle("minify");
                                id("modeminify").checked = true;
                            } else if (param[1] === "parse" && id("modeparse") !== null) {
                                method
                                    .event
                                    .modeToggle("parse");
                                id("modeparse").checked = true;
                            } else {
                                params.splice(b, 1);
                                b = b - 1;
                                paramLen = paramLen - 1;
                            }
                        } else if (param[0] === "s" || param[0] === "source") {
                            param[0] = "source";
                            source = param[1];
                        } else if ((param[0] === "d" || param[0] === "diff") && textarea.codeOut !== null) {
                            param[0] = "diff";
                            diff = param[1];
                            if (test.ace === true && diff !== undefined) {
                                aceStore
                                    .codeOut
                                    .setValue(diff);
                                aceStore
                                    .codeOut
                                    .clearSelection();
                            } else {
                                textarea.codeOut.value = diff;
                            }
                        } else if ((param[0] === "l" || param[0] === "lang" || param[0] === "language") && lang !== null) {
                            param[0] = "lang";
                            if (param[1] === "text" || param[1] === "plain" || param[1] === "plaintext") {
                                param[1] = "text";
                                method
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
                            lang.value = param[1];
                            if (test.ace === true && c > -1) {
                                if (param[1] === "vapor") {
                                    aceStore
                                        .codeIn
                                        .getSession()
                                        .setMode("ace/mode/html");
                                    aceStore
                                        .codeOut
                                        .getSession()
                                        .setMode("ace/mode/html");
                                } else {
                                    aceStore
                                        .codeIn
                                        .getSession()
                                        .setMode(`ace/mode/${param[1]}`);
                                    aceStore
                                        .codeOut
                                        .getSession()
                                        .setMode(`ace/mode/${param[1]}`);
                                }
                            }
                            method.app.langkey({
                                sample: aceStore.codeIn.getValue(),
                                name: param[1]
                            });
                        } else if (param[0] === "c" || param[0] === "color") {
                            param[0] = "color";
                            c = colors.length - 1;
                            do {
                                if (colors[c].innerHTML.toLowerCase() === param[1]) {
                                    color.selectedIndex = c;
                                    method
                                        .event
                                        .colorScheme(null);
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
                            method
                                .app
                                .hideOutput(id("option-jsscope"));
                        } else if (param[0] === "jscorrect" || param[0] === "correct" || param[0] === "fix") {
                            param[0] = "correct";
                            param[1] = "true";
                            x = id("option-true-correct");
                            if (x !== null) {
                                x.checked = true;
                            }
                        } else if (param[0] === "html" || param[0] === "vapor") {
                            param[1] = "true";
                            if (lang !== null) {
                                lang.value = "html";
                            }
                            if (test.ace === true) {
                                aceStore
                                    .codeIn
                                    .getSession()
                                    .setMode("ace/mode/html");
                                aceStore
                                    .codeOut
                                    .getSession()
                                    .setMode("ace/mode/html");
                            }
                        } else if (param[0] === "localstorage") {
                            if (param[1] === "false" || param[1] === "" || param[1] === undefined) {
                                test.store = false;
                                if (id("localStorage-no") !== null) {
                                    id("localStorage-no").checked = true;
                                }
                            } else {
                                test.store = true;
                                if (id("localStorage-yes") !== null) {
                                    id("localStorage-yes").checked = true;
                                }
                            }
                        } else if (options[param[0]] !== undefined) {
                            options[param[0]] = param[1];
                            if (id(`option-true-${param[0]}`) !== null) {
                                id(`option-true-${param[0]}`).checked = true;
                            }
                        }
                        b = b + 1;
                    } while (b < paramLen);
                    if (source !== "" && source !== undefined && source !== null) {
                        if (textarea.codeIn !== null) {
                            if (test.ace === true) {
                                aceStore
                                    .codeIn
                                    .setValue(source);
                                aceStore
                                    .codeIn
                                    .clearSelection();
                            } else {
                                textarea.codeIn.value = source;
                            }
                            method
                                .event
                                .execute();
                        }
                    }
                }

                // sets audio configuration
                if (test.audio !== null) {
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
                    data.audio = {};
                    data.audio.binary = window.atob(audioString.join(""));
                    data.audio.play   = function dom_load_audio():void {
                        const source:AudioBufferSourceNode  = test
                                .audio
                                .createBufferSource(),
                            focused:HTMLElement = <HTMLElement>document.activeElement,
                            buff:ArrayBuffer   = new ArrayBuffer(data.audio.binary.length),
                            bytes:Uint8Array   = new Uint8Array(buff),
                            bytelen:number = buff.byteLength;
                        let z:number       = 0;
                        do {
                            bytes[z] = data
                                .audio
                                .binary
                                .charCodeAt(z);
                            z = z + 1;
                        } while (z < bytelen);
                        test
                            .audio
                            .decodeAudioData(buff, function dom_load_audio_decode(buffer:AudioBuffer):void {
                                source.buffer = buffer;
                                source.loop   = false;
                                source.connect(test.audio.destination);
                                source.start(0, 0, 1.8);
                                // eslint-disable-next-line
                                console.log("You found a secret!");
                                focused.focus();
                            });
                    };
                }

                // sets some default event configurations
                if (textarea.codeIn !== null) {
                    textarea.codeIn.onfocus   = textareafocus;
                    textarea.codeIn.onblur    = textareablur;
                    if (test.ace === true) {
                        textarea.codeIn.onkeydown = function dom_load_bindInDownAce(event:KeyboardEvent):void {
                            areaTabOut(event);
                            method
                                .event
                                .keydown(event);
                        };
                    } else {
                        textarea.codeIn.onkeydown = function dom_load_bindInDown(event:KeyboardEvent):void {
                            method
                                .event
                                .fixtabs(event, textarea.codeIn);
                            areaTabOut(event);
                            method
                                .event
                                .keydown(event);
                        };
                    }
                }
                if (textarea.codeOut !== null) {
                    textarea.codeOut.onfocus   = textareafocus;
                    textarea.codeOut.onblur    = textareablur;
                    if (test.ace === true) {
                        textarea.codeOut.onkeydown = areaTabOut;
                    }
                }
                window.onresize     = fixHeight;
                window.onkeyup      = areaShiftUp;
                document.onkeypress = backspace;
                document.onkeydown  = backspace;

                // sets vertical responsive design layout
                // must occur after all other visual and interactive changes
                fixHeight();
                method.app.hideOutput();

                // connecting to web sockets if running as localhost
                if (location.href.indexOf("//localhost:") > 0) {
                    let ws = new WebSocket(`ws://localhost:${(function dom_load_webSocketsPort():number {
                        const uri = location.href;
                        let str:string = uri.slice(location.href.indexOf("host:") + 5),
                            ind:number = str.indexOf("/");
                        if (ind > 0) {
                            str = str.slice(0, ind);
                        }
                        ind = str.indexOf("?");
                        if (ind > 0) {
                            str = str.slice(0, ind);
                        }
                        ind = str.indexOf("#");
                        if (ind > 0) {
                            str = str.slice(0, ind);
                        }
                        ind = Number(str);
                        if (isNaN(ind) === true) {
                            return 8080;
                        }
                        return ind;
                    }()) + 1}`);
                    ws.addEventListener("message", function dom_load_webSockets(event):void {
                        if (event.data === "reload") {
                            location.reload();
                        }
                    });
                    document.getElementsByTagName("body")[0].style.display = "none";
                    window.onload = function dom_load_webSocketLoaded():void {
                        security();
                        document.getElementsByTagName("body")[0].style.display = "block";
                        id("button-primary").getElementsByTagName("button")[0].click();
                    };
                }

                // sets up the option comment string
                x = id("commentString");
                if (x !== null) {
                    if (localStorage.getItem("commentString") !== undefined && localStorage.getItem("commentString") !== null && localStorage.getItem("commentString") !== "") {
                        data.commentString = JSON.parse(localStorage.getItem("commentString"));
                    }
                    if (x.value.length === 0) {
                        x.innerHTML = "/*prettydiff.com \u002a/";
                    } else {
                        x.innerHTML = `/*prettydiff.com ${data
                            .commentString
                            .join(", ")
                            .replace(/api\./g, "")} \u002a/`;
                    }
                    x = id("commentClear");
                    if (x !== null) {
                        x.onclick = clearComment;
                    }
                }

                // set the ace wrap slider load conditions
                if (test.ace === true) {
                    const slide:HTMLElement = id("slider"),
                        input:HTMLElement = id("input"),
                        gutter:HTMLElement = <HTMLElement>input.getElementsByClassName("ace_gutter")[0],
                        wrap:number = (options.wrap > 1)
                            ? options.wrap
                            : 80;
                    setTimeout(function dom_load_aceGutter() {
                        slide.style.marginLeft = gutter.style.width;
                    }, 500);
                    slide.getElementsByTagName("span")[0].style.left = `${wrap * 1.0035}em`;
                    if (options.mode !== "beautify") {
                        slide.style.display = "none";
                    }
                }
            }
            if (pages === "documentation") {
                let a:number = 0,
                    b:number           = 0,
                    colorParam:string  = (typeof location === "object" && typeof location.href === "string" && location.href.indexOf("?") > -1)
                        ? location
                            .href
                            .toLowerCase()
                            .split("?")[1]
                        : "";
                const docbuttons:HTMLCollectionOf<HTMLButtonElement>  = document.getElementsByTagName("button"),
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
                    colorScheme:HTMLSelectElement = id("option-color"),
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
                        const options:HTMLCollectionOf<HTMLOptionElement> = colorScheme.getElementsByTagName("option"),
                            olen:number = options.length;
                        if (test.store === true && localStorage !== null && localStorage.getItem("settings") !== undefined && localStorage.getItem("settings") !== null && localStorage.getItem("settings").indexOf(":undefined") > 0) {
                            localStorage.setItem("settings", localStorage.getItem("settings").replace(/:undefined/g, ":false"));
                        }
                        data.settings = (localStorage.getItem("settings") !== undefined && localStorage.getItem("settings") !== null)
                            ? JSON.parse(localStorage.getItem("settings"))
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
                                    colorScheme.selectedIndex = b;
                                    break;
                                }
                                b = b + 1;
                            } while (b < olen);
                        }
                        if (((olen > 0 && b !== olen) || olen === 0) && data.settings["option-color"] !== undefined) {
                            colorScheme.selectedIndex = data.settings["option-color"];
                        }
                        method
                            .event
                            .colorScheme(null);
                        colorScheme.onchange = method.event.colorScheme;
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
                window.onload = security;
            }
            if (pages === "page") {
                let b:number          = 0,
                    colorOptions:HTMLCollectionOf<HTMLOptionElement>,
                    olen:number       = 0,
                    colorParam:string = (typeof location === "object" && typeof location.href === "string" && location.href.indexOf("?") > -1)
                        ? location
                            .href
                            .toLowerCase()
                            .split("?")[1]
                        : "";
                const node    = id("option-color");
                colorOptions = node.getElementsByTagName("option");
                olen    = colorOptions.length;
                if (node !== null) {
                    if (test.store === true && localStorage !== null && localStorage.getItem("settings") !== undefined && localStorage.getItem("settings") !== null && localStorage.getItem("settings").indexOf(":undefined") > 0) {
                        localStorage.setItem("settings", localStorage.getItem("settings").replace(/:undefined/g, ":false"));
                    }
                    data.settings = (localStorage.getItem("settings") !== undefined && localStorage.getItem("settings") !== null)
                        ? JSON.parse(localStorage.getItem("settings"))
                        : {};
                    if (colorParam.indexOf("c=") === 0 || colorParam.indexOf("&c=") > -1) {
                        if (colorParam.indexOf("&c=") > -1) {
                            colorParam.substr(colorParam.indexOf("&c=") + 1);
                        }
                        colorParam = colorParam.split("&")[0];
                        colorParam = colorParam.substr(colorParam.indexOf("=") + 1);
                        b = 0;
                        do {
                            if (colorOptions[b].value.toLowerCase() === colorParam) {
                                node.selectedIndex = b;
                                break;
                            }
                            b = b + 1;
                        } while (b < olen);
                    }
                    if (((olen > 0 && b !== olen) || olen === 0) && data.settings["option-color"] !== undefined) {
                        node.selectedIndex = data.settings["option-color"];
                    }
                    method
                        .event
                        .colorScheme(null);
                    node.onchange = method.event.colorScheme;
                }
                {
                    let inca:number  = 0,
                        incb:number  = 0,
                        ol:HTMLCollectionOf<HTMLOListElement>,
                        li:HTMLCollectionOf<HTMLLIElement>,
                        lilen:number = 0;
                    const div:HTMLCollectionOf<HTMLDivElement> = document.getElementsByTagName("div"),
                        len:number   = div.length;
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
                                        li[incb].onclick = method.event.beaufold;
                                    }
                                    incb = incb + 1;
                                } while (incb < lilen);
                            }
                        }
                        inca = inca + 1;
                    } while (inca < len);
                }
                window.onload = security;
            }
            test.load = false;
        };
    let meta:any,
        options:any,
        prettydiff:any;
    
    // builds the Pretty Diff options comment as options are updated
    method.app.commentString = function dom_app_commentString():void {
        const comment:HTMLElement = id("commentString");
        if (comment !== null) {
            if (data.commentString.length === 0) {
                comment.innerHTML = "/*prettydiff.com \u002a/";
            } else if (data.commentString.length === 1) {
                comment.innerHTML = `/*prettydiff.com ${data
                    .commentString[0]
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/api\./g, "")} \u002a/`;
            } else {
                data.commentString.sort();
                comment.innerHTML = `/*prettydiff.com ${data
                    .commentString
                    .join(", ")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/api\./g, "")} \u002a/`;
            }
        }
        method.app.hideOutput();
        if (test.store === true) {
            localStorage.setItem("commentString", JSON.stringify(data.commentString));
        }
    };
    // stretches input to 100% width if output is a html report
    method.app.hideOutput = function dom_app_hideOutput():void {
        let hide:boolean;
        if (options.complete_document === true) {
            hide = false;
        } else if (options.parse_format === "renderhtml" && options.mode === "parse") {
            hide = true;
        } else if (options.jsscope === "report" && options.mode === "beautify") {
            hide = true;
        } else {
            hide = false;
        }
        if (hide === true) {
            if (test.ace === true) {
                id("output").parentNode.style.display = "none";
                id("input").parentNode.style.width = "100%";
            } else {
                id("output").parentNode.parentNode.style.display = "none";
                id("input").parentNode.parentNode.style.width = "100%";
            }
        } else {
            if (test.ace === true) {
                id("output").parentNode.style.display = "block";
                id("input").parentNode.style.width = "49%";
            } else {
                id("output").parentNode.parentNode.style.display = "block";
                id("input").parentNode.parentNode.style.width = "49%";
            }
        }
    };
    // determine the specific language if auto or unknown
    method.app.langkey  = function dom_app_langkey(obj:any):[string, string, string] {
        let defaultval:string  = "",
            defaultt:string    = "",
            value:languageAuto;
        const language:language    = prettydiff.api.language,
            langdefault:HTMLInputElement = id("option-language_default");
        if (typeof language !== "object") {
            return ["", "", ""];
        }
        defaultval = (langdefault === null)
            ? "javascript"
            : (langdefault.value === "text" && options.mode !== "diff")
                ? "javascript"
                : langdefault.value;
        defaultt = language.setlexer(defaultval);
        if (defaultval === "auto") {
            obj.name = "auto";
        }
        if (obj.name === "auto" && obj.sample !== "") {
            data.langvalue = language.auto(obj.sample, defaultt);
        } else if (obj.name === "csv") {
            data.langvalue = ["plain_text", "csv", "CSV"];
        } else if (obj.name === "text") {
            data.langvalue = ["plain_text", "text", "Plain Text"];
        } else if (obj.name !== "") {
            data.langvalue = [obj.name, language.setlexer(obj.name), language.nameproper(obj.name)];
        } else if (obj.sample !== "" || test.ace === false) {
            data.langvalue = language.auto(obj.sample, defaultt);
        } else {
            data.langvalue = [defaultt, language.setlexer(defaultt), language.nameproper(defaultt)];
        }
        value = data.langvalue;
        if (test.ace === true) {
            if (value[0] === "script" || value[0] === "tss") {
                value = ["javascript", value[1], value[2]];
            } else if (value[0] === "dustjs") {
                value = ["html", value[1], value[2]];
            } else if (value[0] === "markup") {
                value = ["xml", value[1], value[2]];
            } else if (value[1] === "style") {
                value = ["css", value[1], value[2]];
            }
            if (textarea.codeIn !== null) {
                if (value[0] === "vapor") {
                    aceStore
                        .codeIn
                        .getSession()
                        .setMode("ace/mode/html");
                } else {
                    aceStore
                        .codeIn
                        .getSession()
                        .setMode(`ace/mode/${value[0]}`);
                }
            }
            if (textarea.codeOut !== null) {
                if (value[0] === "vapor") {
                    aceStore
                        .codeOut
                        .getSession()
                        .setMode("ace/mode/html");
                } else {
                    aceStore
                        .codeOut
                        .getSession()
                        .setMode(`ace/mode/${value[0]}`);
                }
            }
        }
        if (obj.name === "text") {
            return ["text", "text", "Plain Text"];
        }
        if (obj.name !== "") {
            return value;
        }
        if (value.length < 1 && obj.name === "") {
            if (textarea.codeIn !== null) {
                value = language.auto(textarea.codeIn.value, defaultt);
            }
            if (value.length < 1) {
                return ["javascript", "script", "JavaScript"];
            }
            data.langvalue = value;
        }
        return value;
    };
    //store tool changes into localStorage to maintain state
    method.app.options  = function dom_app_options(event:Event):void {
        let x:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target,
            input:HTMLInputElement,
            select:HTMLSelectElement,
            item:HTMLElement,
            node:string   = "",
            value:string = "",
            xname:string  = "",
            type:string   = "",
            idval:string     = "",
            classy:string = "",
            h3:HTMLElement,
            body:HTMLElement,
            opt:HTMLOptionElement;
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
        } else if (xname === "input" || xname === "textarea") {
            input = <HTMLInputElement>x;
            item = input;
        } else if (xname === "select") {
            select = <HTMLSelectElement>x;
            item = select;
        } else if (xname === "button") {
            item = <HTMLElement>x.parentNode;
            item = (item.nodeName.toLowerCase() === "a")
                ? <HTMLElement>item.parentNode.parentNode
                : <HTMLElement>item.parentNode
        } else {
            input = <HTMLInputElement>x.getElementsByTagName("input")[0];
            item = input;
        }
        if (test.load === false && item !== id("option-language")) {
            item.focus();
        }
        node   = item
            .nodeName
            .toLowerCase();
        xname  = item.getAttribute("name");
        type   = item.getAttribute("type");
        idval  = item.getAttribute("id");
        classy = item.getAttribute("class");
        if (test.load === true) {
            return;
        }
        if (node === "input") {
            if (type === "radio") {
                data.settings[xname] = idval;
            } else if (type === "text") {
                data.settings[idval] = input.value;
            }
        } else if (node === "select") {
            data.settings[idval] = select.selectedIndex;
        } else if (node === "div" && classy === "box") {
            h3   = item.getElementsByTagName("h3")[0];
            body = item.getElementsByTagName("div")[0];
            idval = idval.replace("report", "");
            if (data.settings.report[idval] === undefined) {
                data.settings.report[idval] = {};
            }
            if (body.style.display === "none" && h3.clientWidth < 175) {
                data.settings.report[idval].min = true;
                data.settings.report[idval].max = false;
            } else if (data.settings.report[idval].max === false || data.settings.report[idval].max === undefined) {
                data.settings.report[idval].min  = false;
                data.settings.report[idval].left = item.offsetLeft;
                data.settings.report[idval].top  = item.offsetTop;
                if (test.agent.indexOf("macintosh") > 0) {
                    data.settings.report[idval].width  = (body.clientWidth - 20);
                    data.settings.report[idval].height = (body.clientHeight - 53);
                } else {
                    data.settings.report[idval].width  = (body.clientWidth - 4);
                    data.settings.report[idval].height = (body.clientHeight - 36);
                }
            }
        } else if (node === "button" && idval !== null) {
            data.settings[idval] = item
                .innerHTML
                .replace(/\s+/g, " ");
        }
        if (test.store === true) {
            localStorage.setItem("settings", JSON.stringify(data.settings));
        }
        if (classy === "box" || page.getAttribute("id") !== "webtool") {
            return;
        }
        if (item.nodeName.toLowerCase() === "select") {
            opt  = <HTMLOptionElement>select[select.selectedIndex];
            value = opt.value;
        } else {
            value = input.value;
        }
        if (idval.indexOf("option-") === 0) {
            classy = idval.replace("option-", "");
            if (classy.indexOf("true-") === 0) {
                classy = classy.replace("true-", "");
                options[classy] = true;
            } else if (classy.indexOf("false-") === 0) {
                classy = classy.replace("false-", "");
                options[classy] = false;
            } else if (item.getAttribute("data-type") === "number") {
                if (isNaN(Number(value)) === false) {
                    options[classy] = Number(value);
                }
            } else {
                options[classy] = value;
            }
        } else if (idval === "inputlabel") {
            classy = "sourcelabel";
            options.source_label = value;
        } else if (idval === "outputlabel") {
            classy = "difflabel";
            options.diff_label = value;
        }
        if (classy !== null && options[classy] !== undefined && classy !== "source" && classy !== "diff") {
            let a:number = 0;
            const cslen:number = data.commentString.length;
            if (cslen > 0) {
                do {
                    if (data.commentString[a].slice(0, data.commentString[a].indexOf(":")) === classy) {
                        data.commentString.splice(a, 1);
                        break;
                    }
                    a = a + 1;
                } while (a < cslen);
            }
            if (typeof options[classy] === "number" || typeof options[classy] === "boolean") {
                data.commentString.push(`${classy}: ${options[classy]}`);
            } else {
                data.commentString.push(`${classy}: "${options[classy]}"`);
            }
            method.app.commentString();
        }
        if (test.ace === true && x.getAttribute("id") === "option-wrap" && isNaN(Number(input.value)) === false) {
            let numb:number = Number(input.value);
            if (numb < 1) {
                numb = 80;
            }
            aceStore.codeIn.setPrintMarginColumn(numb);
            aceStore.codeOut.setPrintMarginColumn(numb);
        }
    };

    //ace wrap slider
    method.event.aceSlider = function dom_app_aceSlider(event:Event):boolean {
        let subOffset:number = 0,
            cursorStatus:string = "ew",
            node:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target,
            slide:HTMLElement = <HTMLElement>node.parentNode,
            parent:HTMLElement = <HTMLElement>slide.parentNode,
            value:number = 0;
        const touch:boolean       = (event !== null && event.type === "touchstart"),
            width:number = parent.clientWidth,
            scale:number = 8.35,
            max:number = Math.round(((parent.offsetLeft + width) / scale) - scale),
            wrap = id("option-wrap");
        if (node.nodeName === "button") {
            node = slide;
            slide = parent;
            parent = <HTMLElement>parent.parentNode;
        }
        if (touch === true) {
            document.ontouchmove  = function dom_event_colSliderGrab_Touchboxmove(f:TouchEvent):void {
                f.preventDefault();
                subOffset = Math.round((f.touches[0].clientX / scale) - scale);
                if (subOffset > max) {
                    node.style.left = `${max}em`;
                    cursorStatus    = "e";
                    value = max;
                } else if (subOffset < 0) {
                    node.style.left = "0";
                    cursorStatus    = "w";
                    value = 0;
                } else if (subOffset < max && subOffset > 0) {
                    node.style.left = `${subOffset * 1.0035}em`;
                    cursorStatus    = "ew";
                    value = subOffset;
                }
                aceStore.codeIn.setPrintMarginColumn(value);
                aceStore.codeOut.setPrintMarginColumn(value);
                document.ontouchend = function dom_event_colSliderGrab_Touchboxmove_drop(f:TouchEvent):void {
                    f.preventDefault();
                    node.style.cursor = `${cursorStatus}-resize`;
                    node.getElementsByTagName("button")[0].style.cursor = `${cursorStatus}-resize`;
                    document.onmousemove = null;
                    document.onmouseup   = null;
                    wrap.value = value;
                    data.settings["option-wrap"] = value;
                    if (test.store === true) {
                        localStorage.setItem("settings", JSON.stringify(data.settings));
                    }
                    method.event.execute();
                };
            };
            document.ontouchstart = null;
        } else {
            document.onmousemove = function dom_event_colSliderGrab_Mouseboxmove(f:MouseEvent):void {
                f.preventDefault();
                subOffset = Math.round((f.clientX / scale) - scale);
                if (subOffset > max) {
                    node.style.left = `${max}em`;
                    cursorStatus    = "e";
                    value = max;
                } else if (subOffset < 0) {
                    node.style.left = "0";
                    cursorStatus    = "w";
                    value = 0;
                } else if (subOffset < max && subOffset > 0) {
                    node.style.left = `${subOffset * 1.0035}em`;
                    cursorStatus    = "ew";
                    value = subOffset;
                }
                aceStore.codeIn.setPrintMarginColumn(value);
                aceStore.codeOut.setPrintMarginColumn(value);
                document.onmouseup = function dom_event_colSliderGrab_Mouseboxmove_drop(f:MouseEvent):void {
                    f.preventDefault();
                    node.style.cursor = `${cursorStatus}-resize`;
                    node.getElementsByTagName("button")[0].style.cursor = `${cursorStatus}-resize`;
                    document.onmousemove = null;
                    document.onmouseup   = null;
                    wrap.value = value;
                    data.settings["option-wrap"] = value;
                    if (test.store === true) {
                        localStorage.setItem("settings", JSON.stringify(data.settings));
                    }
                    method.event.execute();
                };
            };
            document.onmousedown = null;
        }
        return false;
    };
    //allows visual folding of function in the JSPretty jsscope HTML output
    method.event.beaufold = function dom_event_beaufold(event:Event):void {
        let a:number     = 0,
            b:string     = "";
        const el:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target,
            title:string[] = el
                .getAttribute("title")
                .split("line "),
            parent:[HTMLElement, HTMLElement] = [<HTMLElement>el.parentNode, <HTMLElement>el.parentNode.nextSibling],
            min:number   = Number(title[1].substr(0, title[1].indexOf(" "))),
            max:number   = Number(title[2]),
            list:[HTMLCollectionOf<HTMLLIElement>, HTMLCollectionOf<HTMLLIElement>]  = [
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
            el.innerHTML = `+${el
                .innerHTML
                .substr(1)}`;
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
            el.innerHTML = `-${el
                .innerHTML
                .substr(1)}`;
        }
    };
    //change the color scheme of the web UI
    method.event.colorScheme = function dom_event_colorScheme(event:Event):void {
        const item:HTMLSelectElement = id("option-color"),
            option:HTMLCollectionOf<HTMLOptionElement>    = item.getElementsByTagName("option"),
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
            logo      = id("pdlogo"),
            output    = id("output");
        let theme:string     = "",
            logoColor:string = "";
        document
            .getElementsByTagName("body")[0]
            .setAttribute("class", color);
        if (test.ace === true && page.getAttribute("id") === "webtool") {
            if (color === "white") {
                theme = "ace/theme/textmate";
            }
            if (color === "shadow") {
                theme = "ace/theme/idle_fingers";
            }
            if (color === "canvas") {
                theme = "ace/theme/textmate";
            }
            aceStore
                .codeIn
                .setTheme(theme);
            aceStore
                .codeOut
                .setTheme(theme);
        }
        if (output !== null) {
            if (options.mode === "diff") {
                if (options.color === "white") {
                    output.style.background = "#fff";
                } else if (options.color === "shadow") {
                    output.style.background = "transparent";
                } else if (options.color === "canvas") {
                    output.style.background = "#f2f2f2";
                }
            } else {
                if (options.color === "white") {
                    output.style.background = "#f2f2f2";
                } else if (options.color === "shadow") {
                    output.style.background = "#111";
                } else if (options.color === "canvas") {
                    output.style.background = "#ccccc8";
                }
            }
        }
        if (logo !== null) {
            if (color === "canvas") {
                logoColor = "664";
            } else if (color === "shadow") {
                logoColor = "999";
            } else {
                logoColor = "666";
            }
            logo.style.borderColor = `#${logoColor}`;
            logo
                .getElementsByTagName("g")[0]
                .setAttribute("fill", `#${logoColor}`);
        }
        if (test.load === false && event !== null) {
            method
                .app
                .options(event);
        }
    };
    // allows grabbing and resizing columns (from the third column) in the diff
    // side-by-side report
    method.event.colSliderGrab = function dom_event_colSliderGrab(event:Event):boolean {
        let subOffset:number   = 0,
            withinRange:boolean = false,
            offset:number      = 0,
            cursorStatus:string      = "ew",
            diffLeft:HTMLElement,
            node:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target;
        const touch:boolean       = (event !== null && event.type === "touchstart"),
            diffRight:HTMLElement   = (function dom_event_colSliderGrab_nodeFix():HTMLElement {
                if (node.nodeName === "li") {
                    node = <HTMLElement>node.parentNode;
                }
                return <HTMLElement>node.parentNode;
            }()),
            diff:HTMLElement        = <HTMLElement>diffRight.parentNode,
            lists:HTMLCollectionOf<HTMLOListElement>       = diff.getElementsByTagName("ol"),
            par1:HTMLElement   = <HTMLElement>lists[2].parentNode,
            par2:HTMLElement   = <HTMLElement>lists[2].parentNode.parentNode,
            counter:number     = lists[0].clientWidth,
            data:number        = lists[1].clientWidth,
            width:number       = par1.clientWidth,
            total:number       = par2.clientWidth,
            min:number         = ((total - counter - data - 2) - width),
            max:number         = (total - width - counter),
            minAdjust:number   = min + 15,
            maxAdjust:number   = max - 20;
        diffLeft = <HTMLElement>diffRight.previousSibling;
        offset = par1.offsetLeft - par2.offsetLeft;
        event.preventDefault();
        if (report.code.box !== null) {
            offset = offset + report.code.box.offsetLeft;
            offset = offset - report.code.body.scrollLeft;
        } else {
            subOffset = (par1.scrollLeft > document.body.scrollLeft)
                ? par1.scrollLeft
                : document.body.scrollLeft;
            offset    = offset - subOffset;
        }
        offset             = offset + node.clientWidth;
        node.style.cursor  = "ew-resize";
        diff.style.width   = `${total / 10}em`;
        diff.style.display = "inline-block";
        if (diffLeft.nodeType !== 1) {
            do {
                diffLeft = <HTMLElement>diffLeft.previousSibling;
            } while (diffLeft.nodeType !== 1);
        }
        diffLeft.style.display   = "block";
        diffRight.style.width    = `${diffRight.clientWidth / 10}em`;
        diffRight.style.position = "absolute";
        if (touch === true) {
            document.ontouchmove  = function dom_event_colSliderGrab_Touchboxmove(f:TouchEvent):void {
                f.preventDefault();
                subOffset = offset - f.touches[0].clientX;
                if (subOffset > minAdjust && subOffset < maxAdjust) {
                    withinRange = true;
                }
                if (withinRange === true && subOffset > maxAdjust) {
                    diffRight.style.width = `${(total - counter - 2) / 10}em`;
                    cursorStatus          = "e";
                } else if (withinRange === true && subOffset < minAdjust) {
                    diffRight.style.width = `${(total - counter - data - 2) / 10}em`;
                    cursorStatus          = "w";
                } else if (subOffset < max && subOffset > min) {
                    diffRight.style.width = `${(width + subOffset) / 10}em`;
                    cursorStatus          = "ew";
                }
                document.ontouchend = function dom_event_colSliderGrab_Touchboxmove_drop(f:TouchEvent):void {
                    f.preventDefault();
                    node.style.cursor = `${cursorStatus}-resize`;
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
                    diffRight.style.width = `${(total - counter - 2) / 10}em`;
                    cursorStatus          = "e";
                } else if (withinRange === true && subOffset < minAdjust) {
                    diffRight.style.width = `${(total - counter - data - 2) / 10}em`;
                    cursorStatus          = "w";
                } else if (subOffset < max && subOffset > min) {
                    diffRight.style.width = `${(width + subOffset) / 10}em`;
                    cursorStatus          = "ew";
                }
                document.onmouseup = function dom_event_colSliderGrab_Mouseboxmove_drop(f:MouseEvent):void {
                    f.preventDefault();
                    node.style.cursor = `${cursorStatus}-resize`;
                    document.onmousemove = null;
                    document.onmouseup   = null;
                };
            };
            document.onmousedown = null;
        }
        return false;
    };
    //allows visual folding of consecutive equal lines in a diff report
    method.event.difffold = function dom_event_difffold(event:Event):void {
        let a:number         = 0,
            b:number         = 0,
            max:number,
            lists:HTMLCollectionOf<HTMLLIElement>[] = [];
        const node:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target,
            title:string[]     = node
                .getAttribute("title")
                .split("line "),
            min:number       = Number(title[1].substr(0, title[1].indexOf(" "))),
            inner:string     = node.innerHTML,
            parent:HTMLElement    = <HTMLElement>node.parentNode.parentNode,
            par1:HTMLElement = <HTMLElement>parent.parentNode,
            listnodes:HTMLCollectionOf<HTMLOListElement> = (parent.getAttribute("class") === "diff")
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
            node.innerHTML = `+${inner.substr(1)}`;
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
            node.innerHTML = `-${inner.substr(1)}`;
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
    };
    // execute bundles arguments in preparation for executing prettydiff references
    method.event.execute = function dom_event_execute(event:KeyboardEvent):boolean {
        let lang:[string, string, string],
            errortext:string   = "",
            requests:boolean    = false,
            requestd:boolean    = false,
            completed:boolean   = false,
            completes:boolean   = false,
            autolang:boolean    = false,
            autolexer:boolean = false,
            node:HTMLSelectElement        = id("option-jsscope");
        const startTime:number = Date.now(),
            lex:HTMLSelectElement = id("option-lexer"),
            lexval:HTMLOptionElement = (lex === null)
                ? null
                : <HTMLOptionElement>lex[lex.selectedIndex],
            langvalue:string = (id("option-language") === null || id("option-language").value === "" || lexval === null || lexval.value === "" || lexval.value === "auto")
                ? "auto"
                : id("option-language").value,
            ann:HTMLParagraphElement = id("announcement"),
            domain:RegExp       = (/^((https?:\/\/)|(file:\/\/\/))/),
            lf:HTMLInputElement = id("option-crlf"),
            opt:HTMLOptionElement = <HTMLOptionElement>node[node.selectedIndex],
            textout:boolean     = (options.jsscope !== "report" && (node === null || opt.value !== "report")),
            app = function dom_event_execute_app() {
                let output:string = "";
                const sanitize = function dom_event_execute_app_sanitize(input:string):string {
                        return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    },
                    renderOutput  = function dom_event_execute_app_renderOutput():void {
                        let diffList:HTMLCollectionOf<HTMLOListElement>,
                            button:HTMLButtonElement,
                            buttons:HTMLCollectionOf<HTMLButtonElement>,
                            pdlang:string     = "",
                            parent:HTMLElement,
                            chromeSave:boolean = false;
                        const commanumb  = function dom_event_execute_app_renderOutput_commanumb(numb):string {
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
                                    arr[len] = `${arr[len]},`;
                                    len = len - 3;
                                } while (len > -1);
                                return arr.join("");
                            },
                            langtext = function dom_event_execute_app_renderOutput_langtext():string {
                                if (autolang === true) {
                                    return `Code type is set to <em>auto</em>. Presumed language is <strong>${data.langvalue[2]}</strong>.`;
                                }
                                if (autolexer === true) {
                                    return `Language is set to <strong>${data.langvalue[2]}</strong>. Presumed lexer is <strong>${data.langvalue[1]}</strong>.`;
                                }
                                if (options.language === "text") {
                                    return `Language set to <strong>Plain Text</strong>.`;
                                }
                                return `Language set to <strong>${data.langvalue[2]}</strong>.`;
                            };
                        meta.time = (function dom_event_execute_app_renderOutput_proctime() {
                            const plural       = function dom_event_execute_app_renderOutput_proctime_plural(x:number, y:string):string {
                                    let a = x + y;
                                    if (x !== 1) {
                                        a = `${a}s`;
                                    }
                                    if (y !== " second") {
                                        a = `${a} `;
                                    }
                                    return a;
                                },
                                minute       = function dom_event_execute_app_renderOutput_proctime_minute():void {
                                    minutes      = elapsed / 60;
                                    minuteString = plural(minutes, " minute");
                                    minutes      = elapsed - (minutes * 60);
                                    secondString = (minutes === 1)
                                        ? "1 second"
                                        : `${minutes.toFixed(3)} seconds`;
                                };
                            let elapsed:number      = (Date.now() - startTime) / 1000,
                                minuteString:string = "",
                                hourString:string   = "",
                                minutes:number      = 0,
                                hours:number        = 0,
                                secondString:string = String(elapsed);
                            if (elapsed >= 60 && elapsed < 3600) {
                                minute();
                            } else if (elapsed >= 3600) {
                                hours      = elapsed / 3600;
                                hourString = hours.toString();
                                elapsed    = elapsed - (hours * 3600);
                                hourString = plural(hours, " hour");
                                minute();
                            } else {
                                secondString = plural(Number(secondString), " second");
                            }
                            return hourString + minuteString + secondString;
                        }());
                        meta.outsize = output.length;
                        data.zIndex = data.zIndex + 1;
                        if (autolexer === true) {
                            options.lexer = "auto";
                        }
                        button           = report
                            .code
                            .box
                            .getElementsByTagName("p")[0]
                            .getElementsByTagName("button")[0];
                        if (button.getAttribute("class") === "save" && button.innerHTML === "H") {
                            chromeSave       = true;
                            button.innerHTML = "S";
                        }
                        if (output.length > 125000) {
                            test.filled.code = true;
                        } else {
                            test.filled.code = false;
                        }
                        if ((options.mode === "parse" && options.parse_format === "table" && options.complete_document === false) || (options.language === "csv" && options.mode !== "diff")) {
                            if (report.code.box !== null) {
                                if (options.language === "csv") {
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
                                    report
                                        .code
                                        .body
                                        .appendChild(div);
                                } else if (options.mode === "parse") {
                                    if (report.code.box !== null) {
                                        const table:string[] = [];
                                        table.push("<div class='report'><h4>Parsed Output</h4>");
                                        table.push(output);
                                        table.push("</div>");
                                        output = `<p>${langtext()}</p>${table.join("")}`;
                                        report.code.body.innerHTML = output;
                                        if (report.code.body.style.display === "none") {
                                            report.code.box.getElementsByTagName("h3")[0].getElementsByTagName("button")[0].focus();
                                        }
                                        report.code.box.style.top   = `${data.settings.report.code.top / 10}em`;
                                        report.code.box.style.right = "auto";
                                    }
                                }
                            } else if (options.language !== "csv") {
                                if (test.ace === true) {
                                    aceStore
                                        .codeOut
                                        .setValue(output);
                                    aceStore
                                        .codeOut
                                        .clearSelection();
                                } else {
                                    textarea.codeOut.value = output;
                                }
                            }
                        } else if (options.mode === "beautify") {
                            if (options.jsscope === "report" && options.complete_document === false && report.code.box !== null && (data.langvalue[0] === "javascript" || data.langvalue[0] === "jsx") && output.indexOf("Error:") !== 0) {
                                report.code.body.innerHTML = output;
                                if (report.code.body.style.display === "none") {
                                    report.code.box.getElementsByTagName("h3")[0].getElementsByTagName("button")[0].focus();
                                }
                                report.code.box.style.top   = `${data.settings.report.code.top / 10}em`;
                                report.code.box.style.right = "auto";
                                diffList                                 = report
                                    .code
                                    .body
                                    .getElementsByTagName("ol");
                                if (diffList.length > 0) {
                                    const list:HTMLCollectionOf<HTMLLIElement> = diffList[0].getElementsByTagName("li");
                                    let a:number    = 0,
                                        b:number    = list.length;
                                    do {
                                        if (list[a].getAttribute("class") === "fold") {
                                            list[a].onclick = method.event.beaufold;
                                        }
                                        a = a + 1;
                                    } while (a < b);
                                }
                                return;
                            }
                            if (test.ace === true) {
                                aceStore
                                    .codeOut
                                    .setValue(output);
                                aceStore
                                    .codeOut
                                    .clearSelection();
                            } else {
                                textarea.codeOut.value = output;
                            }
                        } else if (options.mode === "diff" && report.code.box !== null) {
                            buttons          = report
                                .code
                                .box
                                .getElementsByTagName("p")[0]
                                .getElementsByTagName("button");
                            if (options.diff_format === "json" && options.diff_rendered_html === false) {
                                const json:diffJSON = JSON.parse(output).diff,
                                    len:number = json.length,
                                    tab:string = (function dom_event_execute_app_renderOutput_diffTab():string {
                                        const tabout:string[] = [];
                                        let aa:number = options.indent_size;
                                        do {
                                            tabout.push(options.indent_char);
                                            aa = aa - 1;
                                        } while (aa > 0);
                                        return tabout.join("");
                                    }()),
                                    json_output:string[] = [`{"diff": [`];
                                    let a:number = 0;
                                do {
                                    if (json[a][0] === "r") {
                                        json_output.push(`${tab}["${json[a][0]}", "${json[a][1].replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}", "${json[a][2].replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"],`);
                                    } else {
                                        json_output.push(`${tab}["${json[a][0]}", "${json[a][1].replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"],`);
                                    }
                                    a = a + 1;
                                } while (a < len);
                                json_output[json_output.length - 1] = json_output[json_output.length - 1].replace(/\],$/, "]");
                                json_output.push("]}");
                                output = `<textarea>${json_output.join("\n")}</textarea>`;
                            }
                            if (options.complete_document === true || options.diff_rendered_html === true) {
                                output = `<textarea>${sanitize(output)}</textarea>`;
                            }
                            report.code.body.innerHTML = `<p>${langtext()}</p><p><strong>Execution time:</strong> <em>${meta.time}</em></p>${output}`;
                            if ((autolang === true || autolexer === true) && report.code.body.firstChild !== null) {
                                if (report.code.body.firstChild.nodeType > 1) {
                                    report
                                        .code
                                        .body
                                        .removeChild(report.code.body.firstChild);
                                }
                            }
                            let textarea:HTMLTextAreaElement = report.code.body.getElementsByTagName("textarea")[0];
                            if (textarea === undefined) {
                                diffList = report
                                    .code
                                    .body
                                    .getElementsByTagName("ol");
                                if (diffList.length > 0) {
                                    const cells:HTMLCollectionOf<HTMLLIElement> = diffList[0].getElementsByTagName("li"),
                                        len:number   = cells.length;
                                    let a:number     = 0;
                                    do {
                                        if (cells[a].getAttribute("class") === "fold") {
                                            cells[a].onclick = method.event.difffold;
                                        }
                                        a = a + 1;
                                    } while (a < len);
                                }
                                if (options.diff_view === "sidebyside" && diffList.length > 3) {
                                    diffList[2].onmousedown  = method.event.colSliderGrab;
                                    diffList[2].ontouchstart = method.event.colSliderGrab;
                                }
                            } else {
                                textarea.style.height = `${(report.code.body.clientHeight - 140) / 12}em`;
                            }
                        } else if (options.mode === "minify" || options.mode === "parse") {
                            if (test.ace === true) {
                                aceStore
                                    .codeOut
                                    .setValue(output);
                                aceStore
                                    .codeOut
                                    .clearSelection();
                            } else {
                                textarea.codeOut.value = output;
                            }
                        }
                        if (ann !== null) {
                            if (errortext.indexOf("end tag") > 0 || errortext.indexOf("Duplicate id") > 0) {
                                ann.setAttribute("class", "error");
                                ann.innerHTML = sanitize(errortext);
                            } else if (id("jserror") !== null) {
                                ann.removeAttribute("class");
                                ann.innerHTML = `<strong>${id("jserror")
                                    .getElementsByTagName("strong")[0]
                                    .innerHTML}</strong> <span>See 'Code Report' for details</span>`;
                            } else {
                                ann.innerHTML = langtext();
                                if (options.mode === "parse" && options.parse_format !== "htmltable") {
                                    pdlang = "tokens";
                                } else {
                                    pdlang = "characters";
                                }
                                if (prettydiff.sparser.parseerror !== "" && ann !== null) {
                                    ann.innerHTML = `${ann.innerHTML}<span><strong>Parse Error:</strong> ${sanitize(prettydiff.sparser.parseerror)}</span>`;
                                } else if (meta.error === "" || meta.error === undefined) {
                                    ann.innerHTML = `${ann.innerHTML}<span><em>Execution time:</em> <strong>${sanitize(meta.time)}</strong>. <em>Output size:</em> <strong>${commanumb(meta.outsize)} ${pdlang}</strong></span>`;
                                } else {
                                    ann.innerHTML = `${ann.innerHTML}<span><strong>${sanitize(meta.error)}</strong></span>`;
                                }
                            }
                        }
                        buttons = report
                            .code
                            .box
                            .getElementsByTagName("p")[0]
                            .getElementsByTagName("button");
                        if (chromeSave === true) {
                            buttons[0].click();
                        }
                        parent = <HTMLElement>buttons[1].parentNode;
                        if (parent.style.display === "none" && (options.mode === "diff" || (options.mode === "beautify" && options.jsscope === "report" && lang[1] === "javascript"))) {
                            buttons[1].click();
                        }
                    };
                data.langvalue = lang;

                if (options.mode === "diff") {
                    if (prettydiff.beautify[options.lexer] === undefined && options.lexer !== "auto" && options.lexer !== "text") {
                        if (ann !== null) {
                            ann.innerHTML = `Library <em>prettydiff.beautify.${options.lexer}</em> is <strong>undefined</strong>.`;
                        }
                        options.language = "text";
                    }
                    let diffmeta = {
                        differences: 0,
                        lines: 0
                    };
                    meta.insize = options.source.length + options.diff.length;
                    output = prettydiff(diffmeta);
                    meta.difftotal = diffmeta.differences;
                    meta.difflines = diffmeta.lines;
                } else {
                    meta.insize = options.source.length;
                    output = prettydiff();
                    if (output.indexOf("Error: ") === 0) {
                        ann.innerHTML = output.replace("Error: ", "");
                        output = options.source;
                    }
                }
                renderOutput();
            };

        meta.error   = "";
        options.api  = "dom";
        options.crlf = (lf !== null && lf.checked === true);
        if (typeof event === "object" && event !== null && event.type === "keyup") {
            // jsscope does not get the convenience of keypress execution, because its
            // overhead is costly do not execute keypress from alt, home, end, or arrow keys
            if ((textout === false && options.mode === "beautify") || event.altKey === true || event.keyCode === 16 || event.keyCode === 18 || event.keyCode === 35 || event.keyCode === 36 || event.keyCode === 37 || event.keyCode === 38 || event.keyCode === 39 || event.keyCode === 40) {
                return false;
            }
            if (test.keypress === true) {
                if (test.keystore.length > 0) {
                    test
                        .keystore
                        .pop();
                    if (event.keyCode === 17 || event.ctrlKey === true || event.keyCode === 224) {
                        test.keypress = false;
                        test.keystore = [];
                    } else {
                        if (test.keystore.length === 0) {
                            test.keypress = false;
                        }
                        return false;
                    }
                }
            }
            if ((event.keyCode === 17 || event.ctrlKey === true || event.keyCode === 224) && test.keypress === true && test.keystore.length === 0) {
                test.keypress = false;
                return false;
            }
        }
        if (test.ace === true) {
            options.source = aceStore.codeIn.getValue();
        } else {
            options.source = textarea.codeIn.value;
        }
        if (options.source === undefined || options.source === "") {
            if (ann !== null) {
                ann.innerHTML = "No source sample to process.";
            }
            return false;
        }
        if (test.store === true) {
            if (options.source.length > 4800000) {
                // eslint-disable-next-line
                console.warn("Source sample too large to save in browser localStorage.");
            } else {
                localStorage.setItem("source", options.source);
            }
        }

        //gather updated dom nodes
        {
            const li:HTMLCollectionOf<HTMLLIElement> = id("addOptions").getElementsByTagName("li"),
                reg:RegExp = (/option-((true-)|(false-))?/);
            let a:number = li.length,
                select:HTMLSelectElement,
                input:HTMLInputElement,
                opt:HTMLOptionElement;
            do {
                a = a - 1;
                if (li[a].getElementsByTagName("div")[0].style.display === "none") {
                    select = li[a].getElementsByTagName("select")[0];
                    if (select === undefined) {
                        input = li[a].getElementsByTagName("input")[0];
                        if (input.getAttribute("type") === "radio") {
                            if (input.value === "false" && input.checked === true) {
                                options[input.getAttribute("id").replace(reg, "")] = false;
                            } else if (input.value === "false" && input.checked === false) {
                                options[input.getAttribute("id").replace(reg, "")] = true;
                            } else if (input.value === "true" && input.checked === true) {
                                options[input.getAttribute("id").replace(reg, "")] = true;
                            } else if (input.value === "true" && input.checked === false) {
                                options[input.getAttribute("id").replace(reg, "")] = false;
                            }
                        } else {
                            if (input.getAttribute("data-type") === "number") {
                                options[input.getAttribute("id").replace(reg, "")] = Number(input.value);
                            } else {
                                options[input.getAttribute("id").replace(reg, "")] = input.value;
                            }
                        }
                    } else {
                        opt = <HTMLOptionElement>select[select.selectedIndex];
                        options[select.getAttribute("id").replace(reg, "")] = opt.value;
                    }
                }
            } while (a > 0);
        }
        if (options.language === "") {
            options.language = "auto";
        }
        if (options.language === "auto") {
            autolang = true;
        }
        if (options.lexer === "auto") {
            autolexer = true;
        }
        if (test.ace === true) {
            options.source = aceStore.codeIn.getValue();
        } else {
            options.source = textarea.codeIn.value;
        }
        if (domain.test(options.source) === true) {
            const filetest:boolean       = (options.source.indexOf("file:///") === 0),
                protocolRemove:string = (filetest === true)
                    ? options
                        .source
                        .split(":///")[1]
                    : options
                        .source
                        .split("://")[1],
                slashIndex:number     = (protocolRemove !== undefined)
                    ? protocolRemove.indexOf("/")
                    : 0,
                xhr:XMLHttpRequest            = new XMLHttpRequest();
            if ((slashIndex > 0 || options.source.indexOf("http") === 0) && typeof protocolRemove === "string" && protocolRemove.length > 0) {
                requests = true;
                xhr.onreadystatechange = function dom_event_execute_xhrSource_statechange() {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200 || xhr.status === 0) {
                            options.source = xhr
                                .responseText
                                .replace(/\r\n/g, "\n");
                            if (options.mode !== "diff" || requestd === false || (requestd === true && completed === true)) {
                                if (test.ace === true) {
                                    lang = method
                                        .app
                                        .langkey({
                                            sample: aceStore.codeIn.getValue(),
                                            name: "auto"
                                        });
                                } else {
                                    lang = method
                                        .app
                                        .langkey({
                                            sample: options.source,
                                            name: "auto"
                                        });
                                }
                                app();
                                return;
                            }
                            completes = true;
                        } else {
                            options.source = "Error: transmission failure receiving source code from address.";
                        }
                    }
                };
                if (filetest === true) {
                    xhr.open("GET", options.source.replace(/(\s*)$/, "").replace(/%26/g, "&").replace(/%3F/, "?"), true);
                } else {
                    xhr.open("GET", `proxy.php?x=${options.source.replace(/(\s*)$/, "").replace(/%26/g, "&").replace(/%3F/, "?")}`, true);
                }
                xhr.send();
            }
        }
        if (options.mode === "diff") {
            if (id("inputlabel") !== null) {
                options.source_label = id("inputlabel").value;
            }
            if (id("outputlabel") !== null) {
                options.diff_label = id("outputlabel").value;
            }
            if (test.ace === true) {
                options.diff = aceStore.codeOut.getValue();
            } else {
                options.diff = textarea.codeOut.value;
            }
            if (options.diff === undefined || options.diff === "") {
                return false;
            }
            if (test.store === true) {
                localStorage.setItem("diff", options.diff);
            }
            if (options.language === "text" || options.lexer === "text") {
                options.language = "text";
                options.lexer = "text";
                options.language_name = "Plain Text";
                autolang = false;
                autolexer = false;
            }
            if (test.ace === true) {
                options.diff = aceStore.codeOut.getValue();
            } else {
                options.diff = textarea.codeOut.value;
            }
            if (domain.test(options.diff) === true) {
                const filetest:boolean       = (options.diff.indexOf("file:///") === 0),
                    protocolRemove:string = (filetest === true)
                        ? options
                            .diff
                            .split(":///")[1]
                        : options
                            .diff
                            .split("://")[1],
                    slashIndex:number     = (protocolRemove !== undefined)
                        ? protocolRemove.indexOf("/")
                        : 0,
                    xhr:XMLHttpRequest            = new XMLHttpRequest();
                if ((slashIndex > 0 || options.diff.indexOf("http") === 0) && typeof protocolRemove === "string" && protocolRemove.length > 0) {
                    requestd = true;
                    xhr.onreadystatechange = function dom_event_execute_xhrSource_statechange() {
                        if (xhr.readyState === 4) {
                            if (xhr.status === 200 || xhr.status === 0) {
                                options.diff = xhr
                                    .responseText
                                    .replace(/\r\n/g, "\n");
                                if (requests === false || (requests === true && completes === true)) {
                                    app();
                                    return;
                                }
                                completed = true;
                            } else {
                                options.diff = "Error: transmission failure receiving diff code from address.";
                            }
                        }
                    };
                    if (filetest === true) {
                        xhr.open("GET", options.diff.replace(/(\s*)$/, "").replace(/%26/g, "&").replace(/%3F/, "?"), true);
                    } else {
                        xhr.open("GET", `proxy.php?x=${options.diff.replace(/(\s*)$/, "").replace(/%26/g, "&").replace(/%3F/, "?")}`, true);
                    }
                    xhr.send();
                }
            }
        } else {
            if (ann !== null) {
                if (options.language === "text") {
                    ann.innerHTML = "The value of <em>options.language</em> is <strong>text</strong> but <em>options.mode</em> is not <strong>diff</strong>.";
                } else if (options.lexer === "text") {
                    ann.innerHTML = "The value of <em>options.lexer</em> is <strong>text</strong> but <em>options.mode</em> is not <strong>diff</strong>.";
                }
            }
        }
        if (requests === false && requestd === false) {
            if (langvalue === "auto") {
                if (test.ace === true) {
                    lang = method
                        .app
                        .langkey({
                            sample: aceStore.codeIn.getValue(),
                            name: "auto"
                        });
                } else {
                    lang = method
                        .app
                        .langkey({
                            sample: id("input").value,
                            name: "auto"
                        });
                }
            } else {
                lang = method.app.langkey({
                    sample: "",
                    name: langvalue
                });
            }
            app();
        }
    };
    // this function allows typing of tab characters into textareas without the
    // textarea loosing focus
    method.event.fixtabs = function dom_event_fixtabs(event:KeyboardEvent, node:HTMLInputElement):boolean {
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
        node.value          = `${start}\t${end}`;
        node.selectionStart = sel + 1;
        node.selectionEnd   = sel + 1;
        event.preventDefault();
        return false;
    };
    //basic drag and drop for the report windows references events: minimize
    method.event.grab = function dom_event_grab(event:Event):boolean {
        const x:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target,
            box:HTMLElement        = (x.nodeName.toLowerCase() === "h3")
                ? <HTMLElement>x.parentNode
                : <HTMLElement>x.parentNode.parentNode,
            parent:HTMLElement     = box.getElementsByTagName("p")[0],
            save:boolean       = (parent.innerHTML.indexOf("save") > -1),
            minifyTest:boolean = (parent.style.display === "none"),
            buttons:HTMLCollectionOf<HTMLButtonElement>    = box
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
            filled:boolean     = ((box === report.stat.box && test.filled.stat === true) || (box === report.feed.box && test.filled.feed === true) || (box === report.code.box && test.filled.code === true)),    
            drop       = function dom_event_grab_drop(e:Event):boolean {
                const headingWidth = box.getElementsByTagName("h3")[0].clientWidth,
                    idval   = box.getAttribute("id").replace("report", "");
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
                    box.style.top = `${(max / 10) - 4}em`;
                } else {
                    box.style.top = `${boxTop / 10}em`;
                }
                if (boxLeft < ((headingWidth * -1) + 40)) {
                    box.style.left = `${((headingWidth * -1) + 40) / 10}em`;
                }
                data.settings.report[idval].top    = boxTop;
                data.settings.report[idval].left   = boxLeft;
                body.style.opacity = "1";
                box.style.height   = "auto";
                heading.style.top  = "100%";
                resize.style.top   = "100%";
                method
                    .app
                    .options(e);
                e.preventDefault();
                return false;
            },
            boxmoveTouch    = function dom_event_grab_touch(f:TouchEvent):boolean {
                f.preventDefault();
                box.style.right = "auto";
                box.style.left      = `${(boxLeft + (f.touches[0].clientX - touchX)) / 10}em`;
                box.style.top       = `${(boxTop + (f.touches[0].clientY - touchY)) / 10}em`;
                document.ontouchend = drop;
                return false;
            },
            boxmoveClick = function dom_event_grab_click(f:MouseEvent):boolean {
                f.preventDefault();
                box.style.right = "auto";
                box.style.left     = `${(boxLeft + (f.clientX - mouseX)) / 10}em`;
                box.style.top      = `${(boxTop + (f.clientY - mouseY)) / 10}em`;
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
            minButton.click();
            return false;
        }
        method
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
        heading.style.top  = `${box.clientHeight / 20}0em`;
        box.style.height   = ".1em";
        resize.style.top   = `${(Number(body.style.height.replace("em", "")) + 5.45) / 1.44}em`;
        if (touch === true) {
            document.ontouchmove  = boxmoveTouch;
            document.ontouchstart = null;
        } else {
            document.onmousemove = boxmoveClick;
            document.onmousedown = null;
        }
        method
            .app
            .options(event);
        return false;
    };
    //tests if a key press is a short command
    method.event.keydown = function dom_event_keydown(event:KeyboardEvent):void {
        if (test.keypress === true && (test.keystore.length === 0 || event.keyCode !== test.keystore[test.keystore.length - 1]) && event.keyCode !== 17 && event.keyCode !== 224) {
            test
                .keystore
                .push(event.keyCode);
        }
        if (event.keyCode === 17 || event.ctrlKey === true || event.keyCode === 224) {
            test.keypress = true;
        }
    };
    //maximize report window to available browser window
    method.event.maximize = function dom_event_maximize(event:Event):void {
        let node:HTMLElement = <HTMLElement>event.srcElement || <HTMLElement>event.target,
            parent:HTMLElement,
            save:boolean    = false,
            box:HTMLElement,
            idval:string      = "",
            heading:HTMLElement,
            body:HTMLElement,
            top:number,
            left:number,
            buttons:HTMLCollectionOf<HTMLButtonElement>,
            resize:HTMLButtonElement,
            textarea:HTMLCollectionOf<HTMLTextAreaElement>;
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
        idval   = box.getAttribute("id").replace("report", "");
        heading = box.getElementsByTagName("h3")[0];
        body    = box.getElementsByTagName("div")[0];
        method
            .app
            .zTop(box);

        //maximize
        if (node.innerHTML === "\u2191") {
            node.innerHTML = "\u2193";
            node.setAttribute("title", "Return this dialogue to its prior size and location.");
            data.settings.report[idval].max = true;
            data.settings.report[idval].min = false;
            if (test.store === true) {
                localStorage.setItem("settings", JSON.stringify(data.settings));
            }
            data.settings.report[idval].top    = box.offsetTop;
            data.settings.report[idval].left   = box.offsetLeft;
            data.settings.report[idval].height = body.clientHeight - 36;
            data.settings.report[idval].width  = body.clientWidth - 3;
            data.settings.report[idval].zindex = box.style.zIndex;
            box.style.top               = `${top / 10}em`;
            box.style.left              = `${left / 10}em`;
            if (typeof window.innerHeight === "number") {
                body.style.height = `${(window.innerHeight / 10) - 5.5}em`;
                if (save === true) {
                    heading.style.width = `${(window.innerWidth / 10) - 13.76}em`;
                } else {
                    heading.style.width = `${(window.innerWidth / 10) - 10.76}em`;
                }
                body.style.width = `${(window.innerWidth / 10) - 4.1}em`;
            }
            resize.style.display = "none";

            //return to normal size
        } else {
            data.settings.report[idval].max = false;
            node.innerHTML              = "\u2191";
            node.setAttribute("title", "Maximize this dialogue to the browser window.");
            box.style.top  = `${data.settings.report[idval].top / 10}em`;
            box.style.left = `${data.settings.report[idval].left / 10}em`;
            if (save === true) {
                heading.style.width = `${(data.settings.report[idval].width / 10) - 9.76}em`;
            } else {
                heading.style.width = `${(data.settings.report[idval].width / 10) - 6.76}em`;
            }
            body.style.width     = `${data.settings.report[idval].width / 10}em`;
            body.style.height    = `${data.settings.report[idval].height / 10}em`;
            box.style.zIndex     = data.settings.report[idval].zindex;
            resize.style.display = "block";
            method
                .app
                .options(event);
        }
        textarea = body.getElementsByTagName("textarea");
        if (textarea.length === 1) {
            textarea[0].style.height = `${(body.clientHeight - 140) / 12}em`;
        }
    };
    //minimize report windows to the default size and location
    method.event.minimize = function dom_event_minimize(e:Event):boolean {
        const node:HTMLElement = <HTMLElement>e.srcElement || <HTMLElement>e.target,
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
                        body.style.width    = `${width}em`;
                        body.style.height   = `${height}em`;
                        heading.style.width = `${width - saveSpace}em`;
                        box.style.left      = `${left}em`;
                        box.style.top       = `${top}em`;
                        if (width + incW < widthTarget || height + incH < heightTarget) {
                            setTimeout(dom_event_minimize_growth_grow, 1);
                        } else {
                            box.style.left      = `${leftTarget}em`;
                            box.style.top       = `${topTarget}em`;
                            body.style.width    = `${widthTarget}em`;
                            body.style.height   = `${heightTarget}em`;
                            heading.style.width = `${widthTarget - saveSpace}em`;
                            method
                                .app
                                .options(e);
                            if (textarea.length === 1) {
                                textarea[0].style.display = "block";
                                textarea[0].style.height = `${(body.clientHeight - 140) / 12}em`;
                            }
                            return false;
                        }
                        return true;
                    };
                method
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
                if (test.agent.indexOf("macintosh") > 0) {
                    saveSpace = (save === true)
                        ? 8
                        : 5;
                }
                if (typeof data.settings.report[idval].left === "number") {
                    leftTarget   = (data.settings.report[idval].left / 10);
                    topTarget    = (data.settings.report[idval].top / 10);
                    widthTarget  = (data.settings.report[idval].width / 10);
                    heightTarget = (data.settings.report[idval].height / 10);
                } else {
                    top                    = top + 4;
                    data.settings.report[idval].left   = 200;
                    data.settings.report[idval].top    = (top * 10);
                    data.settings.report[idval].width  = 550;
                    data.settings.report[idval].height = 450;
                    leftTarget                  = 10;
                    topTarget                   = 2;
                    widthTarget                 = 55;
                    heightTarget                = 45;
                }
                widthTarget  = widthTarget - 0.3;
                heightTarget = heightTarget - 3.55;
                if (step === 1) {
                    box.style.left    = `${leftTarget}em`;
                    box.style.top     = `${topTarget}em`;
                    body.style.width  = `${widthTarget}em`;
                    body.style.height = `${heightTarget}em`;
                    heading.style.width    = `${widthTarget - saveSpace}em`;
                    body.style.right = "auto";
                    body.style.display = "block";
                    box.getElementsByTagName("p")[0].style.display = "block";
                    method
                        .app
                        .options(e);
                    if (textarea.length === 1) {
                        textarea[0].style.display = "block";
                        textarea[0].style.height = `${(body.clientHeight - 140) / 12}em`;
                    }
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
                        body.style.width    = `${width}em`;
                        heading.style.width = `${width}em`;
                        body.style.height   = `${height}em`;
                        box.style.left      = `${left}em`;
                        box.style.top       = `${top}em`;
                        if (width - incW > 16.8) {
                            setTimeout(dom_event_minimize_shrinkage_shrink, 1);
                        } else {
                            box.style.left      = "auto";
                            box.style.top       = "auto";
                            box.style.right     = `${final}em`;
                            data.settings.report[idval].max = false;
                            body.style.display  = "none";
                            heading.getElementsByTagName("button")[0].style.cursor = "pointer";
                            heading.style.margin                                   = "-0.1em 0em -3.2em -0.1em";
                            box.style.zIndex                                            = "2";
                            method
                                .app
                                .options(e);
                            return false;
                        }
                        return true;
                    };
                parentNode = <HTMLElement>box.parentNode;
                incT = (((parentNode.offsetTop / 10) - top) / step);
                buttonMin.innerHTML = "\u2191";
                if (textarea.length === 1) {
                    textarea[0].style.display = "none";
                }
                //if a maximized window is minimized
                if (buttonMax.innerHTML === "\u2191") {
                    if (test.agent.indexOf("macintosh") > 0) {
                        data.settings.report[idval].top    = box.offsetTop;
                        data.settings.report[idval].left   = box.offsetLeft;
                        data.settings.report[idval].height = body.clientHeight - 17;
                        data.settings.report[idval].width  = body.clientWidth - 17;
                    } else {
                        data.settings.report[idval].top    = box.offsetTop;
                        data.settings.report[idval].left   = box.offsetLeft;
                        data.settings.report[idval].height = body.clientHeight;
                        data.settings.report[idval].width  = body.clientWidth;
                    }
                    if (data.zIndex > 2) {
                        data.zIndex      = data.zIndex - 3;
                        parent.style.zIndex = data.zIndex;
                    }
                } else {
                    buttonMax.innerHTML         = "\u2191";
                    data.settings.report[idval].top    = data.settings.report[idval].top + 1;
                    data.settings.report[idval].left   = data.settings.report[idval].left - 7;
                    data.settings.report[idval].height = data.settings.report[idval].height + 35.5;
                    data.settings.report[idval].width  = data.settings.report[idval].width + 3;
                }
                parent.style.display = "none";
                shrink();
                return false;
            };
        let parent:HTMLElement = <HTMLElement>node.parentNode,
            parentNode:HTMLElement,
            box:HTMLElement,
            final:number    = 0,
            idval:string        = "",
            body:HTMLElement,
            heading:HTMLElement,
            buttons:HTMLCollectionOf<HTMLButtonElement>,
            save:boolean      = false,
            buttonMin:HTMLButtonElement,
            buttonMax:HTMLButtonElement,
            left:number      = 0,
            top:number       = 0,
            buttonRes:HTMLButtonElement,
            textarea:HTMLCollectionOf<HTMLTextAreaElement>,
            step:number      = (parent.style.display === "none" && (options.mode === "diff" || (options.mode === "beautify" && options.jsscope === "report" && options.lang === "javascript")))
                ? 1
                : 50;
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
        idval                   = box.getAttribute("id").replace("report", "");
        body                    = box.getElementsByTagName("div")[0];
        textarea                = body.getElementsByTagName("textarea");
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
        if (box === report.feed.box) {
            if (test.filled.feed === true) {
                step = 1;
            }
            final = 38.8;
        }
        if (box === report.code.box) {
            if (test.filled.code === true) {
                step = 1;
            }
            final = 19.8;
        }
        if (box === report.stat.box) {
            if (test.filled.stat === true) {
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
    };
    //toggles between modes
    method.event.modeToggle = function dom_event_modeToggle(mode:string):void {
        const commentString = function dom_event_modeToggle_commentString():void {
                const value:string = `mode: "${options.mode}"`;
                let a:number = data.commentString.length;
                if (a > 0) {
                    do {
                        a = a - 1;
                        if (data.commentString[a].indexOf("mode:") === 0) {
                            data.commentString[a] = value;
                            break;
                        }
                        if (data.commentString[a] < "mode:") {
                            data.commentString.splice(a, 0, value);
                            break;
                        }
                    } while (a > 0);
                } else {
                    data.commentString.push(value);
                }
                method.app.commentString();
            },
            cycleOptions = function dom_event_modeToggle_cycleOptions():void {
                const li:HTMLLIElement[] = id("addOptions").getElementsByTagName("li"),
                    lilen:number = li.length,
                    disable = function dom_event_modeToggle_cycleOptions_disable(parent:HTMLElement, enable:boolean):void {
                        const inputs:HTMLCollectionOf<HTMLInputElement> = parent.getElementsByTagName("input"),
                            sels:HTMLCollectionOf<HTMLSelectElement> = parent.getElementsByTagName("select");
                        if (sels.length > 0) {
                            if (enable === true) {
                                sels[0].disabled = false;
                            } else {
                                sels[0].disabled = true;
                            }
                        } else {
                            if (enable === true) {
                                inputs[0].disabled = false;
                            } else {
                                inputs[0].disabled = true;
                            }
                            if (inputs.length > 1) {
                                if (enable === true) {
                                    inputs[1].disabled = false;
                                } else {
                                    inputs[1].disabled = true;
                                }
                            }
                        }
                    };
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
                            disable(li[a], false);
                        } else if (mode === "diff" && modeat !== "diff" && modeat !== "beautify") {
                            div.innerHTML = `This option is not available in mode '${mode}'.`;
                            div.style.display = "block";
                            disable(li[a], false);
                        } else {
                            div.style.display = "none";
                            disable(li[a], true);
                        }
                    }
                    a = a + 1;
                } while (a < lilen);
            },
            makeChanges = function dom_event_modeToggle_makeChanges():void {
                const text:string = mode.charAt(0).toUpperCase() + mode.slice(1),
                    ci:HTMLElement = id("codeInput"),
                    cilabel:HTMLCollectionOf<HTMLLabelElement> = ci.getElementsByTagName("label"),
                    input:HTMLTextAreaElement = id("input"),
                    output:HTMLTextAreaElement = id("output"),
                    outLabel:HTMLElement = <HTMLElement>ci.getElementsByClassName("inputLabel")[1],
                    sourceLabel:HTMLElement = id("inputlabel").parentNode,
                    outputLabel:HTMLElement = id("outputlabel").parentNode,
                    outputFile:HTMLElement = id("outputfile").parentNode;
                if (mode === "diff") {
                    ci.getElementsByTagName("h2")[0].innerHTML = "Compare Code";
                    cilabel[0].innerHTML = "Base File";
                    cilabel[2].innerHTML = "Compare code sample";
                    cilabel[5].innerHTML = " Compare new code"
                    outLabel.style.marginTop = "0";
                    sourceLabel.style.display = "block";
                    outputLabel.style.display = "block";
                    outputFile.style.display = "block";
                    id("slider").style.display = "none";
                    if (options.color === "white") {
                        output.style.background = "#fff";
                    } else if (options.color === "shadow") {
                        output.style.background = "transparent";
                    } else if (options.color === "canvas") {
                        output.style.background = "#f2f2f2";
                    }
                    input.onkeyup = null;
                    if (test.ace === true) {
                        aceStore.codeIn.onkeyup = null;
                        aceStore
                            .codeOut
                            .setReadOnly(false);
                        if (options.diff !== undefined && options.diff !== null) {
                            aceStore.codeOut.setValue(options.diff);
                        }
                        parent = <HTMLElement>output.parentNode;
                        parent.setAttribute("class", "output");
                    } else {
                        output.readOnly = false;
                        if (options.diff !== undefined) {
                            output.value = options.diff;
                        }
                        parent = <HTMLElement>output.parentNode.parentNode;
                        parent.setAttribute("class", "output");
                    }
                } else {
                    ci.getElementsByTagName("h2")[0].innerHTML = text;
                    cilabel[0].innerHTML = `${text} file`;
                    cilabel[2].innerHTML = `${text} code sample`;
                    cilabel[5].innerHTML = `${text} output`;
                    parent = <HTMLElement>document.getElementById("inputfile").parentNode;
                    outLabel.style.marginTop = `${(parent.clientHeight + 11.5) / 10}em`;
                    sourceLabel.style.display = "none";
                    outputLabel.style.display = "none";
                    outputFile.style.display = "none";
                    input.onkeyup = method.event.execute;
                    if (options.mode === "beautify") {
                        id("slider").style.display = "block";
                    } else {
                        id("slider").style.display = "none";
                    }
                    if (options.color === "white") {
                        output.style.background = "#f2f2f2";
                    } else if (options.color === "shadow") {
                        output.style.background = "#111";
                    } else if (options.color === "canvas") {
                        output.style.background = "#ccccc8";
                    }
                    if (test.ace === true) {
                        aceStore.codeOut.setValue("");
                        aceStore
                            .codeOut
                            .setReadOnly(true);
                        parent = <HTMLElement>output.parentNode;
                        parent.setAttribute("class", "readonly");
                    } else {
                        output.readOnly = true;
                        output.value = "";
                        parent = <HTMLElement>output.parentNode.parentNode;
                        parent.setAttribute("class", "readonly");
                    }
                }
            };
        let parent:HTMLElement;
        options.mode = mode;
        makeChanges();
        cycleOptions();
        commentString();
    };
    //reset tool to default configuration
    method.event.reset = function dom_event_reset():void {
        const comment:HTMLElement = id("commentString");
        let nametry:string  = "",
            name:string     = "";
        localStorage.setItem("source", "");
        localStorage.setItem("diff", "");
        localStorage.setItem("commentString", "[]");
        if (data.settings === undefined || data.settings.knownname === undefined) {
            if (data.settings === undefined) {
                data.settings = {
                    feedback: {
                        newb   : false,
                        veteran: false
                    }
                };
            }
            if (localStorage.getItem("settings") !== undefined && localStorage.getItem("settings") !== null) {
                nametry = JSON.stringify(localStorage.getItem("settings"));
            }
            if (localStorage.getItem("settings") === undefined || localStorage.getItem("settings") === null || nametry === "" || nametry.indexOf("knownname") < 0) {
                name = `"${Math
                    .random()
                    .toString()
                    .slice(2) + Math
                    .random()
                    .toString()
                    .slice(2)}"`;
            }
            data.settings.knownname = name;
        }
        if (data.settings.feedback === undefined) {
            data.settings.feedback = {
                newb   : false,
                veteran: false
            };
        }
        localStorage.setItem("settings", `{"feedback":{"newb":${data.settings.feedback.newb},"veteran":${data.settings.feedback.veteran}},"report":{"code":{},"feed":{},"stat":{}},"knownname":${data.settings.knownname}}`);
        data.commentString = [];
        if (comment !== null) {
            comment.innerHTML = "/*prettydiff.com \u002a/";
        }
        id("modediff").checked = true;
        location.reload();
    };
    //resize report window to custom width and height on drag
    method.event.resize = function dom_event_resize(e:MouseEvent):void {
        let bodyWidth:number  = 0,
            bodyHeight:number = 0;
        const node:HTMLElement = <HTMLElement>e.srcElement || <HTMLElement>e.target,
            parent:HTMLElement     = <HTMLElement>node.parentNode,
            save:boolean       = (parent.innerHTML.indexOf("save") > -1),
            box:HTMLElement        = <HTMLElement>parent.parentNode,
            body:HTMLDivElement       = box.getElementsByTagName("div")[0],
            offX:number = e.clientX,
            offY:number = e.clientY,
            heading:HTMLHeadingElement    = box.getElementsByTagName("h3")[0],
            mac:boolean        = (test.agent.indexOf("macintosh") > 0),
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
                method
                    .app
                    .options(e);
                document.onmouseup = null;
            },
            boxsize    = function dom_event_resize_boxsize(f:MouseEvent):void {
                body.style.width = `${(bodyWidth + ((f.clientX - offsetw) - offX)) / 10}em`;
                if (save === true) {
                    heading.style.width = `${((bodyWidth + (f.clientX - offX)) / 10) - 10.15}em`;
                } else {
                    heading.style.width = `${((bodyWidth + (f.clientX - offX)) / 10) - 7.15}em`;
                }
                body.style.height  = `${(bodyHeight + ((f.clientY - offseth) - offY)) / 10}em`;
                document.onmouseup = drop;
            };
        bodyWidth  = body.clientWidth,
        bodyHeight = body.clientHeight
        method
            .app
            .zTop(box);
        document.onmousemove = boxsize;
        document.onmousedown = null;
    };
    //tell the browser to "save as"
    method.event.save = function dom_event_save():void {
        let blob = new Blob([report.code.body.innerHTML], {type: "application/xhtml+xml;charset=utf-8"});
        prettydiff.saveAs(blob, "prettydiff.xhtml", {autoBom: true});
    };
    //analyzes combinations of consecutive key presses
    method.event.sequence = function dom_event_sequence(event:KeyboardEvent):void {
        let seq   = test.keysequence;
        const len   = seq.length,
            key   = event.keyCode;
        if (len === 0 || len === 1) {
            if (key === 38) {
                seq.push(true);
            } else {
                test.keysequence = [];
                seq = test.keysequence;
            }
        } else if (len === 2 || len === 3) {
            if (key === 40) {
                seq.push(true);
            } else {
                test.keysequence = [];
                seq = test.keysequence;
            }
        } else if (len === 4 || len === 6) {
            if (key === 37) {
                seq.push(true);
            } else {
                test.keysequence = [];
                seq = test.keysequence;
            }
        } else if (len === 5 || len === 7) {
            if (key === 39) {
                seq.push(true);
            } else {
                test.keysequence = [];
                seq = test.keysequence;
            }
        } else if (len === 8) {
            if (key === 66) {
                seq.push(true);
            } else {
                test.keysequence = [];
                seq = test.keysequence;
            }
        } else if (len === 9) {
            if (key === 65) {
                if (data.audio !== undefined) {
                    data
                        .audio
                        .play();
                }
                const body:HTMLBodyElement = document.getElementsByTagName("body")[0],
                    scroll:number = (document.documentElement.scrollTop > body.scrollTop)
                        ? document.documentElement.scrollTop
                        : body.scrollTop,
                    color:HTMLSelectElement  = id("option-color"),
                    max:number    = color
                        .getElementsByTagName("option")
                        .length - 1,
                    change = function dom_event_sequence_colorChange_change():void {
                        color.selectedIndex = ind;
                        method
                            .event
                            .colorScheme(event);
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
                document.documentElement.scrollTop = scroll;
                body.scrollTop = scroll;
            }
            test.keysequence = [];
        }
    };
    //intelligently raise the z-index of the report windows
    method.app.zTop     = function dom_app_top(x:HTMLElement):void {
        const indexListed = data.zIndex,
            indexes     = [
                (report.feed.box === null)
                    ? 0
                    : Number(report.feed.box.style.zIndex),
                (report.code.box === null)
                    ? 0
                    : Number(report.code.box.style.zIndex),
                (report.stat.box === null)
                    ? 0
                    : Number(report.stat.box.style.zIndex)
            ];
        let indexMax    = Math.max(indexListed, indexes[0], indexes[1], indexes[2]) + 1;
        if (indexMax < 11) {
            indexMax = 11;
        }
        data.zIndex = indexMax;
        if (x.nodeType === 1) {
            x.style.zIndex = String(indexMax);
        }
    };
    // prettydiff dom insertion start
    // prettydiff dom insertion end
    meta = prettydiff.meta;
    options = prettydiff.options;
    options.api = "dom";
    load();
}());
