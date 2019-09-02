# Pretty Diff
A language aware diff, beautification, and minification tool.

* Version - 101.2.6
* [Sparser](https://sparser.io) - 1.4.12

## Try it out - https://prettydiff.com/

[![Build Status](https://semaphoreci.com/api/v1/prettydiff/prettydiff/branches/master/badge.svg)](https://semaphoreci.com/prettydiff/prettydiff)

## Build
### Local install for development
```
git clone https://github.com/prettydiff/prettydiff.git
cd prettydiff

npm install typescript -g
npm install eslint -g
npm install
tsc --pretty

node js/services build
```

### Global install with NPM
```
npm install prettydiff -g
```

## Test it
### Local install for development
```
node js/services test
```
or
```
npm test
```

### Global install with NPM
The instructions for installing Pretty Diff globally via NPM do not indicate installing ESLint or Typescript, but the build and test commands will not work without them.

```
npm install -g typescript
npm install -g eslint
prettydiff test
```

## Usage
The application runs on the terminal with Node.js and in a web browser.

### Terminal
Executing in a terminal shell is powerful when you need access to additional tools, the local file system, or wish to integrate Pretty Diff output into other application tasks.  The application comes with some additional utilities not available to the browser, such as: hashing, base64 encoding, file system tools, and other features.

* To get started execute `prettydiff commands` (global)  or `node js/services commands` (local) for a list of available commands.
* For detailed documentation on a specific command supply the command's name: `prettydiff commands base64` (global) or `node js/services commands base64` (local)
* To see execution details of a specific command specify the *verbose* flag: `node js/services beautify source:myFile.js --verbose`

### Browser
Pretty Diff is written in TypeScript, and so once built runs directly in all modern web browsers.

To get started immediately simply navigate your browser to the project's *index.xhtml* file in the local filesystem.  Browsers restrict some capabilities when executing web applications from the *file* scheme.  The included *index.xhtml* has all supported options dynamically built-in with updated documentation.

To run the web tool in a browser with all capabilities launch a local web server with this command: `prettydiff server` (global) or `node js/services server` (local) and then in your web browser go to http://localhost:9001.  This features a handy file system watcher and a web sockets service for users wanting to experiment with the code.  Once the server is active and the page is open in a web browser any changes to the code will automatically rebuild the project and reload the page.

### Integration
To run Pretty Diff as a utility in a third party application simply include either *js/browser.js* or *js/prettydiff.js*.  Those two files are identical except for the very end where an object named `prettydiff` is assigned.  Both files provide all options with default values assigned to an object named `prettydiff.options`.

#### Browser
**js/browser.js** - In this file an object named `prettydiff` is assigned to the browser's *window* object.  To access Pretty Diff simply call `window.prettydiff();`.  The options exist as `window.prettydiff.options`.  See the [browser demo](tests/browser.html) for an example.  This provides all the necessary code in a single file without any DOM bindings.

#### Node.js
**js/prettydiff.js** - In this file an object named `prettydiff` is assigned to Node's *module.exports*.  To access Pretty Diff simply require the file: `let prettydiff = require("prettydiff");`.  Default options are available as `prettydiff.options`.  To execute simply call `prettydiff();`.

```javascript
// integrate into the browser
let output     = "",
    prettydiff = window.prettydiff,
    options    = window.prettydiff.options;
options.source = "my code";
output         = prettydiff();
// You can include the Pretty Diff code in any way that is convenient,
// whether that is using an HTML script tag or concatenating the
// js/browser.js code with your other code.

// integrate into a Node.js app
let output     = "",
    prettydiff = require("prettydiff"),
    options    = prettydiff.options;
options.source = "my code";
output         = prettydiff();
// You should not have to point to the specific file.
// The js/prettydiff.js is defined as 'main' in the package.json.
```

### Options
For supported option documentation you may read the *documentation.xhtml* file in a browser, [options.md](options.md) markdown file, or use these commands on the terminal:

* Lists all available options: `prettydiff options` (global) or `node js/services options` (local)
* For option specific details specify the option's name: `prettydiff option mode` (global) or `node js/services options mode` (local)
* The option list supports filtering against the documentation headings and values: `prettydiff options mode:diff api:node` (global) or `node js/services options mode:diff api:node` (local)
* All options, configuration, and documentation are located in the file *api/optionsDef.ts* file.  All option related documentation, features, configurations, and defaults are built from this file for all supported environments.

## Supported Languages
- markup
   * [Apache Velocity](https://velocity.apache.org/)
   * [ASP Inline Expression](https://support.microsoft.com/en-us/help/976112/introduction-to-asp-net-inline-expressions-in-the-net-framework)
   * [CFML (ColdFusion Markup Language)](https://www.adobe.com/products/coldfusion-family.html)
   * [Django Inline HTML](https://docs.djangoproject.com/en/2.1/topics/forms/)
   * [Dust.js](https://www.dustjs.com/)
   * [EEX Elixir Templates](https://hexdocs.pm/eex/EEx.html)
   * [EJS (Embedded JavaScript) Templates](https://www.ejs.co/)
   * [ERB (Embedded Ruby)](https://ruby-doc.org/stdlib-1.9.3/libdoc/erb/rdoc/ERB.html)
   * [FreeMarker](https://freemarker.apache.org/)
   * [Genshi](https://genshi.edgewall.org/)
   * [Handlebars](https://handlebarsjs.com/)
   * [HTL (HTML Templating Language)](https://helpx.adobe.com/experience-manager/htl/using/getting-started.html)
   * [HTML](https://www.w3.org/TR/html52/)
   * [Jekyll](https://jekyllrb.com/docs/liquid/)
   * [Jinja](http://jinja.pocoo.org/)
   * [JSTL (Java Standard Tag Library)](https://github.com/eclipse-ee4j/jstl-api)
   * [Liquid](https://shopify.github.io/liquid/)
   * [Mustache](https://mustache.github.io/)
   * [Nunjucks](https://mozilla.github.io/nunjucks/)
   * [SGML](https://www.iso.org/standard/16387.html)
   * [SilverStripe](https://docs.silverstripe.org/en/4/developer_guides/templates/syntax/)
   * [Spacebars templates](http://blazejs.org/guide/spacebars.html)
   * [ThymeLeaf](https://www.thymeleaf.org/doc/tutorials/3.0/usingthymeleaf.html)
   * [Underscore Templates (TPL)](https://underscorejs.org/#template)
   * [Twig](https://twig.symfony.com/)
   * [Vapor Leaf](https://docs.vapor.codes/3.0/leaf/overview/)
   * [Vash](https://github.com/kirbysayshi/vash)
   * [Volt](https://phalcon-php-framework-documentation.readthedocs.io/en/latest/reference/volt.html)
   * [XML](https://www.w3.org/TR/REC-xml/)
   * [XSLT](https://www.w3.org/standards/xml/transformation)
- script
   * [Flow](https://flow.org/)
   * [JavaScript / ECMAScript](https://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf)
   * [JSON](https://json.org/)
   * [QML](https://doc.qt.io/qt-5/qmlfirststeps.html)
   * [React JSX](https://reactjs.org/docs/introducing-jsx.html)
   * [styled-components](https://www.styled-components.com/)
   * [styled-jsx](https://github.com/zeit/styled-jsx#readme)
   * [TSS (Titanium Style Sheets)](https://docs.appcelerator.com/platform/latest/#!/api/Titanium.UI.TextField)
   * [TSX](https://www.typescriptlang.org/docs/handbook/jsx.html)
   * [TypeScript](https://www.typescriptlang.org/)
- style
   * [CSS](https://www.w3.org/Style/CSS/#news)
   * [LESS](http://lesscss.org/)
   * [PostCSS](https://postcss.org/)
   * [SCSS (Sass)](https://sass-lang.com/)

**45** total languages
