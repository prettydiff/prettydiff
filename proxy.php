<?php
$referer = $_SERVER['HTTP_REFERER'];
$refpos = strpos($referer, 'prettydiff.com');
if ($refpos === 0 || $refpos === 7 || $refpos === 11) {
    $x = $_GET['x'];
    //$r = file_get_contents($x);
    //echo($r);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $x);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $result = curl_exec($ch);
    curl_close($ch);
    header("Content-type: text/plain;charset=UTF-8");
    echo($result);
} else {
    header("HTTP/1.1 301 Moved Permanently");
    header("Location: http://prettydiff.com/"); 
}
?>