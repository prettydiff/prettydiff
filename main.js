/*global define, brackets, console*/
define(function (require, exports, module) {
    "use strict";

    var CommandManager = brackets.getModule("command/CommandManager"),
        Menus = brackets.getModule("command/Menus"),
        EditorManager = brackets.getModule("editor/EditorManager"),
        Editor = brackets.getModule("editor/Editor").Editor,
        DocumentManager = brackets.getModule("document/DocumentManager"),
        Document = brackets.getModule("document/Document"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU),
        Beau_ID = "austincheney.prettydiff.beautify",
        Mini_ID = "austincheney.prettydiff.minify",
        tab = Editor.getUseTabChar(),
        pd = require("prettydiff"),
        text = "",
        command = [],
        beautify = function () {
            var args = {},
                output = [],
                docText = DocumentManager.getCurrentDocument();
            args.mode = "beautify";
            args.source = docText.getText();
            if (tab === true) {
                args.inchar = "\t";
            }
            output = pd(args);
            docText.setText(output[0]);
        },
        minify = function () {
            console.log("qwer");
        };
    CommandManager.register("Beautify", Beau_ID, beautify);
    command = [{
        key: "Ctrl-Shift-B",
        platform: "win"
    }, {
        key: "Cmd-Shift-B",
        platform: "mac"
    }];
    menu.addMenuItem(Beau_ID, command, "BEFORE", "edit.find");
    CommandManager.register("Minify", Mini_ID, minify);
    command = [{
        key: "Ctrl-Shift-M",
        platform: "win"
    }, {
        key: "Cmd-Shift-M",
        platform: "mac"
    }];
    menu.addMenuItem(Mini_ID, command, "BEFORE", "edit.find");
});