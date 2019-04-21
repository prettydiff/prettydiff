import "../js/browser.js";
(function () {
    let button = document.getElementsByTagName("button")[0],
        execute = function () {
            let prettydiff = window.prettydiff,
                options = prettydiff.options,
                output = "";
            options.api = "dom";
            options.language = "auto";
            options.lexer = "script";
            options.mode = "beautify";
            options.source = document.getElementById("input").value;
            output = prettydiff(options);
            document.getElementById("output").value = output;
        };
    button.onclick = execute;
}());