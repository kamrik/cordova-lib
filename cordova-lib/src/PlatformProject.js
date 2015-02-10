/* jshint unused:false, quotmark:false, sub:true */
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



exports.PlatformProject = PlatformProject;
function PlatformProject() {
    // Intentionally left blank
}


PlatformProject.prototype.open = open;
function open(root) {
    var self = checkThis(this);
    var rootDir = root || self.root;
    self.root = rootDir;

    // TMP: the parser + handler should be a bunch of functions defined as methods
    // here and partially overridden in AndroidProject.
    var ParserConstructor = require('./cordova/metadata/' + self.platform + '_parser');
    self.parser = new ParserConstructor(self.root);
    self.handler = require('./plugman/platforms/' + self.platform);
    self.wwwDir = self.handler.www_dir(self.root);

    self.jsModuleObjects = [];

    self.installedPlugins = [];  // TODO: load this from persisted info, if any.
}

PlatformProject.prototype.init = init;
function init(platformTemplateDir, rootDir, opts) {
    var self = checkThis(this);
    self.root = rootDir;
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
    var self = checkThis(this);
    var plugins = self.loadPlugins(pluginDirs);

    // Install plugins into this platform project
    // NEXT2: check some constraints (dependencies, compatibility to target platfor(s))
    // NEXT1: validate variables are ok for all plugins (should be done per platform)
    // NEXT2: Check <engine> tags against platform version(s)

    // NEXT1: hooks before_plugin_install (context is the project object)

    // Handle install for all the files / assets
    plugins.forEach(function(p) {
        var sourceFiles = p.getSourceFiles(self.platform);
        var headerFiles = p.getHeaderFiles(self.platform);
        var resourceFiles = p.getResourceFiles(self.platform);
        var frameworkFiles = p.getFrameworks(self.platform);
        var libFiles = p.getLibFiles(self.platform);
        var assetFiles = p.getAssets(self.platform);

        var handler = self.handler;
        var installer = handler['source-file'].install;
        sourceFiles.forEach(function(item) {
            installer(item, p.dir, self.root, p.id, {});
        });

        installer = handler['header-file'].install;
        headerFiles.forEach(function(item) {
            installer(item, p.dir, self.root, p.id, {});
        });

        installer = handler['resource-file'].install;
        resourceFiles.forEach(function(item) {
            installer(item, p.dir, self.root, p.id, {});
        });

        installer = handler['framework'].install;
        frameworkFiles.forEach(function(item) {
            installer(item, p.dir, self.root, p.id, {});
        });

        installer = handler['lib-file'].install;
        libFiles.forEach(function(item) {
            installer(item, p.dir, self.root, p.id, {});
        });

        // This was originally part of prepare
        // Need to either redo on each prepare, or put in a staging www dir
        // that will be later copied into the real www dir on each prepare / www update.
        assetFiles.forEach(function(item) {
            common.asset.install(item, p.dir, self.wwwDir); // use plugins_wwww for this
        });

        // Save/update metadata in project
        self.installedPlugins.push(p);

        // Do js magic for plugins (part of prepare)
        var jsModules = p.getJsModules(self.platform);
        jsModules.forEach(function(jsModule) {
            // addJsModule(jsModule)
            self.copyJsModule(jsModule, p);
        });
    });

    self.savePluginsList();  // this one should also go into plugins_www

    // ## Do config magic for plugins
    // config-changes.PlatformMunger does a lot of things that are too smart
    // It caches and writes its own files (via ConfigKeeper)
    // Keeps track of how many plugins wanted the same change and deals with uninstallation
    // Shorten it
    // Move some of the logic into platforms - the plist stuff and windows manifests stuff
    var munge = {files:{}};
    var munger = new config_changes.PlatformMunger(self.platform, self.root, '', {save:__.noop}, self.pluginProvider); //
    plugins.forEach(function(p){
        var plugin_munge = munger.generate_plugin_config_munge(p.dir, p.vars);  // TODO: vars is not part of PluginInfo, make sure we get is from somewhere
        mungeutil.increment_munge(munge, plugin_munge);
    });

    // Apply the munge
    for (var file in munge.files) {
        munger.apply_file_munge(file, munge.files[file]); // Should be overrideable by the platform, generic apply_xml_munge, for ios either framework of xml.
    }

    munger.save_all();

    // Save a copy of parser.config_xml() at this point. With all changes from plugins, but no changes merged from project config.

    // TODO: Solve the plugin development case where a single plugin needs to be removed and reinstalled quickly.

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
    var self = checkThis(this);
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

// copied from plugman/prepare.js - old way, not browserify, needs refactoring via self.fs
PlatformProject.prototype.copyJsModule = copyJsModule;
function copyJsModule(module, pluginInfo) {
    var self = checkThis(this);
    var platformPluginsDir = path.join(self.wwwDir, 'plugins');
    // Copy the plugin's files into the www directory.
    // NB: We can't always use path.* functions here, because they will use platform slashes.
    // But the path in the plugin.xml and in the cordova_plugins.js should be always forward slashes.
    var pathParts = module.src.split('/');

    var fsDirname = path.join.apply(path, pathParts.slice(0, -1));
    var fsDir = path.join(platformPluginsDir, pluginInfo.id, fsDirname);
    shell.mkdir('-p', fsDir);

    // Read in the file, prepend the cordova.define, and write it back out.
    var moduleName = pluginInfo.id + '.';
    if (module.name) {
        moduleName += module.name;
    } else {
        var result = module.src.match(/([^\/]+)\.js/);
        moduleName += result[1];
    }

    var fsPath = path.join.apply(path, pathParts);
    var scriptContent = fs.readFileSync(path.join(pluginInfo.dir, fsPath), 'utf-8').replace(/^\ufeff/, ''); // Window BOM
    if (fsPath.match(/.*\.json$/)) {
        scriptContent = 'module.exports = ' + scriptContent;
    }
    scriptContent = 'cordova.define("' + moduleName + '", function(require, exports, module) { ' + scriptContent + '\n});\n';
    fs.writeFileSync(path.join(platformPluginsDir, pluginInfo.id, fsPath), scriptContent, 'utf-8');

    // Prepare the object for cordova_plugins.json.
    var obj = {
        file: ['plugins', pluginInfo.id, module.src].join('/'),
        id: moduleName
    };
    if (module.clobbers.length > 0) {
        obj.clobbers = module.clobbers.map(function(o) { return o.target; });
    }
    if (module.merges.length > 0) {
        obj.merges = module.merges.map(function(o) { return o.target; });
    }
    if (module.runs) {
        obj.runs = true;
    }

    // Add it to the list of module objects bound for cordova_plugins.json
    self.jsModuleObjects.push(obj);
}

PlatformProject.prototype.savePluginsList = savePluginsList;
function savePluginsList() {
    var self = checkThis(this);
    // Write out moduleObjects as JSON wrapped in a cordova module to cordova_plugins.js
    var final_contents = "cordova.define('cordova/plugin_list', function(require, exports, module) {\n";
    final_contents += 'module.exports = ' + JSON.stringify(self.jsModuleObjects,null,'    ') + ';\n';
    final_contents += 'module.exports.metadata = \n';
    final_contents += '// TOP OF METADATA\n';
    var pluginMetadata = {};
    self.installedPlugins.forEach(function (p) {
        pluginMetadata[p.id] = p.version;
    });
    final_contents += JSON.stringify(pluginMetadata, null, '    ') + '\n';
    final_contents += '// BOTTOM OF METADATA\n';
    final_contents += '});'; // Close cordova.define.

    events.emit('verbose', 'Writing out cordova_plugins.js...');
    fs.writeFileSync(path.join(self.wwwDir, 'cordova_plugins.js'), final_contents, 'utf-8');
}

function checkThis(t) {
    if (!(t instanceof PlatformProject)) {
        throw new Error('Function not bound properly to `this`.');
    }
    return t;
}
