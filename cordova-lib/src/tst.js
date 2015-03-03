#!/usr/bin/env node

/* jshint unused: false */

var AndroidProject = require('./AndroidProject');
var IosProject = require('./IosProject');
var shell = require('shelljs');
var path = require('path');
var events = require('./events');
var ConfigParser  = require('./configparser/ConfigParser');
var __ = require('underscore');

// Legacy logging
events.on('log', console.log);
events.on('error', console.error);
events.on('warn', console.warn);
events.on('verbose', console.log);



var projDir = '/tmp/cdvtest';
var configXml = '/Users/kamrik/src/coreproj/app/config.xml';
var wwwDir = '/Users/kamrik/src/coreproj/app/www';
var nodeModulesDir = '/Users/kamrik/src/coreproj/node_modules';
var platformTemplateDir = path.join(nodeModulesDir, 'cordova-ios');


var cfg = new ConfigParser(configXml);

// Declarative info about the project
// this one should be discussed and standardized
var prjInfo = {
    paths: {
        www: wwwDir,
        root: projDir,
        template: platformTemplateDir,
        plugins: [nodeModulesDir],
    },
    cfg: cfg,
};

// Nuke the old dir entirely
shell.rm('-rf', projDir);

var proj = new IosProject();

// Experimenting with ways to mind methods to objects
__.bindAll(proj, 'build', 'run');

proj.create(prjInfo)
    .then(proj.build)  // assumes build is well bound to proj
    .done();

// proj.open(projDir)
//     .then(proj.run)
//     .done();

