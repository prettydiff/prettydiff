<?php
include('header.php');
echo('<body id="apitest"><h1>Pretty Diff - API Tester</h1>');
//echo('<h2>Pretty Diff API disabled due to excessive memory consumption.  Investigation is underway to determine how and what triggers this failure.</h2>');

echo('<form method="post" action="http://prettydiff.com:8000/api" enctype="multipart/form-data">');
echo('<p><label for="source">Source Code</label><textarea id="source" name="pdiff_source" rows="40" cols="40"></textarea></p>');
echo('<p><label for="sourcefile">Source Code</label><input type="file" id="sourcefile" name="pdiff_sourcefile"/></p>');
echo('<p><label for="sourcepath">Source URI</label><input type="text" id="sourcepath" name="pdiff_sourcepath"/></p>');
echo('<p><label for="diff">Diff Code</label><textarea id="diff" name="pdiff_diff" rows="40" cols="40"></textarea></p>');
echo('<p><label for="difffile">Diff Code</label><input type="file" id="difffile" name="pdiff_difffile"/></p>');
echo('<p><label for="diffpath">Diff URI</label><input type="text" id="diffpath" name="pdiff_diffpath"/></p>');
echo('<p><label for="mode">Mode of Operation</label><select id="diff" name="pdiff_mode"><option value="beautify" selected="selected">beautify</option><option value="minify">minify</option><option value="diff">diff</option></select></p>');
echo('<p><label for="lang">Language</label><select id="lang" name="pdiff_lang"><option value="auto" selected="selected">auto</option><option value="javascript">javascript</option><option value="css">css</option><option value="csv">csv</option><option value="markup">markup</option><option value="text">text</option></select></p>');
echo('<p><label for="csvchar">Character Separating Value</label><input type="text" id="csvchar" name="pdiff_csvchar" value=" "/></p>');
echo('<p><label for="out">Method of Output</label><select id="out" name="pdiff_out"><option value="web" selected="selected">web</option><option value="email">email</option><option value="download">download</option></select></p>');
echo('<p><label for="email">Email Address</label><input type="text" id="email" name="pdiff_email"/></p>');
echo('<p><label for="indent">JavaScript Indentation Style</label><select id="indent" name="pdiff_indent"><option value="knr" selected="selected">knr</option><option value="allman">allman</option></select></p>');
echo('<p><label for="insize">Character Size of Indention</label><input type="text" id="insize" name="pdiff_insize" value="4"/></p>');
echo('<p><label for="inchar">Indention Character</label><input type="text" id="inchar" name="pdiff_inchar" value=" "/></p>');
echo('<p><label for="comments">Comment Indentation</label><select id="comments" name="pdiff_comments"><option value="indent" selected="selected">indent</option><option value="noindent">noindent</option></select></p>');
echo('<p><label for="style">Script and Style Code Indentation</label><select id="style" name="pdiff_style"><option value="indent" selected="selected">indent</option><option value="noindent">noindent</option></select></p>');
echo('<p><label for="html">Presume HTML</label><select id="html" name="pdiff_html"><option value="html-no" selected="selected">html-no</option><option value="html-yes">html-yes</option></select></p>');
echo('<p><label for="context">Diff Context Size</label><input type="text" id="context" name="pdiff_context"/></p>');
echo('<p><label for="content">Ignore Differences in content or string literals</label><select id="content" name="pdiff_content"><option value="content-no" selected="selected">content-no</option><option value="content-yes">content-yes</option></select></p>');
echo('<p><label for="quotes">Ignore Differences in Quote Characters</label><select id="quote" name="pdiff_quote"><option value="false" selected="selected">false</option><option value="true">true</option></select></p>');
echo('<p><label for="semicolon">Ignore Terminating Semicolons</label><select id="semicolon" name="pdiff_semicolon"><option value="false" selected="selected">false</option><option value="true">true</option></select></p>');
echo('<p><label for="diffview">Diff Display</label><select id="diffview" name="pdiff_diffview"><option value="sidebyside" selected="selected">sidebyside</option><option value="inline">inline</option></select></p>');
echo('<p><label for="topcoms">Diff Display</label><select id="topcoms" name="pdiff_topcoms"><option value="false" selected="selected">false</option><option value="true">true</option></select></p>');
echo('<p><label for="sourcelabel">Text Label for Diff Base Code</label><input type="text" id="sourcelabel" name="pdiff_sourcelabel"/></p>');
echo('<p><label for="difflabel">Text Label for Diff New Code</label><input type="text" id="difflabel" name="pdiff_difflabel"/></p>');
echo('<p><input type="submit" value="submit" /></p>');
echo('</form>');
echo('</body></html>'); ?>
