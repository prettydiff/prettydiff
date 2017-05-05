(function prep() {
    "use strict";
    var node = {
            child: require("child_process").exec
        },
        a = 1;
    node.child("git clone https://github.com/prettydiff/biddle.git", function prep_clone(cer, stdcout, stdcer) {
        if (cer !== null) {
            a = -10;
            return console.log(cer);
        }
        if (stdcer !== null && stdcer !== "") {
            a = -10;
            return console.log(stdcer);
        }
        console.log("biddle clone complete!");
        node.child("node biddle global", {cwd:"biddle"}, function prep_clone_global(ger, stdgout, stdger) {
            if (ger !== null) {
                a = -10;
                return console.log(ger);
            }
            if (stdger !== null && stdger !== "") {
                a = -10;
                return console.log(stdger);
            }
            console.log("biddle global complete!");
            node.child("biddle install http://prettydiff.com/downloads/jslint/jslint_latest.zip", function prep_clone_global_install(ier, stdiout, stdier) {
                var test = require("./lint.js");
                a = -10;
                if (ier !== null) {
                    return console.log(ier);
                }
                if (stdier !== null && stdier !== "") {
                    return console.log(stdier);
                }
                console.log("Pretty Diff test execute!");
                test();
                return [stdcout, stdgout, stdiout];
            });
        });
    });
    do {
        setTimeout(console.log("Waiting..."), 1000);
    } while (a > 0);
}());