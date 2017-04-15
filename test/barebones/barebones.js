/*global document, global*/

var args = JSON.parse(document.getElementById("object").value),
    button = document.getElementById("button");
button.onclick = function () {
    "use strict";
    args.source = document.getElementById("input").value;
    document.getElementById("output").value = global.prettydiff.prettydiff(args);
};