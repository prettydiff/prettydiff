<?php
include('header.php');
echo('<body id="apitest"><h1>Pretty Diff - Bug Submitter</h1><form method="post" action="http://prettydiff.com:8000/bug" enctype="multipart/form-data">');
echo('<p><label for="description">Description of problem (minimum of 25 characters required)</label><textarea id="description" name="pdiff_description" rows="40" cols="40"></textarea></p>');
echo('<p><label for="source">Source code causing the problem (optional)</label><textarea id="source" name="pdiff_source" rows="40" cols="40"></textarea></p>');
echo('<p><label for="email">Email address in case I need more information (optional)</label><input type="text" name="pdiff_email" id="email"/></p>');
echo('<p><input type="submit" value="submit"/></p>');
//echo('<input type="hidden" name="pdiff_hidden" value="default" id="hidden"/>')
echo('</form>');
//echo('<script type="text/javascript">var button = function () {document.getElementById("hidden").value = "true"};</script>');
echo('</body></html>'); ?>
