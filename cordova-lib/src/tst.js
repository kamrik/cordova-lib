#!/usr/bin/env node

var AndroidProject = require('./AndroidProject');
var shell = require('shelljs');
var events = require('./events');
var ConfigParser  = require('./configparser/ConfigParser');

// Legacy logging
events.on('log', console.log);
events.on('error', console.error);
events.on('warn', console.warn);
events.on('verbose', console.log);



var platformTemplateDir = '/Users/kamrik/src/coreproj/node_modules/cordova-android';
var projDir = '/tmp/cdvtest';

shell.rm('-rf', projDir);
var prj = new AndroidProject();
prj.init(platformTemplateDir, projDir);

prj.addPluginsFrom('/Users/kamrik/src/coreproj/node_modules');

var cfg = new ConfigParser('/Users/kamrik/src/coreproj/app/config.xml');
prj.updateConfig(cfg);
prj.copyWww('/Users/kamrik/src/coreproj/app/www')
prj.run();
