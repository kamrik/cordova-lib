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


var cdv = {};
module.exports = cdv;


cdv.PlatformProject = PlatformProject;
function PlatformProject(root) {
    var self = this;
    // TMP: this has to be set in the derived class constructor
    self.platform = 'android';
    self.root = root;
}


PlatformProject.prototype.open = open;
function open() {
    var self = this;

    // TMP: the parser should be a class derived from PlatformProject.
    var ParserModule = require('./cordova/metadata/' + self.platform + '_parser');
    self.parser = new ParserModule(self.root);
}

PlatformProject.prototype.init = init;
function init(platformTemplateDir, opts) {
    var self = this;
    opts = opts || {};
    var copts = { stdio: 'inherit' };

    // TODO, make normal logging, be able to accept different loggers
    var logger = opts.logger || console;

    var bin = path.join(platformTemplateDir, 'bin', 'create');
    var args = [self.root];

    if (opts.link) {
        args.push('--link');
    }

    // Sync version, use superspawn for Async.
    shell.exec([bin].concat(args).join(' '));
    // return superspawn.spawn(bin, args, copts);

    self.open();

    // TMP: Copy the default config.xml
    // It should just sit at parser.config_xml() from the beginning
    // Either savepoints or smart enough merging should take care of it all
    var defaultRuntimeConfigFile = path.join(self.root, 'cordova', 'defaults.xml');
    shell.cp('-f', defaultRuntimeConfigFile, self.parser.config_xml());
}


PlatformProject.prototype.addPluginsFrom = addPluginsFrom;
function addPluginsFrom(pluginDirs, opts) {
    var self = this;
    var plugins = self.loadPlugins(pluginDirs);
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


// ################# Helpers

PlatformProject.prototype.loadPlugins = loadPlugins;
function loadPlugins(pluginDirs) {
    var self = this;
    if (!__.isArray(pluginDirs)) {
        pluginDirs = [pluginDirs];
    }

    if (!self.pluginProvider)
        self.pluginProvider = new PluginInfoProvider();

    var plugins = pluginDirs.map(function(d) {
        return self.pluginProvider.getAllWithinSearchPath(d);
    });
    plugins = __.flatten(plugins);
    return plugins;
}

