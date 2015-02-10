#!/usr/bin/env node

var cdv = require('./cdv');
var shell = require('shelljs');


platformTemplateDir = '/Users/kamrik/src/coreproj/node_modules/cordova-android';
projDir = '/tmp/cdvtest'

shell.rm('-rf', projDir);
var prj = new cdv.PlatformProject(projDir);
prj.init(platformTemplateDir);

prj.addPluginsFrom('/Users/kamrik/src/coreproj/node_modules');
