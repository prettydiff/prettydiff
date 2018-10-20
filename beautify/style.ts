/*global global*/
(function beautify_style_init():void {
    "use strict";
    const style = function beautify_style(options:any):string {
        const data:parsedArray = options.parsed,
            /*colorNames:any = {
                aliceblue           : 0.9288006825347457,
                antiquewhite        : 0.8464695170775405,
                aqua                : 0.7874,
                aquamarine          : 0.8078549208338043,
                azure               : 0.9726526495416643,
                beige               : 0.8988459998705021,
                bisque              : 0.8073232737297876,
                black               : 0,
                blanchedalmond      : 0.8508443960815607,
                blue                : 0.0722,
                blueviolet          : 0.12622014321946043,
                brown               : 0.09822428787651079,
                burlywood           : 0.5155984453389335,
                cadetblue           : 0.29424681085422044,
                chartreuse          : 0.7603202590262282,
                chocolate           : 0.23898526114557292,
                coral               : 0.3701793087292368,
                cornflowerblue      : 0.30318641994179363,
                cornsilk            : 0.9356211037296492,
                crimson             : 0.16042199953025577,
                cyan                : 0.7874,
                darkblue            : 0.018640801980939217,
                darkcyan            : 0.2032931783904645,
                darkgoldenrod       : 0.27264703559992554,
                darkgray            : 0.39675523072562674,
                darkgreen           : 0.09114342904757505,
                darkgrey            : 0.39675523072562674,
                darkkhaki           : 0.45747326349994155,
                darkmagenta         : 0.07353047651207048,
                darkolivegreen      : 0.12651920884889156,
                darkorange          : 0.40016167026523863,
                darkorchid          : 0.1341314217485677,
                darkred             : 0.05488967453113126,
                darksalmon          : 0.4054147156338075,
                darkseagreen        : 0.43789249325969054,
                darkslateblue       : 0.06579284622798763,
                darkslategray       : 0.06760815192804355,
                darkslategrey       : 0.06760815192804355,
                darkturquoise       : 0.4874606277449034,
                darkviolet          : 0.10999048339343433,
                deeppink            : 0.2386689582827583,
                deepskyblue         : 0.444816033955754,
                dimgray             : 0.14126329114027164,
                dimgrey             : 0.14126329114027164,
                dodgerblue          : 0.2744253699145608,
                firebrick           : 0.10724525535015225,
                floralwhite         : 0.9592248482500424,
                forestgreen         : 0.18920812076002244,
                fuchsia             : 0.2848,
                gainsboro           : 0.7156935005064806,
                ghostwhite          : 0.9431126188632283,
                gold                : 0.6986087742815887,
                goldenrod           : 0.41919977809568404,
                gray                : 0.21586050011389915,
                green               : 0.15438342968146068,
                greenyellow         : 0.8060947261145331,
                grey                : 0.21586050011389915,
                honeydew            : 0.9633653555478173,
                hotpink             : 0.3465843816971475,
                indianred           : 0.21406134963884,
                indigo              : 0.031075614863369846,
                ivory               : 0.9907127060061531,
                khaki               : 0.7701234339412052,
                lavendar            : 0.8031875051452125,
                lavendarblush       : 0.9017274863104644,
                lawngreen           : 0.7390589312496334,
                lemonchiffon        : 0.9403899224562171,
                lightblue           : 0.6370914128080659,
                lightcoral          : 0.35522120733134843,
                lightcyan           : 0.9458729349482863,
                lightgoldenrodyellow: 0.9334835101829635,
                lightgray           : 0.651405637419824,
                lightgreen          : 0.6909197995686475,
                lightgrey           : 0.651405637419824,
                lightpink           : 0.5856615273489745,
                lightsalmon         : 0.47806752252059587,
                lightseagreen       : 0.3505014511704197,
                lightskyblue        : 0.5619563761833096,
                lightslategray      : 0.23830165007286924,
                lightslategrey      : 0.23830165007286924,
                lightyellow         : 0.9816181839288161,
                lime                : 0.7152,
                limegreen           : 0.44571042246097864,
                linen               : 0.8835734098437936,
                magenta             : 0.2848,
                maroon              : 0.04589194232421496,
                mediumaquamarine    : 0.4938970331080111,
                mediumblue          : 0.04407778021232784,
                mediumorchid        : 0.21639251153773428,
                mediumpurple        : 0.22905858091648004,
                mediumseagreen      : 0.34393112338131226,
                mediumslateblue     : 0.20284629471622434,
                mediumspringgreen   : 0.7070430819418444,
                mediumturquois      : 0.5133827926447991,
                mediumvioletred     : 0.14371899849357186,
                midnightblue        : 0.020717866350860484,
                mintcream           : 0.9783460494758793,
                mistyrose           : 0.8218304785918541,
                moccasin            : 0.8008300099156694,
                navajowhite         : 0.7651968234278562,
                navy                : 0.015585128108223519,
                oldlace             : 0.9190063340554899,
                olive               : 0.20027537200567563,
                olivedrab           : 0.2259315095192918,
                orange              : 0.48170267036309605,
                orangered           : 0.2551624375341641,
                orchid              : 0.3134880676143873,
                palegoldenrod       : 0.7879264788761452,
                palegreen           : 0.7793675900635259,
                paleturquoise       : 0.764360779217138,
                palevioletred       : 0.2875499411788909,
                papayawhip          : 0.8779710019983541,
                peachpuff           : 0.7490558987825108,
                peru                : 0.3011307487793569,
                pink                : 0.6327107070246611,
                plum                : 0.4573422158796909,
                powderblue          : 0.6825458650060524,
                purple              : 0.061477070432438476,
                red                 : 0.2126,
                rosyblue            : 0.3231945764940708,
                royalblue           : 0.16663210743188323,
                saddlebrown         : 0.09792228502052071,
                salmon              : 0.3697724152759545,
                sandybrown          : 0.46628543696283414,
                seagreen            : 0.1973419970627483,
                seashell            : 0.927378622069223,
                sienna              : 0.13697631337097677,
                silver              : 0.527115125705813,
                skyblue             : 0.5529166851818412,
                slateblue           : 0.14784278062136097,
                slategray           : 0.20896704076536138,
                slategrey           : 0.20896704076536138,
                slightsteelblue     : 0.5398388828466575,
                snow                : 0.9653334183484877,
                springgreen         : 0.7305230606852947,
                steelblue           : 0.20562642207624846,
                tan                 : 0.48237604163921527,
                teal                : 0.1699685577896842,
                thistle             : 0.5681840109373312,
                tomato              : 0.3063861271941505,
                turquoise           : 0.5895536427577983,
                violet              : 0.40315452986676303,
                wheat               : 0.7490970282048214,
                white               : 1,
                whitesmoke          : 0.913098651793419,
                yellow              : 0.9278,
                yellowgreen         : 0.5076295720870697
            },*/
            lf:"\r\n"|"\n"         = (options.crlf === true)
                ? "\r\n"
                : "\n",
            len:number      = (options.end > 0)
                ? options.end
                : data.token.length,
            build:string[]    = [],
            //a single unit of indentation
            tab:string      = (function beautify_style_tab():string {
                let aa:number = 0,
                    bb:string[] = [];
                do {
                    bb.push(options.indent_char);
                    aa = aa + 1;
                } while (aa < options.indent_size);
                return bb.join("");
            }()),
            pres:number = options.preserve + 1,
            //new lines plus indentation
            nl       = function beautify_style_nl(tabs:number):void {
                const linesout:string[] = [],
                    total:number = (function beautify_style_nl_total():number {
                        if (a === len - 1) {
                            return 1;
                        }
                        if (data.lines[a + 1] - 1 > pres) {
                            return pres;
                        }
                        if (data.lines[a + 1] > 1) {
                            return data.lines[a + 1] - 1;
                        }
                        return 1;
                    }());
                let index = 0;
                if (tabs < 0) {
                    tabs = 0;
                }
                do {
                    linesout.push(lf);
                    index = index + 1;
                } while (index < total);
                if (tabs > 0) {
                    index = 0;
                    do {
                        linesout.push(tab);
                        index = index + 1;
                    } while (index < tabs);
                }
                build.push(linesout.join(""));
            },
            //breaks selector lists onto newlines
            selector = function beautify_style_selector(item:string):void {
                let aa:number    = 0,
                    bb:number    = 0,
                    cc:number    = 0,
                    leng:number  = item.length,
                    block:string = "";
                const items:string[] = [];
                if (options.compressed_css === true && (/\)\s*when\s*\(/).test(item) === true) {
                    item = item.replace(
                        /\)\s*when\s*\(/,
                        ")" + lf + (function beautify_style_selector_whenTab():string {
                            let wtab = "",
                                aaa  = indent + 1;
                            do {
                                wtab = wtab + tab;
                                aaa  = aaa - 1;
                            } while (aaa > 0);
                            return wtab;
                        }()) + "when ("
                    );
                }
                do {
                    if (block === "") {
                        if (item.charAt(aa) === "\"") {
                            block = "\"";
                            bb    = bb + 1;
                        } else if (item.charAt(aa) === "'") {
                            block = "'";
                            bb    = bb + 1;
                        } else if (item.charAt(aa) === "(") {
                            block = ")";
                            bb    = bb + 1;
                        } else if (item.charAt(aa) === "[") {
                            block = "]";
                            bb    = bb + 1;
                        }
                    } else if ((item.charAt(aa) === "(" && block === ")") || (item.charAt(aa) === "[" && block === "]")) {
                        bb = bb + 1;
                    } else if (item.charAt(aa) === block) {
                        bb = bb - 1;
                        if (bb === 0) {
                            block = "";
                        }
                    }
                    if (block === "" && item.charAt(aa) === ",") {
                        items.push(item.substring(cc, aa + 1));
                        cc = aa + 1;
                    }
                    aa = aa + 1;
                } while (aa < leng);
                if (cc > 0) {
                    items.push(item.substr(cc));
                }
                leng = items.length;
                if (leng === 0) {
                    items.push(item);
                }
                if (options.selector_list === true || leng < 2) {
                    if (options.compressed_css === true) {
                        build.push(items.join(" ").replace(/\s*,\s*/g, ","));
                    } else {
                        build.push(items.join(" ").replace(/\s*,\s*/g, ", "));
                    }
                } else {
                    aa = 1;
                    if (options.compressed_css === true) {
                        build.push(items[0].replace(/\s*,\s*/g, ","));
                    } else {
                        build.push(items[0].replace(/\s*,\s*/g, ", ").replace(/(,\u0020)$/, ","));
                    }
                    do {
                        nl(indent);
                        if (options.compressed_css === true) {
                            build.push(items[aa].replace(/\s*,\s*/g, ","));
                        } else {
                            build.push(items[aa].replace(/\s*,\s*/g, ", ").replace(/(,\u0020)$/, ","));
                        }
                        aa = aa + 1;
                    } while (aa < leng);
                }
                if (options.compressed_css === false) {
                    build.push(" ");
                }
            },
            vertical = function beautify_style_vertical():void {
                const start:number = data.begin[a],
                    store:compareStore = [];
                let b:number = a,
                    c:number = 0,
                    item:[number, number],
                    longest:number = 0;
                if (start < 0 || b <= start) {
                    return;
                }
                do {
                    b = b - 1;
                    if (data.begin[b] === start) {
                        if (data.token[b] === ":") {
                            item = [b - 1, 0];
                            do {
                                b = b - 1;
                                if ((data.token[b] === ";" && data.begin[b] === start) || (data.token[b] === "}" && data.begin[data.begin[b]] === start)) {
                                    break;
                                }
                                if (data.types[b] !== "comment" && data.types[b] !== "selector" && data.token[b] !== "{" && data.begin[b] === start) {
                                    item[1] = data.token[b].length + item[1];
                                }
                            } while (b > start + 1);
                            if (item[1] > longest) {
                                longest = item[1];
                            }
                            store.push(item);
                        }
                    } else if (data.types[b] === "end") {
                        if (b < data.begin[b]) {
                            break;
                        }
                        b = data.begin[b];
                    }
                } while (b > start);
                b = store.length;
                if (b < 2) {
                    return;
                }
                do {
                    b = b - 1;
                    if (store[b][1] < longest) {
                        c = store[b][1];
                        do {
                            data.token[store[b][0]] = data.token[store[b][0]] + " ";
                            c = c + 1;
                        } while (c < longest);
                    }
                } while (b > 0);
            };
        let output:string     = "",
            indent:number   = options.indent_level,
            mixin:boolean    = false,
            a:number        = 0;
        if (options.indent_level > 0) {
            a = options.indent_level;
            do {
                a = a - 1;
                build.push(tab);
            } while (a > 0);
        }
        if (options.vertical === true && options.compressed_css === false) {
            a = len;
            do {
                a = a - 1;
                if (data.token[a] === "}") {
                    vertical();
                }
            } while (a > 0);
        }

        //beautification loop
        a = options.start;
        do {
            if (data.types[a + 1] === "end" && mixin === false) {
                indent = indent - 1;
            }
            if (data.types[a] === "start") {
                if (data.types[a - 1] === "propvar" && options.compressed_css === false) {
                    build.push(" ");
                }
                if (a > 0 && data.token[a - 1].charAt(data.token[a - 1].length - 1) === "#") {
                    if (options.compressed_css === true) {
                        build.push(data.token[a].replace(/\s*,\s*/g, ","));
                    } else {
                        build.push(data.token[a].replace(/\s*,\s*/g, ", "));
                    }
                } else {
                    if (options.braces === true) {
                        if (build[build.length - 1] === " ") {
                            build.pop();
                        }
                        nl(indent);
                    } else if (data.types[a - 1] === "colon") {
                        build.push(" ");
                    }
                    if (options.compressed_css === true) {
                        build.push(data.token[a].replace(/\s*,\s*/g, ","));
                    } else {
                        build.push(data.token[a].replace(/\s*,\s*/g, ", "));
                    }
                    indent = indent + 1;
                    if ((options.compressed_css === false || (options.compressed_css === true && data.types[a + 1] === "start")) && (data.types[a + 1] !== "selector" || options.css_insert_lines === false)) {
                        nl(indent);
                    }
                }
            } else if (data.types[a] === "end") {
                if (data.types[a + 1] === "external_else") {
                    nl(indent);
                    build.push(data.token[a]);
                    build.push(" ");
                    build.push(data.token[a + 1]);
                    build.push(" ");
                    a = a + 1;
                } else if (mixin === true) {
                    mixin = false;
                    build.push(data.token[a]);
                    build.push(" ");
                } else {
                    build.push(data.token[a]);
                    if (options.compressed_css === true && data.types[a + 1] === "end") {
                        nl(indent - 1);
                    } else if (options.css_insert_lines === true && data.types[a + 1] === "selector" && data.lines[a] < 2 && data.token[a - 1] !== "{") {
                        build.push(lf);
                    } else if (data.types[a + 1] !== "semi") {
                        nl(indent);
                    }
                }
            } else if (data.types[a] === "semi") {
                if (data.token[a] !== "x;" && (options.compressed_css === false || (options.compressed_css === true && data.types[a + 1] !== "end"))) {
                    build.push(data.token[a]);
                }
                if (options.compressed_css === false) {
                    if (options.css_insert_lines === true && data.types[a + 1] === "selector") {
                        build.push(lf);
                    } else if (data.lines[a + 1] > 0 || (data.types[a + 1] !== undefined && data.types[a + 1].indexOf("external") < 0)) {
                        nl(indent);
                    }
                } else if (data.types[a + 1] === "comment") {
                    nl(indent);
                }
            } else if (data.types[a] === "selector") {
                if (a > 0 && data.types[a - 1] !== "comment" && (options.css_insert_lines === true || (options.compressed_css === true && (data.types[a - 1] === "start" || data.types[a - 1] === "semi")))) {
                    nl(indent);
                }
                if (data.token[a].charAt(data.token[a].length - 1) === "#") {
                    build.push(data.token[a]);
                    mixin = true;
                } else if (data.token[a].indexOf(",") > -1) {
                    selector(data.token[a]);
                } else {
                    if (data.token[a].charAt(0) === ":" && data.token[a - 1] === "}" && build[build.length - 1] === " ") {
                        build.pop();
                    }
                    build.push(data.token[a]);
                    if (options.compressed_css === false) {
                        build.push(" ");
                    }
                }
            } else if (data.types[a] === "comment") {
                if (data.lines[a] < 2) {
                    let blen:number = build.length - 1;
                    do {
                        build.pop();
                        blen = blen - 1;
                    } while (blen > 0 && (/^\s+$/).test(build[blen]) === true);
                    if (a > 0) {
                        build.push(" ");
                    }
                }
                build.push(data.token[a]);
                if (data.lines[a + 1] > 1 || data.token[a].slice(0, 2) === "//") {
                    nl(indent);
                }
            } else {
                if (data.types[a - 1] !== "semi" && options.compressed_css === false && (mixin === false || data.token[a - 1] === ":") && data.token[a - 2] !== "filter" && data.token[a - 2] !== "progid") {
                    if (data.types[a] === "value" || (data.types[a].indexOf("external") > -1 && data.types[a - 1] === "colon")) {
                        build.push(" ");
                    }
                }
                if (data.types[a] === "value" || data.types[a] === "variable") {
                    if (options.compressed_css === true) {
                        data.token[a] = data.token[a].replace(/(\s*,\s*)/g, ",");
                    } else {
                        data.token[a] = data.token[a].replace(/(\s*,\s*)/g, ", ");
                    }
                }
                if (data.types[a] === "external_start") {
                    indent = indent + 1;
                } else if (data.types[a] === "external_end") {
                    indent = indent - 1;
                    if (build[build.length - 1] === tab) {
                        build.pop();
                    }
                } else if (data.types[a] === "external_else" && build[build.length - 1] === tab) {
                    build.pop();
                }
                build.push(data.token[a]);
                if (data.types[a] === "variable" && data.token[a + 1] === "{") {
                    build.push(" ");
                } else if (data.types[a].indexOf("external") > -1 && data.types[a + 1] !== "semi") {
                    if ((data.types[a + 1] !== undefined && data.types[a + 1].indexOf("external") > -1) || data.lines[a + 1] > 1) {
                        nl(indent);
                    }
                }
            }
            a = a + 1;
        } while (a < len);
        if (options.new_line === true && options.end === data.token.length) {
            build.push(lf);
        }
        output = build.join("");
        return output;
    };
    global.prettydiff.beautify.style = style;
}());
