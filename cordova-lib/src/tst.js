#!/usr/bin/env node

var AndroidProject = require('./AndroidProject');
var shell = require('shelljs');
var path = require('path');
var events = require('./events');
var ConfigParser  = require('./configparser/ConfigParser');

// Legacy logging
events.on('log', console.log);
events.on('error', console.error);
events.on('warn', console.warn);
events.on('verbose', console.log);



var projDir = '/tmp/cdvtest';
var configXml = '/Users/kamrik/src/coreproj/app/config.xml';
var wwwDir = '/Users/kamrik/src/coreproj/app/www';
var nodeModulesDir = '/Users/kamrik/src/coreproj/node_modules';
var platformTemplateDir = path.join(nodeModulesDir, 'cordova-android');

// Nuke the old dir entirely
shell.rm('-rf', projDir);


var prj = new AndroidProject();

// Run `create` script from the platform template
prj.init(platformTemplateDir, projDir);

// Add all plugins from node_modules dir
prj.addPluginsFrom(nodeModulesDir);

// Load config xml
var cfg = new ConfigParser(configXml);
prj.updateConfig(cfg);

// Copy www dir
prj.copyWww(wwwDir);

// save is currently a noop, but may be needed later, and/or might be implied by
// build or run.
prj.save();

// Build / run
prj.build();


