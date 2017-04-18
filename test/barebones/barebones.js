/*global document, global*/

var args = JSON.parse(document.getElementById("object").value),
    button = document.getElementById("button");
button.onclick = function () {
    "use strict";
    args.source = document
        .getElementById("input")
        .value;
    if (args.mode === "parse") {
        document
            .getElementById("output")
            .value = JSON.stringify(global.prettydiff.prettydiff(args));
    } else {
        document
            .getElementById("output")
            .value = global
            .prettydiff
            .prettydiff(args);
    }
};