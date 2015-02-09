/* jshint unused:false */
var Q = require('q');
var path = require('path');
var fs = require('fs');
var shell = require('shelljs');
var et = require('elementtree');
var __ = require('underscore');


var superspawn = require('./cordova/superspawn');
var ConfigParser  = require('./configparser/ConfigParser');
var PluginInfoProvider = require('./PluginInfoProvider');
var ConfigKeeper = require('./plugman/util/ConfigKeeper');
var config_changes  = require('./plugman/util/config-changes');
var mungeutil = require('./plugman/util/munge-util');


// TODO: don't use events, use the event dispatcher inside the project object
var events = require('./events');
var common = require('./plugman/platforms/common');

var pluginProvider = new PluginInfoProvider();



var cdv = {};
module.exports = cdv;


cdv.createProject = createProject;
function createProject(platformSrcDir, projectDir, opts) {
    opts = opts || {};
    var copts = { stdio: 'inherit' };

    // TODO, make normal logging, be able to accept different loggers
    var logger = opts.logger || console;

    var bin = path.join(platformSrcDir, 'bin', 'create');
    var args = [projectDir];

    if (opts.link) {
        args.push('--link');
    }

    // Sync version, use superspawn for Async.
    shell.exec([bin].concat(args).join(' '));
    // return superspawn.spawn(bin, args, copts);

    return new PlatformProject(projectDir);
}


cdv.openProject = openProject;
function openProject(projectDir, opts) {
    return new PlatformProject(projectDir);
}


function PlatformProject(root) {
    var self = this;
    self.root = root;

}


PlatformProject.prototype.addPluginsFrom = addPluginsFrom;
function addPluginsFrom(pluginDirs, opts) {

    console.log('Plugins: ' + plugins[0].id);
}

PlatformProject.prototype.updateConfig = updateConfig;
function updateConfig(cfg) {

}

PlatformProject.prototype.copyWww = copyWww;
function copyWww(wwwDir, opts) {

}

PlatformProject.prototype.save = save;
function save() {

}

PlatformProject.prototype.build = build;
function build() {

}

PlatformProject.prototype.run = run;
function run() {

}

/*
PlatformProject.prototype.funcName = funcName;
function funcName(plugins, opts) {

}
*/

function loadPlugins(pluginDirs) {
    if (!__.isArray(pluginDirs)) {
        pluginDirs = [pluginDirs]
    }

    var plugins = pluginDirs.map(pluginDirs, function(d) {
        return pluginProvider.getAllWithinSearchPath(d);
    });
    plugins = __.flatten(plugins);
}

