/*prettydiff.com api.topcoms:true,api.insize:4,api.inchar:" ",api.vertical:true */
/*global ace, define, exports, global*/
/***********************************************************************
 safeSort is written by Austin Cheney on 23 Apr 2015.  Anybody may use
 this code without permission so long as this comment exists verbatim in
 each instance of its use.

 http://mailmarkup.org/
 http://prettydiff.com/
 **********************************************************************/
var safeSort = function safeSort_(array, operation, recursive) {
    "use strict";
    var arTest  = function safeSort_arTest(item) {
            if (typeof item !== "object" || item.length === undefined || item.length < 2) {
                return false;
            }
            return true;
        },
        extref  = function safeSort__extref() {
            //worthless function for backwards compatibility with older versions of V8 node.
            return;
        },
        normal  = function safeSort__normal(item) {
            var done    = [item[0]],
                storeb  = item,
                child   = function safeSort__normal_child() {
                    var a   = 0,
                        len = storeb.length;
                    for (a = 0; a < len; a += 1) {
                        if (arTest(storeb[a]) === true) {
                            storeb[a] = safeSort__normal(storeb[a]);
                        }
                    }
                },
                recurse = function safeSort__normal_recurse(x) {
                    var a      = 0,
                        storea = [],
                        len    = storeb.length;
                    for (a = 0; a < len; a += 1) {
                        if (storeb[a] !== x) {
                            storea.push(storeb[a]);
                        }
                    }
                    storeb = storea;
                    if (storea.length > 0) {
                        done.push(storea[0]);
                        extref(storea[0]);
                    } else {
                        if (recursive === true) {
                            child();
                        }
                        item = storeb;
                    }
                };
            extref = recurse;
            recurse(array[0]);
        },
        descend = function safeSort__descend(item) {
            var c       = 0,
                storeb  = item,
                len     = item.length,
                child   = function safeSort__descend_child() {
                    var a    = 0,
                        lenc = storeb.length;
                    for (a = 0; a < lenc; a += 1) {
                        if (arTest(storeb[a]) === true) {
                            storeb[a] = safeSort__descend(storeb[a]);
                        }
                    }
                },
                recurse = function safeSort__descend_recurse() {
                    var a      = 0,
                        b      = 0,
                        d      = 0,
                        e      = 0,
                        ind    = [],
                        key    = storeb[c],
                        tstore = "",
                        tkey   = typeof key;
                    for (a = c; a < len; a += 1) {
                        tstore = typeof storeb[a];
                        if (storeb[a] > key || (tstore > tkey)) {
                            key = storeb[a];
                            ind = [a];
                        } else if (storeb[a] === key) {
                            ind.push(a);
                        }
                    }
                    d = ind.length;
                    b = d + c;
                    for (a = c; a < b; a += 1) {
                        storeb[ind[e]] = storeb[a];
                        storeb[a]      = key;
                        e              += 1;
                    }
                    c += d;
                    if (c < len) {
                        extref();
                    } else {
                        if (recursive === true) {
                            child();
                        }
                        item = storeb;
                    }
                };
            extref = recurse;
            recurse();
            return item;
        },
        ascend  = function safeSort__ascend(item) {
            var c       = 0,
                storeb  = item,
                len     = item.length,
                child   = function safeSort__ascend_child() {
                    var a    = 0,
                        lenc = storeb.length;
                    for (a = 0; a < lenc; a += 1) {
                        if (arTest(storeb[a]) === true) {
                            storeb[a] = safeSort__ascend(storeb[a]);
                        }
                    }
                },
                recurse = function safeSort__ascend_recurse() {
                    var a      = 0,
                        b      = 0,
                        d      = 0,
                        e      = 0,
                        ind    = [],
                        key    = storeb[c],
                        tstore = "",
                        tkey   = typeof key;
                    for (a = c; a < len; a += 1) {
                        tstore = typeof storeb[a];
                        if (storeb[a] < key || tstore < tkey) {
                            key = storeb[a];
                            ind = [a];
                        } else if (storeb[a] === key) {
                            ind.push(a);
                        }
                    }
                    d = ind.length;
                    b = d + c;
                    for (a = c; a < b; a += 1) {
                        storeb[ind[e]] = storeb[a];
                        storeb[a]      = key;
                        e              += 1;
                    }
                    c += d;
                    if (c < len) {
                        extref();
                    } else {
                        if (recursive === true) {
                            child();
                        }
                        item = storeb;
                    }
                };
            extref = recurse;
            recurse();
            return item;
        };
    if (arTest(array) === false) {
        return array;
    }
    if (recursive === "true") {
        recursive = true;
    } else if (recursive !== true) {
        recursive = false;
    }
    if (operation === "normal") {
        return normal(array);
    }
    if (operation === "descend") {
        return descend(array);
    }
    return ascend(array);
};
if (typeof exports === "object" || typeof exports === "function") {
    //commonjs and nodejs support
    exports.api     = function commonjs(x) {
        "use strict";
        return safeSort(x);
    };
} else if ((typeof define === "object" || typeof define === "function") && (ace === undefined || ace.prettydiffid === undefined)) {
    //requirejs support
    define(function requirejs(require, exports) {
        "use strict";
        exports.api     = function requirejs_export(x) {
            return safeSort(x);
        };
        //worthless if block to appease RequireJS and JSLint
        if (typeof require === "number") {
            return require;
        }
        return exports.api;
    });
}
