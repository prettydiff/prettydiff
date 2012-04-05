var daemon = require('daemon'),
    http = require('http'),
    mailer = require('mailer'),
    prettydiff = require('/home2/mailmark/public_html/prettydiff/prettydiff');
http.createServer(function (req, res) {
    var apichunk = [];
    if (req.url === "/bug") {
        if (req.method.toLowerCase() === "post") {
            req.on('data', function (chunk) {
                apichunk.push(chunk.toString());
                if (apichunk.join("").length > 2097152) {
                    res.writeHead(200, "OK", {
                        'Content-Type': 'text/plain'
                    });
                    res.write('Error: Query size exceeded 2mb.');
                    res.end();
                }
            });
            req.on('end', function () {
                var apidata = apichunk.join("").replace(/(\r\n)?\-{29}\d+\r\nContent\-Disposition\: form\-data; name\="/g, "").substr(6).split("pdiff_"),
                    description,
                    source = "",
                    email = "",
                    hidden = "false",
                    a,
                    b = apidata.length;
                for (a = 0; a < b; a += 1) {
                    name = apidata[a].substr(0, apidata[a].indexOf("\"\r\n\r\n"));
                    if (apidata[a] === name + "\"\r\n\r\n") {
                        data = "";
                    } else {
                        data = apidata[a].substr(name.length + 5);
                    }
                    if (name === "description") {
                        if (data === "") {
                            res.writeHead(200, "OK", {
                                'Content-Type': 'text/plain'
                            });
                            res.write('Error: No bug description.');
                            res.end();
                        } else {
                            description = data;
                        }
                    } else if (name === "source") {
                        source = data;
                    } else if (name === "email") {
                        email = data;
                    }
                }
                if (description.length > 24) {
                    mailer.send({
                        to: "austin.cheney@travelocity.com",
                        from: "api@prettydiff.com",
                        subject: "Pretty Diff - Bug Report",
                        contenttype: "text/plain",
                        body: "Bug report submission.\n\nDescription:\n" + description + "\n\nSource:\n" + source + "\n\nEmail:\n" + email
                    });
                    res.writeHead(200, "OK", {
                        'Content-Type': 'text/plain'
                    });
                    res.write('Bug submitted.');
                    res.end();
                } else {
                    res.writeHead(200, "OK", {
                        'Content-Type': 'text/plain'
                    });
                    res.write('Error: Bug description must be at least 24 characters long.');
                    res.end();
                }
            });
        } else if (req.method.toLowerCase() === "get") {
            res.writeHead(405, "Method not supported", {
                'Content-Type': 'text/plain'
            });
            res.write('405: This page will only respond to HTTP POST connections.');
            res.end();
        }
    } else if (req.url === "/api") {
        if (req.method.toLowerCase() === "get") {
            res.writeHead(405, "Method not supported", {
                'Content-Type': 'text/plain'
            });
            res.write('405: This page will only respond to HTTP POST connections.');
            res.end();
        } else if (req.method.toLowerCase() === "post") {
            req.on('data', function (chunk) {
                apichunk.push(chunk.toString());
                data = apichunk.join("");
                if (data.length > 2097152) {
                    res.writeHead(200, "OK", {
                        'Content-Type': 'text/plain'
                    });
                    res.write('Error: Query size exceeded 2mb.');
                    res.end();
                }
            });
            req.on('end', function () {
                var apidata = apichunk.join("").replace(/(\r\n)?\-{29}\d+\r\nContent\-Disposition\: form\-data; name\="/g, "").substr(6).split("pdiff_"),
                    api = {},
                    filename = "txt",
                    filenamea = "",
                    a,
                    b = apidata.length,
                    error,
                    pathbody,
                    sfilename = "",
                    sourcefile,
                    difffile,
                    heading,
                    sourcepath = "",
                    diffpath = "",
                    htmlHeading,
                    output,
                    name,
                    data = "",
                    out = "web",
                    email,
                    getdiffpath = function (x) {
                        pathbody = [];
                        var status,
                            path,
                            port,
                            scheme,
                            client,
                            request,
                            domain;
                        if (x.indexOf("://") === -1) {
                            error = "Error: diff path does not appear to be an absolute URI.\n" + x;
                            exitfunc();
                        } else {
                            x = x.split("://");
                            domain = x[1].substr(0, x[1].indexOf("/"));
                            path = x[1].substr(x[1].indexOf("/") + 1);
                            scheme = x[0].toLowerCase();
                            if (path === "") {
                                path = "/";
                            }
                            if (domain.indexOf(":") !== -1) {
                                domain = domain.split(":");
                                port = Number(domain[1]);
                                domain = domain[0];
                            }
                            if (port === undefined || port === "" || port === "NaN") {
                                if (scheme === "https") {
                                    port = 443;
                                } else if (scheme === "ftp") {
                                    port = 21;
                                } else if (scheme === "ssh") {
                                    port = 22;
                                } else {
                                    port = 80;
                                }
                            }
                            client = new http.createClient(port, domain);
                            request = client.request("GET", path, {
                                "host": domain
                            });
                            request.end();
                            request.on('response', function (response) {
                                status = response.statusCode;
                                //console.log('HEADERS: ' + JSON.stringify(response.headers));
                                response.setEncoding('utf8');
                                response.on('data', function (chunk) {
                                    pathbody.push(chunk);
                                });
                                response.on('end', function () {
                                    diff = pathbody.join("");
                                    exitfunc();
                                });
                            });
                        }
                    },
                    getsourcepath = function (x) {
                        pathbody = [];
                        var status,
                            path,
                            port,
                            scheme,
                            client,
                            request,
                            domain;
                        if (x.indexOf("://") === -1) {
                            error = "Error: source path does not appear to be an absolute URI.\n" + x;
                            exitfunc();
                        } else {
                            x = x.split("://");
                            domain = x[1].substr(0, x[1].indexOf("/"));
                            path = x[1].substr(x[1].indexOf("/") + 1);
                            scheme = x[0].toLowerCase();
                            if (path === "") {
                                path = "/";
                            }
                            if (domain.indexOf(":") !== -1) {
                                domain = domain.split(":");
                                port = Number(domain[1]);
                                domain = domain[0];
                            }
                            if (port === undefined || port === "" || port === "NaN") {
                                if (scheme === "https") {
                                    port = 443;
                                } else if (scheme === "ftp") {
                                    port = 21;
                                } else if (scheme === "ssh") {
                                    port = 22;
                                } else {
                                    port = 80;
                                }
                            }
                            client = new http.createClient(port, domain);
                            request = client.request("GET", path, {
                                "host": domain
                            });
                            request.end();
                            request.on('response', function (response) {
                                status = response.statusCode;
                                //console.log('HEADERS: ' + JSON.stringify(response.headers));
                                response.setEncoding('utf8');
                                response.on('data', function (chunk) {
                                    pathbody.push(chunk);
                                });
                                response.on('end', function () {
                                    source = pathbody.join("");
                                    if (mode === "diff" && apichunk.join("").indexOf("pdiff_diffpath") !== -1) {
                                        diffpath = apichunk.join("").split("pdiff_diffpath\"\r\n\r\n");
                                        diffpath = diffpath[1].split("pdiff_");
                                        diffpath = diffpath[0].replace(/(\r\n)?\-{29}\d+\r\nContent\-Disposition\: form\-data; name\="/g, "");
                                        if (diffpath !== "") {
                                            getdiffpath(diffpath);
                                        } else {
                                            if (mode === "diff" && diff === "") {
                                                if (diffres === "" && difffile === undefined || new RegExp(/^(\s*)$/).test(difffile) === true) {
                                                    error = "Error: mode is set to 'diff', but no diff code detected.";
                                                } else {
                                                    diff = difffile;
                                                }
                                            }
                                            exitfunc();
                                        }
                                    } else {
                                        if (mode === "diff" && diff === "") {
                                            if (diffres === "" && difffile === undefined || new RegExp(/^(\s*)$/).test(difffile) === true) {
                                                error = "Error: mode is set to 'diff', but no diff code detected.";
                                            } else {
                                                diff = difffile;
                                            }
                                        }
                                        exitfunc();
                                    }
                                });
                            });
                        }
                    },
                    exitfunc = function () {
                        if (lang === "text" && (mode === "beautify" || mode === "minify")) {
                            error = source;
                        }
                        if (source === "" || source === undefined) {
                            error = "Error: no source code detected.";
                        }
                        if (out === "email" && (email === undefined || new RegExp(/^(\s*)$/).test(email) === true)) {
                            error = "Error: output set to \"email\" and no email address is supplied.";
                        } else {
                            email = email.replace(/\s+/g, " ").replace(/;/g, ",").replace(/\s*\,\s*/g, ",").split(",");
                        }
                        if (sourcefile !== undefined && new RegExp(/^(\s*)$/).test(sourcefile) !== true) {
                            source = sourcefile;
                        }
                        if (source + diff > 2097152) {
                            error = "Error: query size exceeds 2mb.";
                        }
                        if (error !== undefined) {
                            res.writeHead(200, "OK", {
                                'Content-Type': 'text/plain'
                            });
                            res.write(error);
                            res.end();
                        } else {
                            process.on('uncaughtException', function (err) {
                                mailer.send({
                                    to: "austin.cheney@travelocity.com",
                                    from: "api@prettydiff.com",
                                    subject: "Pretty Diff - Auto Error",
                                    contenttype: "text/plain",
                                    body: err.stack + "\n\nsource: " + api.source + "\n\ndiff: " + api.diff + "\n\nmode: " + api.mode + "\n\nlang: " + api.lang + "\n\nout: " + out + "\n\nemail: " + email + "\n\ncsvchar: " + api.csvchar + "\n\ninsize" + api.insize + "\n\ninchar" + api.inchar + "\n\ncomments: " + api.comments + "\n\nstyle: " + api.style + "\n\nhtml: " + api.html + "\n\ncontext: " + api.context + "\n\nquote: " + api.quote + "\n\nsemicolon: " + api.semicolon + "\n\ndiffview: " + api.diffview + "\n\nsourcelabel: " + api.sourcelabel + "\n\ndifflabel: " + api.difflabel
                                });
                                res.writeHead(200, "OK", {
                                    'Content-Type': 'text/plain'
                                });
                                res.write("Pretty Diff API has encountered an unexpected error.  The error has been reported and will be fixed soon.");
                                res.end();
                            });
                            output = prettydiff.api(api);
                            htmlHeading = function () {
                                var filegif,
                                    accept = String(req.headers.accept).split(";")[0],
                                    charset = "text/html",
                                    doctype = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd"><html lang="en">';
                                if (accept.indexOf("application/xhtml+xml") !== -1) {
                                    doctype = '<?xml version="1.0" encoding="UTF-8" ?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">';
                                    charset = "application/xhtml+xml";
                                    //output[0] = output[0].replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/</g, "&gt;");
                                }
                                if (mode === "beautify") {
                                    if (lang === "javascript") {
                                        filegif = "a";
                                    } else if (lang === "css") {
                                        filegif = "b";
                                    } else if (lang === "markup") {
                                        filegif = "c";
                                    } else if (lang === "csv") {
                                        filegif = "d";
                                    }
                                } else if (mode === "minify") {
                                    if (lang === "javascript") {
                                        filegif = "e";
                                    } else if (lang === "css") {
                                        filegif = "f";
                                    } else if (lang === "markup") {
                                        filegif = "g";
                                    } else if (lang === "csv") {
                                        filegif = "h";
                                    }
                                } else if (mode === "diff") {
                                    if (lang === "javascript") {
                                        filegif = "i";
                                    } else if (lang === "css") {
                                        filegif = "j";
                                    } else if (lang === "markup") {
                                        filegif = "k";
                                    } else if (lang === "csv") {
                                        filegif = "l";
                                    } else if (lang === "text") {
                                        filegif = "m";
                                    }
                                } else {
                                    filegif = "n";
                                }
                                return [charset, doctype + '<head><title>Pretty Diff - The API</title><link rel="canonical" href="http://prettydiff.com/" type="' + charset + '"/><meta http-equiv="Content-Type" content="' + charset + ';charset=UTF-8"/><meta name="robots" content="index, follow"/><meta name="DC.title" content="Pretty Diff - The difference tool"/><link rel="icon" type="image/gif" href="http://mailmarkup.org/favicon.gif"/><link rel="meta" href="http://prettydiff.com/labels.rdf" type="application/rdf+xml" title="ICRA labels"/><meta http-equiv="pics-Label" content=\'(pics-1.1 "http://www.icra.org/pics/vocabularyv03/" l gen true for "http://prettydiff.com" r (n 0 s 0 v 0 l 0 oa 0 ob 0 oc 0 od 0 oe 0 of 0 og 0 oh 0 c 1) gen true for "http://www.mailmarkup.org" r (n 0 s 0 v 0 l 0 oa 0 ob 0 oc 0 od 0 oe 0 of 0 og 0 oh 0 c 1))\'/><meta name="author" content="Austin Cheney"/><meta name="description" content="Pretty Diff tool can minify, beautify, or diff between minified and beautified code.This tool can even beautify and minify HTML."/><meta name="distribution" content="Global"/><meta http-equiv="Page-Enter" content="blendTrans(Duration=0)"/><meta http-equiv="Page-Exit" content="blendTrans(Duration=0)"/><meta http-equiv="content-style-type" content="text/css"/><meta name="google-site-verification" content="qL8AV9yjL2-ZFGV9ey6wU3t7pTZdpD4lIetUSiNen7E"/><link rel="stylesheet" type="text/css" href="http://prettydiff.com/diffview.css" media="all"/></head><body id="apireturn"><h1>Pretty Diff - The difference tool</h1><img src="http://prettydiff.com/api' + filegif + '.gif" alt=""/><span class="clear"></span><div id="diffoutput">'];
                            };
                            heading = htmlHeading();
                            if (mode === "beautify" || mode === "minify") {
                                if (out === "download" || out === "email") {
                                    if (mode === "diff") {
                                        filename = "html";
                                    } else if (lang === "css") {
                                        filename = "css";
                                    } else if (lang === "csv") {
                                        filename = "csv";
                                    } else if (lang === "javascript" && out !== "email") {
                                        filename = "js";
                                    } else if (lang === "markup") {
                                        if (source.indexOf("<html") !== -1 && source.indexOf("</html>") !== -1) {
                                            filename = "html";
                                        } else if (source.search(/\s*<\?xml/i) === 0) {
                                            filename = "xml";
                                        } else {
                                            filename = "txt";
                                        }
                                    }
                                    if (sfilename === "") {
                                        filename = "prettydiff." + filename;
                                        filenamea = "prettydiff_analysis.html";
                                    } else {
                                        filename = sfilename + "." + filename;
                                        filenamea = sfilename + "_analysis.html";
                                    }
                                }
                                if (out === "download") {
                                    res.writeHead(200, "OK", {
                                        'Content-Type': 'text/plain',
                                        'Content-Disposition': 'attachment; filename=' + filename
                                    });
                                    res.write(output[0]);
                                } else if (out === "email") {
                                    res.writeHead(200, "OK", {
                                        'Content-Type': heading[0]
                                    });
                                    res.write(heading[1] + '<p>Email sent to:</p><ul><li>' + email.join('</li><li>') + '</li></ul></div></body></html>');
                                    if (email.length > 10) {
                                        b = 10;
                                    } else {
                                        b = email.length;
                                    }
                                    for (a = 0; a < b; a += 1) {
                                        mailer.send({
                                            to: email[a],
                                            from: "api@prettydiff.com",
                                            subject: "Pretty Diff api response with code attachment.",
                                            contenttype: "text/plain",
                                            attachment: output[0],
                                            filen: filename,
                                            attachmenta: heading[1] + output[1] + "</div></body></html>",
                                            filena: filenamea,
                                            contenttypea: heading[0],
                                            body: "Code processed by PrettyDiff.com is attached to this email."
                                        });
                                    }
                                } else {
                                    res.writeHead(200, "OK", {
                                        'Content-Type': heading[0]
                                    });
                                    res.write(heading[1] + '</div><textarea cols="80" rows="10">' + output[0] + '</textarea></body></html>');
                                }
                            } else {
                                if (out === "download") {
                                    res.writeHead(200, "OK", {
                                        'Content-Type': heading[0],
                                        'Content-Disposition': 'attachment; filename=prettydiff.html'
                                    });
                                    res.write(heading[1] + output[1] + "</div>" + output[0] + "</body></html>");
                                } else if (out === "email") {
                                    res.writeHead(200, "OK", {
                                        'Content-Type': heading[0]
                                    });
                                    res.write(heading[1] + '<p>Email sent to:</p><ul><li>' + email.join('</li><li>') + '</li></ul></div></body></html>');
                                    if (email.length > 10) {
                                        b = 10;
                                    } else {
                                        b = email.length;
                                    }
                                    for (a = 0; a < b; a += 1) {
                                        mailer.send({
                                            to: email[a],
                                            from: "api@prettydiff.com",
                                            subject: "Pretty Diff api response with code attachment.",
                                            contenttype: heading[0],
                                            attachment: heading[1] + output[1] + "</div>" + output[0] + "</body></html>",
                                            body: "Code processed by PrettyDiff.com is attached to this email.",
                                            filen: "prettydiff.html"
                                        });
                                    }
                                } else {
                                    res.writeHead(200, "OK", {
                                        'Content-Type': heading[0]
                                    });
                                    res.write(heading[1] + output[1] + "</div>" + output[0] + "</body></html>");
                                }
                            }
                            res.end();
                        }
                    };
                api.mode = "beautify";
                api.lang = "javascript";
                api.csvchar = ",";
                api.indent = "";
                api.insize = "4";
                api.inchar = " ";
                api.comments = "indent";
                api.style = "indent";
                api.topcoms = false;
                api.html = false;
                api.context = "";
                api.content = false;
                api.quote = false;
                api.semicolon = false;
                api.diffview = "sidebyside";
                api.sourcelabel = "base";
                api.difflabel = "new";
                for (a = 0; a < b; a += 1) {
                    if (apidata[a].indexOf("sourcefile") === 0) {
                        name = "sourcefile";
                        if (apidata[a].length < apidata[a].substr(apidata[a].indexOf("\r\n\r\n") + 4)) {
                            sourcefile = apidata[a].substr(apidata[a].indexOf("\r\n\r\n") + 3);
                            sfilename = apidata[a].substr(apidata[a].indexOf("filename=\"") + 10);
                            sfilename = sfilename.substr(0, sfilename.search(/\W/));
                        }
                    } else if (apidata[a].indexOf("difffile") === 0) {
                        name = "difffile";
                        if (apidata[a].length !== apidata[a].substr(apidata[a].indexOf("\r\n\r\n") + 3)) {
                            difffile = apidata[a].substr(apidata[a].indexOf("\r\n\r\n") + 3);
                        }
                    } else {
                        name = apidata[a].substr(0, apidata[a].indexOf("\"\r\n\r\n"));
                        if (apidata[a] !== name + "\"\r\n\r\n") {
                            data = apidata[a].substr(name.length + 5);
                        }
                    }
                    if ((name === "source" || name === "diff" || name === "csvchar" || name === "inchar" || name === "sourcelabel" || name === "difflabel" || name === "sourcepath" || name === "diffpath") && data !== "") {
                        if (name === "source") {
                            api.source = data;
                        } else if (name === "diff") {
                            api.diff = data;
                        } else if (name === "csvchar") {
                            api.csvchar = data;
                        } else if (name === "inchar") {
                            api.inchar = data;
                        } else if (name === "sourcelabel") {
                            api.sourcelabel = data;
                        } else if (name === "difflabel") {
                            api.difflabel = data.replace(/(\r\n)?\-{29}\d+\-{2}(\r\n)?/g, "");
                        } else if (name === "diffpath") {
                            diffpath = data;
                        }
                    } else if (name === "indent") {
                        api.indent = data.toLowerCase();
                    } else if (name === "mode") {
                        data = data.toLowerCase();
                        if (data === "minify" || data === "diff") {
                            api.mode = data;
                        }
                    } else if (name === "lang") {
                        data = data.toLowerCase();
                        if (data === "css" || data === "csv" || data === "markup" || data === "text" || data === "auto") {
                            api.lang = data;
                        }
                    } else if (name === "out") {
                        data = data.toLowerCase();
                        if (data === "download" || data === "email") {
                            out = data;
                        }
                    } else if (name === "email") {
                        email = data;
                    } else if (name === "insize" || name === "context") {
                        if (Number(data) === Number(data)) {
                            if (name === "insize") {
                                api.insize = data;
                            } else {
                                api.context = data;
                            }
                        }
                    } else if (name === "comments" || name === "style") {
                        if (data.toLowerCase() === "noindent") {
                            if (name === "comments") {
                                api.comments = "noindent";
                            } else if (name === "style") {
                                api.style = "noindent";
                            }
                        }
                    } else if (name === "html") {
                        if (data.toLowerCase() === "html-yes") {
                            api.html = "html-yes";
                        }
                    } else if (name === "content") {
                        if (data.toLowerCase() === "content-yes") {
                            api.content = true;
                        }
                    } else if (name === "quote" || name === "semicolon") {
                        data = data.toLowerCase();
                        if (data === "true") {
                            if (name === "quote") {
                                api.quote = true;
                            } else {
                                api.semicolon = true;
                            }
                        }
                    } else if (name === "topcoms" && data === "true") {
                        api.topcoms = true;
                    } else if (name === "diffview") {
                        if (data.toLowerCase() === "inline") {
                            api.diffview = "inline";
                        }
                    }
                }
                if (sourcelabel === diffview) {
                    sourcelabel = "";
                }
                if (apichunk.join("").indexOf("pdiff_sourcepath") !== -1) {
                    sourcepath = apichunk.join("").split("pdiff_sourcepath\"\r\n\r\n");
                    sourcepath = sourcepath[1].split("pdiff_");
                    sourcepath = sourcepath[0].replace(/(\r\n)?\-{29}\d+\r\nContent\-Disposition\: form\-data; name\="/g, "");
                    if (sourcepath !== "") {
                        getsourcepath(sourcepath);
                    } else if (mode === "diff" && apichunk.join("").indexOf("pdiff_diffpath") !== -1) {
                        diffpath = apichunk.join("").split("pdiff_diffpath\"\r\n\r\n");
                        diffpath = diffpath[1].split("pdiff_");
                        diffpath = diffpath[0].replace(/(\r\n)?\-{29}\d+\r\nContent\-Disposition\: form\-data; name\="/g, "");
                        if (diffpath !== "") {
                            getdiffpath(diffpath);
                        } else {
                            if (mode === "diff" && diff === "") {
                                if (diffres === "" && difffile === undefined || new RegExp(/^(\s*)$/).test(difffile) === true) {
                                    error = "Error: mode is set to 'diff', but no diff code detected.";
                                } else {
                                    diff = difffile;
                                }
                            }
                            exitfunc();
                        }
                    } else {
                        if (mode === "diff" && diff === "") {
                            if (diffres === "" && difffile === undefined || new RegExp(/^(\s*)$/).test(difffile) === true) {
                                error = "Error: mode is set to 'diff', but no diff code detected.";
                            } else {
                                diff = difffile;
                            }
                        }
                        exitfunc();
                    }
                } else {
                    if (mode === "diff" && diff === "") {
                        if (difffile === undefined || new RegExp(/^(\s*)$/).test(difffile) === true) {
                            error = "Error: mode is set to 'diff', but no diff code detected.";
                        } else {
                            diff = difffile;
                        }
                    }
                    exitfunc();
                }

            });
        }
    }
}).listen(8000);