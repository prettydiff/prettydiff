#!/bin/bash
set -ev
git clone biddle
cd biddle
node biddle global
export PATH=/home/runner/biddle/bin:$PATH
cd ..
biddle install http://prettydiff.com/downloads/jslint/jslint_latest.zip
node test/lint.js