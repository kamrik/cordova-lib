#!/usr/bin/env node

var cdv = require('./cdv');
var shell = require('shelljs');


platformDir = '/Users/kamrik/src/coreproj/node_modules/cordova-android';
projDir = '/tmp/cdvtest'

// shell.rm('-rf', projDir);
// var prj = cdv.createProject(platformDir, projDir);

var prj = cdv.openProject(projDir);
prj.addPluginsFrom('/Users/kamrik/src/coreproj/node_modules');
