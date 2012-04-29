/*global document, window, localStorage*/
/*
 jsGUI is a small JavaScript program to allow a Graphic User Interface.
 
 Visit the Github repo at https://github.com/austincheney/jsgui
 
 MIT License - http://www.opensource.org/licenses/mit-license.php
 Copyright (C) 2011  Austin Cheney - austin.cheney@us.army.mil

 Permission is hereby granted, free of charge, to any person obtaining a
 copy of this software and associated documentation files (the
 "Software"), to deal in the Software without restriction, including
 without limitation the rights to use, copy, modify, merge, publish,
 distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to
 the following conditions:

 The above copyright notice and this permission notice shall be included
 in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var $ = function (x, y) {
        "use strict";
        if (typeof document.getElementById === "undefined") {
            return;
        }
        if (typeof y === "undefined" || typeof y.innerHTML === "undefined") {
            return document.getElementById(x);
        } else {
            return y.getElementById(x);
        }
    },
    _ = function (x, y) {
        "use strict";
        if (typeof document.getElementsByTagName === "undefined") {
            return;
        }
        if (typeof y === "undefined" || typeof y.innerHTML === "undefined") {
            return document.getElementsByTagName(x);
        } else {
            return y.getElementsByTagName(x);
        }
    },
    install = {},
    gui = {
        q: -1,
        zindex: 10,
        logging: true,
        l: $("license"),
        x: $("dashboard"),
        y: $("panellist"),
        z: $("console"),
        license: function () {
            "use strict";
            gui.l.style.display = "none";
            if (typeof localStorage !== "undefined") {
                localStorage.setItem("guiLicense", "agreed");
            }
        },
        clock: function () {
            "use strict";
            var date = new Date(),
                hour = String(date.getHours()),
                minute = String(date.getMinutes()),
                second = String(date.getSeconds()),
                ms = String(date.getMilliseconds()),
                time = [];
            if (hour.length === 1) {
                hour = "0" + hour;
            }
            if (minute.length === 1) {
                minute = "0" + minute;
            }
            if (second.length === 1) {
                second = "0" + second;
            }
            if (ms.length === 1) {
                ms = "00" + ms;
            } else if (ms.length === 2) {
                ms = "0" + ms;
            }
            time.push(hour);
            time.push(":");
            time.push(minute);
            time.push(":");
            time.push(second);
            time.push(".");
            time.push(ms);
            return time.join("");
        },
        clearConsole: function () {
            "use strict";
            if (gui.z !== null && typeof gui.z === "object") {
                gui.z.innerHTML = "";
            }
        },
        logConsole: function (cause, x) {
            "use strict";
            var a = (x.innerHTML === "") ? "" : _("h3", x)[0].innerHTML,
                build = ["<li>"];
            build.push(gui.clock());
            build.push(" &mdash; ");
            build.push(a);
            switch (cause) {
            case "new":
                build.push(" opened");
                break;
            case "focus":
                build.push(" gained focus");
                break;
            case "close":
                build.push(" closed");
                break;
            case "minimize":
                build.push(" minimized");
                break;
            case "maximize":
                build.push(" maximized");
                break;
            case "normalize":
                build.push(" returned to prior size");
                break;
            case "resize":
                build.push(" resized to ");
                build.push(x.clientWidth / 10);
                build.push("em wide and ");
                build.push(x.clientHeight / 10);
                build.push("em tall");
                break;
            case "move":
                build.push(" moved to ");
                build.push(x.offsetLeft / 10);
                build.push("em left and ");
                build.push(x.offsetTop / 10);
                build.push("em down in the dashboard");
                break;
            default:
                build.push(cause);
                break;
            }
            build.push("</li>");
            build.push(gui.z.innerHTML);
            gui.z.innerHTML = build.join("");
        },
        once: [],
        panel: function (properties, arg) {
            "use strict";
            (function () {
                if (typeof gui.x !== "object") {
                    return;
                }
                if (typeof properties.head !== "string" || properties.head === "head" || properties.head === "") {
                    properties.head = "panel-" + gui.q;
                }
                if (typeof properties.customStyle !== "string") {
                    properties.customStyle = "";
                }
                if (typeof properties.once !== "string") {
                    properties.once = "";
                }
            }());
            var panel,
                buttons = properties.buttons,
                head = properties.head,
                body = properties.body,
                build = ["<p class='buttons'>"],
                list = [],
                textarea = false,
                minimize = "<button class='minimize' onclick='gui.minimize(this);' title='Minimize this panel to the panel list.'><span>&#8615;</span></button>",
                maximize = "<button class='maximize' onclick='gui.maximize(this);' title='Maximize this panel to the browser.'><span>&uarr;</span></button>",
                close = "<button class='close' onclick='gui.close(this, \"" + properties.once + "\");' title='Purge this panel.'><span>&times;</span></button>",
                resize = "<button class='resize' onmousedown='gui.resize(event, this);' title='Resize this panel.'><span>&harr;</span></button>",
                common = minimize + maximize + close + resize,
                a,
                b,
                c,
                d,
                e;
            if (properties.textarea || (/^(\s*<textarea)/.test(body) && /(<\/textarea>)$/.test(body))) {
                textarea = true;
            }
            if (properties.once !== "") {
                c = gui.once.length;
                for (d = 0; d < c; d += 1) {
                    if (gui.once[d] === properties.once) {
                        gui.top($(properties.once));
                        return;
                    }
                }
                gui.once.push(properties.once.replace(/\,/g, ""));
            }
            a = _("span", gui.x);
            b = a.length;
            gui.q += 1;
            if (typeof buttons === "object" || typeof buttons === "array") {
                d = buttons.length;
                for (c = 0; c < d; c += 1) {
                    if (buttons[c] === "resize" || buttons[c] === resize) {
                        d -= 1;
                        if (buttons[c] === "resize") {
                            buttons[c] = resize;
                        }
                    } else if (buttons[c] === "minimize") {
                        buttons[c] = minimize;
                    } else if (buttons[c] === "maximize") {
                        buttons[c] = maximize;
                    } else if (buttons[c] === "close") {
                        buttons[c] = close;
                    }
                }
                d += 1;
                d = (d * 3) + 2.3;
                d = " style='width: " + d + "em'";
            } else {
                buttons = common;
                d = "";
            }
            gui.zindex += 1;
            panel = document.createElement("div");
            if (properties.customStyle && (/^(\s+)$/).test(properties.customStyle) === false) {
                panel.setAttribute("class", "box " + properties.customStyle);
            } else {
                panel.setAttribute("class", "box");
            }
            if (properties.once !== "") {
                panel.setAttribute("id", properties.once);
                e = properties.once;
            } else {
                e = "panel-" + gui.q;
                panel.setAttribute("id", e);
            }
            panel.setAttribute("style", "z-index:" + gui.zindex);
            build.push(buttons);
            build.push("<h3 class='gui-heading' onmousedown='gui.move(event, this);'");
            build.push(d);
            build.push(" title='Grab this title element to move this panel around the screen.'><span onmousedown='return false;'>");
            build.push(head);
            build.push("</span></h3> ");
            if (textarea) {
                build.push(body);
            } else {
                build.push("<div class='gui-body' id='win-body");
                build.push(gui.q);
                build.push("' style='font-size:1em'>");
                build.push(body);
                build.push("</div> ");
            }
            build.push("<span class='gui-disabled' style='display:none' onclick='gui.top(this.parentNode)'></span>");
            if (gui.y !== null && typeof gui.y === "object") {
                list.push(gui.y.innerHTML.replace(/ class\=("|')active("|')/g, ""));
                list.push("<li class='active' onclick='gui.plAction(\"" + e + "\")' id='list");
                if (e.substring(0, 6) === "panel-") {
                    list.push(gui.q);
                } else {
                    list.push(e);
                }
                list.push("'>");
                list.push(head);
                list.push("</li>");
                gui.y.innerHTML = list.join("");
                gui.y.parentNode.style.zIndex = gui.zindex + 1;
            }
            b = a.length;
            for (c = 0; c < b; c += 1) {
                if (a[c].getAttribute("class") === "gui-disabled") {
                    a[c].style.display = "block";
                }
            }
            build = build.join("");
            if (typeof arg === "string") {
                build = build.replace(/jsguibodyarg/g, arg);
            }
            panel.innerHTML = build;
            gui.x.insertBefore(panel, null);
            if (gui.logging && gui.z !== null && typeof gui.z === "object") {
                gui.logConsole("new", $(e));
            }
            gui.state("dashboard");
        },
        autotop: function (x) {
            "use strict";
            var a,
                b,
                c,
                d = 0,
                e,
                f;
            if (gui.y !== null && typeof gui.y === "object" && /class\=("|')active/.test(gui.y.innerHTML) === false) {
                a = gui.x;
                b = _("div", a);
                c = b.length;
                for (f = 0; f < c; f += 1) {
                    if (b[f].parentNode === a && Number(b[f].style.zIndex) > d && b[f] !== x && b[f].style.display !== "none") {
                        e = f;
                        d = Number(b[f].style.zIndex);
                    }
                }
                if (typeof e === "number") {
                    gui.top(b[e]);
                }
            }
        },
        top: function (x) {
            "use strict";
            var a = x.getAttribute("id"),
                b = _("button", _("p", x)[0]),
                c = b.length,
                d,
                e,
                f;
            if (x.innerHTML === "") {
                return;
            }
            gui.zindex += 1;
            for (d = 0; d < c; d += 1) {
                if (b[d].getAttribute("class") === "maximize") {
                    break;
                }
            }
            if (a.substr(0, 4) === "list") {
                a = a.substr(4);
                x = $("panel-" + a);
                if (d !== c) {
                    b[d].innerHTML = "<span>\u2193</span>";
                }
                x.style.display = "block";
            } else {
                if (d !== c && b[d].innerHTML === "<span>\u2191</span>") {
                    if (/panel\-\d+/.test(a)) {
                        $("list" + a.substr(6)).removeAttribute("class");
                        f = "list" + a.substr(6);
                    } else {
                        $("list" + a).removeAttribute("class");
                        f = "list" + a;
                    }
                }
            }
            e = x.lastChild;
            x.style.zIndex = gui.zindex;
            b = _("span", gui.x);
            c = b.length;
            for (d = 0; d < c; d += 1) {
                if (b[d].getAttribute("class") === "gui-disabled") {
                    b[d].style.display = "block";
                }
            }
            if (e.getAttribute("class") === "gui-disabled") {
                e.style.display = "none";
            }
            if (gui.y !== null && typeof gui.y === "object") {
                gui.y.parentNode.style.zIndex = gui.zindex + 1;
                gui.y.innerHTML = gui.y.innerHTML.replace(/ class\=("|')active("|')/g, "");
                if (e) {
                    f = $(f);
                    if (f !== null && typeof f === "object") {
                        f.setAttribute("class", "active");
                    }
                }
            }
            if (e && e.style.display === "block" && gui.logging && typeof gui.z === "object") {
                gui.logConsole("focus", x);
            }
            gui.state("dashboard");
        },
        close: function (x, y) {
            "use strict";
            var a = x.parentNode.parentNode,
                b = a.getAttribute("id"),
                c,
                d;
            if (y) {
                c = gui.once.length;
                for (d = 0; d < c; d += 1) {
                    if (gui.once[d] === y) {
                        gui.once.splice(d, 1);
                    }
                }
            }
            if (gui.logging && gui.z !== null && typeof gui.z === "object") {
                gui.logConsole("close", a);
            }
            a.innerHTML = "";
            gui.x.removeChild(a);
            if (gui.y !== null && typeof gui.y === "object") {
                if (/panel\-\d+/.test(b)) {
                    d = $("list" + b.substr(6));
                    d.removeAttribute("class");
                } else {
                    d = $("list" + b);
                    d.removeAttribute("class");
                }
                gui.y.removeChild(d);
            }
            gui.state("dashboard");
            gui.autotop();
        },
        position: {},
        plAction: function (x) {
            "use strict";
            var a = $(x),
                b = _("button", _("p", a)[0]),
                c = b.length,
                d;
            for (d = 0; d < c; d += 1) {
                if (b[d].getAttribute("class") === "minimize") {
                    break;
                }
            }
            if (a.style.display === "none") {
                if (d !== c) {
                    b[d].innerHTML = "<span>\u21A7</span>";
                }
                a.style.display = "block";
                gui.top(a);
            } else {
                if (a.lastChild.style.display === "block") {
                    gui.top(a);
                } else {
                    if (d !== c) {
                        gui.minimize(b[d]);
                    }
                }
            }
        },
        minimize: function (x) {
            "use strict";
            var a = x.parentNode.parentNode,
                b = a.getAttribute("id"),
                c;
            if (/panel\-\d+/.test(b)) {
                c = $("list" + b.substr(6));
            } else {
                c = $("list" + b);
            }
            a.style.display = "none";
            c.removeAttribute("class");
            x.innerHTML = "<span>\u2191</span>";
            gui.state("dashboard");
            gui.autotop(a);
            if (gui.logging && gui.z !== null && typeof gui.z === "object") {
                gui.logConsole("minimize", a);
            }
        },
        fullsize: function (x, y, z) {
            "use strict";
            var a = _("div", x)[0] || _("textarea", x)[0],
                b = a.childNodes,
                c = b.length,
                d,
                e = a.clientWidth,
                f = a.clientHeight,
                g,
                h,
                i,
                j,
                k,
                dw,
                em = 1,
                ex = 1,
                bl = false,
                br = false,
                bb = false,
                bt = false,
                bw = false,
                pl = false,
                pr = false,
                pb = false,
                pt = false,
                pw = false,
                spr = 0,
                spw = 0,
                sbw = 0,
                total = 0,
                stotal = 0,
                property = function (w) {
                    var a;
                    w = w.replace(/^(\s+)/, "").replace(/rgba?\(([0-9]+(\.[0-9]+)?\,\s+)+[0-9]+(\.[0-9]+)?\)/, "").replace(/ \w+/g, "").replace(/#[0-9]+/, "").replace(/(\s+)$/, "").replace(/\s+/, " ");
                    if ((/(px|in|cm|mm|em|ex|pt|pc)$/).test(w)) {
                        a = w.charAt(w.length - 2) + w.charAt(w.length - 1);
                        switch (a) {
                        case "px":
                            w = parseInt(w, 10);
                            break;
                        case "em":
                            if (em === 1) {
                                b[d].innerHTML = b[d].innerHTML + "<div id='guidisttest1234' style='display:inline-block'>m</div>";
                                em = $("guidisttest1234").clientWidth;
                                b[d].innerHTML = b[d].innerHTML.replace(/(<div id\=("|')guidisttest1234("|') style\=("|')display:inline\-block("|')>m<\/div>)$/i, "");
                            }
                            w = Number(w.substr(0, w.length - 2)) * em;
                            break;
                        case "ex":
                            if (ex === 1) {
                                b[d].innerHTML = b[d].innerHTML + "<div id='guidisttest1234' style='display:inline-block'>x</div>";
                                ex = $("guidisttest1234").clientHeight;
                                b[d].innerHTML = b[d].innerHTML.replace(/(<div id\=("|')guidisttest1234("|') style\=("|')display:inline\-block("|')>x<\/div>)$/i, "");
                            }
                            w = Number(w.substr(0, w.length - 2)) * ex;
                            break;
                        default:
                            w = Number(w.substr(0, w.length - 2)) * 96;
                            switch (k) {
                            case "cm":
                                w = w * 2.54;
                                break;
                            case "mm":
                                w = w * 25.4;
                                break;
                            case "pt":
                                w = w / 72;
                                break;
                            case "pc":
                                w = w / 6;
                                break;
                            }
                        }
                        w = Math.round(w);
                    } else {
                        w = 0;
                    }
                    return w;
                };
            y = y * 10;
            z = z * 10;
            for (d = 0; d < c; d += 1) {
                if (b[d].getAttribute("class") !== null) {
                    g = b[d].getAttribute("class").replace(/\s+/g, " ").split(" ");
                    h = g.length;
                    j = b[d].getAttribute("style");
                    if (j === null || (!(/border(\-\w+)*:/).test(j) && !(/padding(\-\w+)*:/).test(j))) {
                        for (i = 0; i < h; i += 1) {
                            if (g[i].indexOf("guiFull") === 0) {
                                switch (g[i]) {
                                case "guiFullWidth":
                                    dw = b[d].clientWidth;
                                    if (e !== dw) {
                                        b[d].style.width = ((e - y) + dw) + "px";
                                    }
                                    break;
                                case "guiFullHeight":
                                    dw = b[d].clientHeight;
                                    if (f !== dw) {
                                        b[d].style.height = ((f - z) + dw) + "px";
                                    }
                                    break;
                                case "guiFullBoth":
                                    dw = b[d].clientWidth;
                                    if (e !== dw) {
                                        b[d].style.width = ((e - y) + dw) + "px";
                                    }
                                    dw = b[d].clientHeight;
                                    if (f !== dw) {
                                        b[d].style.height = ((f - z) + dw) + "px";
                                    }
                                    break;
                                }
                            }
                        }
                    } else {
                        j = j.replace(/\s+/g, " ").replace(/ ?; ?/g, ";").split(";");
                        k = j.length;
                        if ((/border(\-\w+)*:/).test(j)) {
                            for (i = 0; i < k; i += 1) {
                                if (j[i].indexOf("border-left") === 0) {
                                    bl = j[i].split(":")[1];
                                }
                                if (j[i].indexOf("border-right") === 0) {
                                    br = j[i].split(":")[1];
                                }
                                if (j[i].indexOf("border-bottom") === 0) {
                                    bb = j[i].split(":")[1];
                                }
                                if (j[i].indexOf("border-top") === 0) {
                                    bt = j[i].split(":")[1];
                                }
                                if (j[i].indexOf("border") === 0) {
                                    bw = j[i].split(":")[1];
                                }
                                if (j[i].indexOf("border-width") === 0) {
                                    bw = j[i].split(":")[1];
                                }
                            }
                        }
                        if ((/padding(\-\w+)*:/).test(j)) {
                            for (i = 0; i < k; i += 1) {
                                if (j[i].indexOf("padding-left") === 0) {
                                    pl = j[i].split(":")[1];
                                }
                                if (j[i].indexOf("padding-right") === 0) {
                                    pr = j[i].split(":")[1];
                                }
                                if (j[i].indexOf("padding-bottom") === 0) {
                                    pb = j[i].split(":")[1];
                                }
                                if (j[i].indexOf("padding-top") === 0) {
                                    pt = j[i].split(":")[1];
                                }
                                if (j[i].indexOf("padding") === 0) {
                                    pw = j[i].split(":")[1];
                                }
                            }
                        }
                        for (i = 0; i < h; i += 1) {
                            if (g[i].indexOf("guiFull") === 0) {
                                if (g[i] === "guiFullWidth") {
                                    dw = b[d].clientWidth;
                                    if (bl) {
                                        total += property(bl);
                                    }
                                    if (br) {
                                        total += property(br);
                                    }
                                    if (!bl && !br) {
                                        sbw = property(bw);
                                        if ((bl || br) && bw) {
                                            total = Math.abs(total - (sbw * 2));
                                        } else if (bw) {
                                            total += (sbw * 2);
                                        }
                                    }
                                    if (pl) {
                                        total += property(pl);
                                    }
                                    if (pr) {
                                        spr = property(pr);
                                        total += spr;
                                    }
                                    if (!pl && !pr) {
                                        spw = property(pw);
                                        if ((pl || pr) && pw) {
                                            total = Math.abs(total - (spw * 2));
                                        } else if (pw) {
                                            total += (spw * 2);
                                        }
                                    }
                                    total += b[d].offsetLeft;
                                    stotal = y - (dw + total);
                                    if (spr > 0) {
                                        stotal = Math.abs(stotal - spr);
                                    } else if (spw > 0) {
                                        stotal = Math.abs(stotal - spw);
                                    }
                                    total = Math.abs(total - stotal);
                                    b[d].style.width = (((e - y) - total) + dw) + "px";
                                    total = 0;
                                    stotal = 0;
                                    spr = 0;
                                } else if (g[i] === "guiFullHeight") {
                                    dw = b[d].clientHeight;
                                    if (bb) {
                                        total += property(bb);
                                    }
                                    if (bt) {
                                        total += property(bt);
                                    }
                                    if (!bb && !bt) {
                                        sbw = property(bw);
                                        if ((bb || bt) && bw) {
                                            total = Math.abs(total - (sbw * 2));
                                        } else if (bw) {
                                            total += (sbw * 2);
                                        }
                                    }
                                    if (pt) {
                                        total += property(pt);
                                    }
                                    if (pb) {
                                        spr = property(pb);
                                        total += spr;
                                    }
                                    if (!pb && !pt) {
                                        spw = property(pw);
                                        if ((pb || pt) && pw) {
                                            total = Math.abs(total - (spw * 2));
                                        } else if (pw) {
                                            total += (spw * 2);
                                        }
                                    }
                                    total += b[d].offsetTop;
                                    stotal = z - (dw + total);
                                    if (spr > 0) {
                                        stotal = Math.abs(stotal - spr);
                                    } else if (spw > 0) {
                                        stotal = Math.abs(stotal - spw);
                                    }
                                    total = Math.abs(total - stotal);
                                    b[d].style.height = (((f - z) - total) + dw) + "px";
                                    total = 0;
                                    stotal = 0;
                                    spr = 0;
                                    spw = 0;
                                    sbw = 0;
                                } else if (g[i] === "guiFullBoth") {
                                    dw = b[d].clientWidth;
                                    if (bl) {
                                        total += property(bl);
                                    }
                                    if (br) {
                                        total += property(br);
                                    }
                                    if (!bl && !br) {
                                        sbw = property(bw);
                                        if ((bl || br) && bw) {
                                            total = Math.abs(total - (sbw * 2));
                                        } else if (bw) {
                                            total += (sbw * 2);
                                        }
                                    }
                                    if (pl) {
                                        total += property(pl);
                                    }
                                    if (pr) {
                                        spr = property(pr);
                                        total += spr;
                                    }
                                    if (!pl && !pr) {
                                        spw = property(pw);
                                        if ((pl || pr) && pw) {
                                            total = Math.abs(total - (spw * 2));
                                        } else if (pw) {
                                            total += (spw * 2);
                                        }
                                    }
                                    total += b[d].offsetLeft;
                                    stotal = y - (dw + total);
                                    if (spr > 0) {
                                        stotal = Math.abs(stotal - spr);
                                    } else if (spw > 0) {
                                        stotal = Math.abs(stotal - spw);
                                    }
                                    total = Math.abs(total - stotal);
                                    b[d].style.width = (((e - y) - total) + dw) + "px";
                                    total = 0;
                                    stotal = 0;
                                    spr = 0;
                                    dw = b[d].clientHeight;
                                    if (bb) {
                                        total += property(bb);
                                    }
                                    if (bt) {
                                        total += property(bt);
                                    }
                                    if (!sbw && !bb && !bt) {
                                        sbw = property(bw);
                                        if ((bb || bt) && bw) {
                                            total = Math.abs(total - (sbw * 2));
                                        } else if (bw) {
                                            total += (sbw * 2);
                                        }
                                    } else if (!bb && !bt) {
                                        if ((bb || bt) && bw) {
                                            total = Math.abs(total - (sbw * 2));
                                        } else if (bw) {
                                            total += (sbw * 2);
                                        }
                                    }
                                    if (pt) {
                                        total += property(pt);
                                    }
                                    if (pb) {
                                        spr = property(pb);
                                        total += spr;
                                    }
                                    if (!spw && !pb && !pt) {
                                        spw = property(pw);
                                        if ((pb || pt) && pw) {
                                            total = Math.abs(total - (spw * 2));
                                        } else if (pw) {
                                            total += (spw * 2);
                                        }
                                    } else if (!pb && !pt) {
                                        if ((pb || pt) && pw) {
                                            total = Math.abs(total - (spw * 2));
                                        } else {
                                            total += (spw * 2);
                                        }
                                    }
                                    total += b[d].offsetTop;
                                    stotal = z - (dw + total);
                                    if (spr > 0) {
                                        stotal = Math.abs(stotal - spr);
                                    } else if (spw > 0) {
                                        stotal = Math.abs(stotal - spw);
                                    }
                                    total = Math.abs(total - stotal);
                                    b[d].style.height = (((f - z) - total) + dw) + "px";
                                    total = 0;
                                    stotal = 0;
                                    spr = 0;
                                    spw = 0;
                                    sbw = 0;
                                }
                            }
                        }
                    }
                    em = 1;
                    ex = 1;
                    spr = 0;
                    spw = 0;
                }
            }
        },
        maximize: function (x) {
            "use strict";
            var a = x.parentNode,
                b = a.parentNode,
                c = _("button", a),
                d = _("h3", b)[0],
                e = _("div", b)[0],
                f = (document.body.parentNode.scrollTop > document.body.scrollTop) ? document.body.parentNode.scrollTop : document.body.scrollTop,
                g = (document.body.parentNode.scrollLeft > document.body.scrollLeft) ? document.body.parentNode.scrollLeft : document.body.scrollLeft,
                h = c.length,
                i,
                j,
                k,
                l = 0,
                m,
                n = 0,
                o = 0;
            if (typeof e !== "object") {
                e = _("textarea", b)[0];
                l = 1.8;
                n = 0.2;
                if (b === $("stylizer")) {
                    o = 1;
                } else {
                    o = 3.4;
                }
            }
            m = e.style.fontSize;
            m = Number(m.substr(0, m.length - 2));
            m = m * 10;
            for (i = 0; i < h; i += 1) {
                if (c[i].getAttribute("class") === "resize") {
                    c = c[i];
                    break;
                }
            }
            if (x.innerHTML === "<span>\u2191</span>") {
                x.innerHTML = "<span>\u2193</span>";
                x.setAttribute("title", "Return this dialogue to its prior size and location.");
                j = (e.clientWidth / m);
                k = (e.clientHeight / m);
                gui.position[f] = {};
                if (l === 0) {
                    gui.position[f].width = j - 1;
                    gui.position[f].height = k - 4.3;
                    gui.position[f].left = (b.offsetLeft / m);
                    gui.position[f].top = (b.offsetTop / m);
                } else {
                    gui.position[f].width = j + (m / 10);
                    gui.position[f].height = k + (m / 10);
                    gui.position[f].left = (b.offsetLeft / m) + 1;
                    gui.position[f].top = (b.offsetTop / m) + 2;
                }
                b.style.top = (f / m) + "em";
                b.style.left = (g / m) + "em";
                if (i !== h) {
                    c.style.display = "none";
                }
                d.setAttribute("onmousedown", "");
                d.style.cursor = "default";
                if (window.innerHeight) {
                    d.style.width = ((window.innerWidth / 10) - (11.5 + n)) + "em";
                    e.style.width = ((window.innerWidth / m) - (2.8 - l)) + "em";
                    e.style.height = (((window.innerHeight - gui.y.parentNode.clientHeight) / m) - (6.3 - o)) + "em";
                } else {
                    d.style.width = ((window.screen.availWidth / 10) - (12.5 + n)) + "em";
                    e.style.width = ((window.screen.availWidth / m) - (3.8 - l)) + "em";
                    e.style.height = (((window.screen.availHeight - gui.y.parentNode.clientHeight) / e) - (20.5 - o)) + "em";
                }
                if (gui.logging && gui.z !== null && typeof gui.z === "object") {
                    gui.logConsole("maximize", a.parentNode);
                }
                gui.fullsize(b, j, k);
            } else {
                j = (e.clientWidth / m);
                k = (e.clientHeight / m);
                x.innerHTML = "<span>\u2191</span>";
                x.setAttribute("title", "Maximize this dialogue to the browser window.");
                if (gui.position && gui.position[f] && gui.position[f].top) {
                    b.style.top = gui.position[f].top + "em";
                    b.style.left = gui.position[f].left + "em";
                    if (l === 1.8) {
                        d.style.width = (gui.position[f].width + 4.7) + "em";
                    } else {
                        d.style.width = (gui.position[f].width - 8.7) + "em";
                    }
                    e.style.width = gui.position[f].width + "em";
                    e.style.height = gui.position[f].height + "em";
                }
                if (i !== h) {
                    c.style.display = "block";
                }
                d.setAttribute("onmousedown", "gui.move(event, this);");
                d.style.cursor = "move";
                if (gui.logging && gui.z !== null && typeof gui.z === "object") {
                    gui.logConsole("normalize", a.parentNode);
                }
                gui.fullsize(b, j, k);
            }
            gui.state(b);
        },
        resize: function (e, x) {
            "use strict";
            var a = x.parentNode.parentNode,
                b = _("div", a)[0],
                c = _("h3", a)[0],
                d,
                bx,
                by,
                bxa,
                bya,
                textarea = false,
                drop = function (g) {
                    g = null;
                    document.onmousemove = null;
                    document.onmouseup = null;
                    bx = b.clientWidth;
                    by = b.clientHeight;
                    gui.fullsize(a, bxa, bya);
                    gui.state(a);
                    if (gui.logging && gui.z !== null && typeof gui.z === "object") {
                        gui.logConsole("resize", a);
                    }
                },
                boxsize = function (f) {
                    document.onmouseup = drop;
                    f = f || window.event;
                    if (textarea) {
                        b.style.width = ((bx + ((f.clientX + 15) - b.mouseX)) / d) + 'em';
                        c.style.width = (((bx + (f.clientX - b.mouseX)) / 10) - 8.8) + 'em';
                        b.style.height = ((by + ((f.clientY + 15) - b.mouseY)) / d) + 'em';
                    } else {
                        b.style.width = ((bx + ((f.clientX - 4) - b.mouseX)) / d) + 'em';
                        c.style.width = (((bx + (f.clientX - b.mouseX)) / d) - 9.1) + 'em';
                        b.style.height = ((by + ((f.clientY - 36) - b.mouseY)) / d) + 'em';
                    }
                };
            if (typeof b !== "object") {
                b = _("textarea", a)[0];
                textarea = true;
            }
            bx = b.clientWidth;
            by = b.clientHeight;
            bxa = (bx / 10);
            bya = (by / 10);
            d = b.style.fontSize;
            d = Number(d.substr(0, d.length - 2)) * 10;
            document.onmousedown = null;
            e = e || window.event;
            b.mouseX = e.clientX;
            b.mouseY = e.clientY;
            document.onmousemove = boxsize;
        },
        move: function (e, x) {
            "use strict";
            var a = x.parentNode,
                ax = a.offsetLeft,
                ay = a.offsetTop,
                drop = function (g) {
                    g = null;
                    document.onmousemove = null;
                    document.onmouseup = null;
                    ax = a.offsetLeft;
                    ay = a.offsetTop;
                    gui.state(a);
                    if (gui.logging && gui.z !== null && typeof gui.z === "object") {
                        gui.logConsole("move", a);
                    }
                },
                boxmove = function (f) {
                    document.onmouseup = drop;
                    f = f || window.event;
                    a.style.left = ((ax + (f.clientX - a.mouseX)) / 10) + 'em';
                    a.style.top = ((ay + (f.clientY - a.mouseY)) / 10) + 'em';
                };
            document.onmousedown = null;
            a.style.zIndex = gui.zindex;
            e = e || window.event;
            a.mouseX = e.clientX;
            a.mouseY = e.clientY;
            document.onmousemove = boxmove;
        },
        state: function (x) {
            "use strict";
            if (localStorage === null || typeof localStorage !== "object") {
                return;
            }
            if (gui.y !== null && typeof gui.y === "object") {
                localStorage.setItem("panellist", gui.y.innerHTML);
            }
            if (gui.z !== null && typeof gui.z === "object") {
                if (gui.y !== null && typeof gui.y === "object") {
                    gui.z.style.height = (((window.innerHeight - gui.y.parentNode.clientHeight) / 10) - 3.9) + "em";
                } else {
                    gui.z.style.height = ((window.innerHeight / 10) - 3.8) + "em";
                }
            }
            if (x === "style") {
                localStorage.setItem("style", _("style", _("head")[0])[0].innerHTML);
            }
            localStorage.setItem("dashboard", gui.q + "|" + gui.zindex + "|" + gui.x.innerHTML);
            localStorage.setItem("guionce", gui.once.join());
        },
        reload: function () {
            "use strict";
            var b,
                e,
                f;
            if (typeof localStorage === "undefined") {
                return;
            }
            if (localStorage.hasOwnProperty("guiLicense")) {
                gui.l.style.display = "none";
                _("input", gui.l)[0].checked = true;
            }
            if (localStorage.hasOwnProperty("dashboard")) {
                f = localStorage.getItem("dashboard");
                if (f !== "") {
                    b = f.indexOf("|");
                    gui.q = Number(f.substring(0, b));
                    f = f.substring(b + 1);
                    b = f.indexOf("|");
                    gui.zindex = Number(f.substring(0, b));
                    gui.x.innerHTML = f.substring(b + 1);
                }
            }
            if (localStorage.hasOwnProperty("guionce")) {
                gui.once = localStorage.getItem("guionce").split(",");
            }
            if (gui.y !== null && typeof gui.y === "object" && localStorage.hasOwnProperty("panellist")) {
                gui.y.innerHTML = localStorage.getItem("panellist");
                gui.y.parentNode.style.zIndex = gui.zindex + 1;
            }
            if (gui.z !== null && typeof gui.z === "object") {
                if (gui.y !== null && typeof gui.y === "object") {
                    gui.z.style.height = (((window.innerHeight - gui.y.parentNode.clientHeight) / 10) - 3.9) + "em";
                } else {
                    gui.z.style.height = ((window.innerHeight / 10) - 3.8) + "em";
                }
            }
            if (localStorage.hasOwnProperty("style")) {
                e = localStorage.getItem("style");
                if (e !== "") {
                    _("style", _("head")[0])[0].innerHTML = e;
                    f = $("stylizer");
                    if (f !== null && typeof f === "object") {
                        _("textarea", f)[0].value = e;
                    }
                }
            }
            if (localStorage.hasOwnProperty("install")) {
                install = JSON.parse(localStorage.getItem("install"));
            }
            gui.x.style.height = ((window.screen.availHeight / 10) - 10) + "em";
        }
    },
    appmenu = {
        open: function (x) {
            "use strict";
            var a,
                b;
            if (typeof x === "object" && x !== null) {
                a = _("ul", x)[0];
                if (typeof a === "object" && a !== null) {
                    b = a;
                } else {
                    b = x;
                }
                b.style.zIndex = gui.zindex + 11;
                b.style.display = "block";
            } else {
                a = $("appmenu");
                a.style.zIndex = gui.zindex + 10;
                a.style.display = "block";
            }
        },
        close: function (x) {
            "use strict";
            var a,
                b;
            if (typeof x === "object" && x !== null) {
                a = _("ul", x)[0];
                if (typeof a === "object" && a !== null) {
                    b = a;
                } else {
                    b = x;
                }
                b.style.display = "none";
            } else {
                a = $("appmenu");
                a.style.display = "none";
            }
        }
    },
    apps = {
        browser: {
            file: {
                head: "File Browser",
                body: "<form action='#' onsubmit='apps.browser.file.action(this);return false;' class='guiFullWidth'><span><button type='submit'>Go</button><label for='address" + (gui.q + 1) + "'>File system address:</label></span> <input id='address" + (gui.q + 1) + "' type='text' name='address' value='file:///c:/'/></form><iframe class='guiFullBoth' src='file:///c:/'></iframe>",
                customStyle: "fileBrowser",
                action: function (x) {
                    "use strict";
                    var a = _("input", x)[0],
                        b = x.parentNode,
                        c = a.value,
                        d = _("iframe", b)[0];
                    if ((/^(file:\/\/\/)/).test(c)) {
                        d.src = c;
                    } else if ((/^(\/?(localhost\/)?[a-z](:|\|))/).test(c)) {
                        c = "file:///" + c.replace(/\\/g, "/");
                        a.value = c;
                        d.src = c;
                    }
                }
            }
        },
        regex: {
            head: "Regular Expression Tester",
            body: (function () {
                "use strict";
                var a = ["<p class='regex-input'><span class='bound'>/</span>"];
                a.push("<span class='pattern'><label for='regexpattern-" + (gui.q + 1) + "'>Pattern</label> <input type='text' id='regexpattern-" + (gui.q + 1) + "' onchange='apps.regex.action(" + (gui.q + 1) + ")'/></span>");
                a.push("<span class='bound'>/</span>");
                a.push("<span class='switch'><label for='regexswitch-" + (gui.q + 1) + "'>Switches</label> <input type='text' id='regexswitch-" + (gui.q + 1) + "' onchange='apps.regex.action(" + (gui.q + 1) + ")'/></span><span class='clear'/></p>");
                a.push("<p class='string'><label for='regexstring-" + (gui.q + 1) + "'>Sample String</label> <textarea id='regexstring-" + (gui.q + 1) + "' onchange='apps.regex.action(" + (gui.q + 1) + ")'></textarea></p>");
                a.push("<p class='output' id='regexoutput-" + (gui.q + 1) + "' style='border:.05em solid #000;padding:.2em'></p>");
                return a.join("");
            }()),
            customStyle: "regex",
            action: function (x) {
                "use strict";
                var a = $("regexpattern-" + x),
                    b = $("regexswitch-" + x),
                    c = $("regexstring-" + x),
                    d = b.value.toLowerCase(),
                    e = c.value,
                    f,
                    g,
                    h,
                    i = "",
                    j = $("regexoutput-" + x),
                    k = 0,
                    value = function (y) {
                        k += 1;
                        return "<em>" + y + "</em>";
                    };
                if (a.value.length === 0 || e.length === 0) {
                    return;
                }
                if (d.indexOf("g") > -1) {
                    i = "g";
                }
                if (d.indexOf("i") > -1) {
                    i = i + "i";
                }
                if (d.indexOf("m") > -1) {
                    i = i + "m";
                }
                b.value = i;
                f = a.value.split("/");
                g = f.length;
                if (g > 1) {
                    for (h = 0; h < (g - 1); h += 1) {
                        if (f[h].charAt(f[h].length - 1) !== "\\") {
                            a.style.background = "#fcc";
                            return;
                        }
                    }
                    a.style.background = "#fff";
                    i = new RegExp(a.value.replace(/\\/g, "\\").replace(/</g, "&lt;").replace(/>/g, "&gt;"), i);
                } else {
                    a.style.background = "#fff";
                    i = new RegExp(a.value.replace(/\\/g, "\\").replace(/</g, "&lt;").replace(/>/g, "&gt;"), i);
                }
                e = e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(i, value);
                if (k === 1) {
                    g = "";
                } else {
                    g = "es";
                }
                j.innerHTML = "<span><em>" + k + "</em> match" + g + " detected.</span>" + e;
            }
        },
        exportapp: {
            head: "Export Apps as JSON",
            body: (function () {
                "use strict";
                var a = ["<p>Please choose an application from the following list.</p>"];
                a.push("<p><label for='uninstall-app-list'>List of installed applications:</label> <select id='export-app-list'> <option value='' selected='selected'>---</option>");
                a.push("</select></p> <p><label for='export-app-json'>JSON Date of Exported App</label> <textarea id='export-app-json'></textarea></p>");
                return a.join("");
            }()),
            once: "exportapp",
            action: function (x) {
                var a = Object.getOwnPropertyNames(install),
                    b = a.length,
                    c,
                    d = x.value,
                    e = "",
                    f = $("export-app-json");
                for (c = 0; c < b; c += 1) {
                    if (a[c] === d) {
                        e = install[a[c]];
                        e.id = a[c];
                        f.value = JSON.stringify(e);
                        return;
                    }
                }
            }
        },
        uninstall: {
            head: "Uninstall Added Applications",
            body: (function () {
                "use strict";
                var a = ["<p>Please choose an application from the following list.</p>"];
                a.push("<p><label for='uninstall-app-list'>List of installed applications:</label> <select id='uninstall-app-list'> <option value='' selected='selected'>---</option>");
                a.push("</select></p> <p class='resetgui'>Are you sure you want to uninstall?</p>");
                a.push("<ul><li class='delete'><input type='radio' id='uninstall-yes' name='uninstall'/> ");
                a.push("<label for='uninstall-yes'>Delete</label></li>");
                a.push("<li class='cancel'><input type='radio' id='uninstall-no' name='uninstall' checked='checked'/> ");
                a.push("<label for='uninstall-no'>Cancel</label></li></ul> <p><button type='button' id='uninstall-app-exe' onclick='apps.uninstall.action(this)'>Execute</button></p>");
                return a.join("");
            }()),
            once: "uninstall",
            action: function (x) {
                "use strict";
                var a,
                    b = Object.getOwnPropertyNames(install),
                    c,
                    d,
                    e;
                if (x === $("uninstall-app-list") || x === $("export-app-list")) {
                    a = [];
                    c = b.length;
                    for (d = 0; d < c; d += 1) {
                        a.push(" <option value='");
                        a.push(b[d]);
                        a.push("'>");
                        a.push(install[b[d]].head);
                        a.push("</option>");
                    }
                    x.innerHTML += a.join("");
                    if (x === $("export-app-list")) {
                        x.setAttribute("onchange", "apps.exportapp.action(this)");
                    }
                    return;
                } else if (x === $("uninstall-app-exe")) {
                    a = $("uninstall-yes");
                    if (a.checked) {
                        b = $("appmenu-primary").childNodes;
                        a = b.length;
                        c = $("uninstall-app-list");
                        e = install[c.value].head;
                        for (d = 0; d < a; d += 1) {
                            if (b[d].nodeType === 1 && b[d].innerHTML === e) {
                                b[d].parentNode.removeChild(b[d]);
                                break;
                            }
                        }
                        delete install[c.value];
                        localStorage.setItem("install", JSON.stringify(install));
                        d = c.innerHTML;
                        e = " <option value='" + c.value + "'>" + e + "</option>";
                        if (d.indexOf(e) !== -1) {
                            c.innerHTML = d.replace(e, "");
                        } else if (d.indexOf(e.replace(/'/g, "\"")) !== -1) {
                            c.innerHTML = d.replace(e.replace(/'/g, "\""), "");
                        }
                    }
                }
            }
        },
        register: {
            head: "Create/Import New Application",
            body: (function () {
                "use strict";
                var a = ["<p><span><label for='register-wizard'>Create New Application</label> <input type='radio' name='wizard' id='register-wizard' onclick='apps.register.action(this)'checked='checked'/></span> <span><label for='register-json'>Import Application as a JSON</label> <input type='radio' name='wizard' id='register-json' onclick='apps.register.action(this)'/></span></p>"];
                a.push("<div id='register-json-block' style='display:none'>");
                a.push("<p><label for='register-json-import'>Import Application JSON Data</label> <textarea id='register-json-import'></textarea></p>");
                a.push("<p><button type='button' value='Import Application' id='register-json-submit' onclick='apps.register.action(this)'>Import Application</button></p>");
                a.push("</div> <div id='register-wizard-block'>");
                a.push("<p><label for='register-id'>Unique App Identifier</label> <input type='text' id='register-id'/></p>");
                a.push("<p><label for='register-head'>Heading Text</label> <input type='text' id='register-head'/></p>");
                a.push("<p><label for='register-body'>Panel Body HTML</label> <textarea id='register-body'></textarea></p>");
                a.push("<p><label for='register-script'>Panel JavaScript Code (optional)</label> <textarea id='register-script'></textarea></p>");
                a.push("<p><label for='register-custom-style'>One Additional Class Name (optional)</label> <input type='text' id='register-custom-style'/></p>");
                a.push("<p><label for='register-once'>Panel Limited to One Instance</label> <input type='checkbox' id='register-once' class='checkbox'/></p>");
                a.push("<p><label for='register-text'>Set Panel Body as a Textarea Element</label> <input type='checkbox' id='register-text' class='checkbox'/></p>");
                a.push("<p><button type='button' value='Create Application' id='register-wizard-submit' onclick='apps.register.action(this)'>Create Application</button></p>");
                a.push("</div>");
                return a.join("");
            }()),
            once: "register",
            action: function (x) {
                "use strict";
                var a,
                    b,
                    c,
                    d,
                    e,
                    f;
                switch (x.getAttribute("id")) {
                case "register-wizard":
                    $("register-json-block").style.display = "none";
                    $("register-wizard-block").style.display = "block";
                    break;
                case "register-json":
                    $("register-json-block").style.display = "block";
                    $("register-wizard-block").style.display = "none";
                    break;
                case "register-wizard-submit":
                    a = $("register-id").value.replace(/\s+/g, "");
                    b = $("register-head").value;
                    c = $("register-body").value;
                    d = $("register-text").checked;
                    if (a === "" || b === "" || /^[a-zA-Z_]/.test(a) === false || /^(\s*)$/.test(b)) {
                        return;
                    } else {
                        if (d === false && (c === "" || /^(\s*)$/.test(c))) {
                            return;
                        }
                        e = $("register-once").checked;
                        f = $("register-custom-style").value.replace(/\s+/g, "");
                        install[a] = {
                            head: b,
                            body: c,
                            textarea: d
                        };
                        if (e) {
                            install[a].once = a;
                        }
                        if (f !== "") {
                            install[a].customStyle = f;
                        }
                        Object.freeze(install[a]);
                        localStorage.setItem("install", JSON.stringify(install));
                        $("appmenu-primary").innerHTML += "<li onclick='gui.panel(install." + a + ")'>" + b + "</li>";
                    }
                    break;
                case "register-json-submit":
                    a = $("register-json-import").value;
                    if (a.length > 2 && a.charAt(0) === "{" && a.charAt(a.length - 1) === "}") {
                        a = JSON.parse(a);
                        if (typeof a.id !== "string" || typeof a.head !== "string" || typeof a.body !== "string") {
                            return;
                        }
                        b = a.id;
                        delete a[b];
                        install[b] = a;
                        Object.freeze(install[b]);
                        c = _("ul", $("appmenu"))[0];
                        d = c.innerHTML + " <li onclick='gui.panel(install." + a + ")'>" + a.head + "</li>";
                        c.innerHTML = d;
                        localStorage.setItem("install", JSON.stringify(install));
                    }
                    break;
                }
            }
        },
        text: {
            head: "Text Editor",
            body: "<label for='texteditor-" + (gui.q + 1) + "' class='sub-heading'>Write text into this textarea container.</label><textarea id='texteditor-" + (gui.q + 1) + "' class='gui-body' style='font-size:1.25em;' wrap='off' onchange='gui.state(\"dashboard\")'></textarea>",
            textarea: true
        },
        stylizer: {
            head: "Stylizer",
            body: "<label for='style-input' class='sub-heading'>Change the appearance of this tool by writing CSS in the area below. Apply changes by clicking on this bar.</label><textarea wrap='off' id='style-input' class='gui-body' style='font-size:1.25em' onchange='apps.stylizer.action(this)'></textarea>",
            once: "stylizer",
            textarea: true,
            action: function (x) {
                "use strict";
                var a = x.getAttribute("id"),
                    b,
                    c = _("style", _("head")[0])[0];
                if (a === "style-input") {
                    b = x.value;
                    c.innerHTML = b;
                    gui.state("style");
                    if (gui.logging && gui.z !== null && typeof gui.z === "object") {
                        gui.logConsole(" imposed style change", x.parentNode.parentNode);
                    }
                } else {
                    b = _("textarea", x)[0];
                    b.value = c.innerHTML;
                }
            }
        },
        reset: {
            head: "Resetjsguibodyarg",
            body: (function () {
                "use strict";
                var a = ["<p class='resetgui'>Are you sure you want to erase stored data?</p> "];
                a.push("<form class='resetgui' onsubmit='apps.reset.action(\"jsguibodyarg\", this);return false;' action='#'>");
                a.push("<ul><li class='delete'><input type='radio' id='reset-" + (gui.q + 1) + "-yes' name='reset-" + (gui.q + 1) + "' value='reset-yes'/> ");
                a.push("<label for='reset-" + (gui.q + 1) + "-yes'>Delete</label></li>");
                a.push("<li class='cancel'><input type='radio' id='reset-" + (gui.q + 1) + "-no' name='reset-" + (gui.q + 1) + "' value='reset-no' checked='checked'/> ");
                a.push("<label for='reset-" + (gui.q + 1) + "-no'>Cancel</label></li></ul> <p><button type='submit'>Execute</button></p></form>");
                return a.join("");
            }()),
            action: function (x, y) {
                "use strict";
                var a = _("input", y),
                    b = y.parentNode.parentNode,
                    c = _("button", _("p", b)[0])[0];
                gui.close(c);
                if (a[0].checked && a[0].value === "reset-yes" && typeof localStorage === "object") {
                    switch (x) {
                    case " Custom Appearance (from Stylizer)":
                        localStorage.setItem("style", "");
                        _("style", _("head")[0])[0].innerHTML = "";
                        break;
                    case " Dashboard":
                        localStorage.setItem("panellist", "");
                        localStorage.setItem("guionce", "");
                        a = '<h2>dashboard</h2> <p><button id="appmenubutton" onmouseover="appmenu.open()" onmouseout="appmenu.close()">Application menu</button></p> <ul id="appmenu" onmouseover="appmenu.open()" onmouseout="appmenu.close()">' + $("appmenu").innerHTML + '</ul>';
                        gui.x.innerHTML = a;
                        if (gui.y !== null && typeof gui.y === "object") {
                            gui.y.innerHTML = "";
                        }
                        gui.once = [];
                        localStorage.setItem("dashboard", a);
                        return;
                    case " All Stored Data and Settings":
                        localStorage.clear();
                        return window.location.reload(true);
                    }
                } else {
                    gui.close(c);
                }
            }
        }
    };
Object.freeze(apps);