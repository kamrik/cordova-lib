/* jshint sub:true */
var fs = require('fs');
var path = require('path');
var Q = require('q');
var shell = require('shelljs');
var unorm = require('unorm');
var plist = require('plist');
var xcode = require('xcode');
var __ = require('underscore');
var pp = require('./PlatformProject');
var CordovaError = require('../CordovaError');
var ConfigParser = require('../configparser/ConfigParser');
var events = require('../events');

// Constructor
module.exports = IosProject;
IosProject.prototype = new pp.PlatformProject();
function IosProject() {
    var self = this;
    self.platform = 'ios';
    __.bindAll(self, 'build', 'run', 'emulate');  // TODO: add all methods and/or find a better way to do this.
}


IosProject.prototype.open = open;
function open(rootDir) {
    var self = checkThis(this);
    pp.PlatformProject.prototype.open.call(self, rootDir);

    self.root = unorm.nfd(self.root);

    try {
        var xcodeproj_dir = fs.readdirSync(self.root).filter(function(e) { return e.match(/\.xcodeproj$/i); })[0];
        if (!xcodeproj_dir) {
            throw new CordovaError('The provided path "' + self.root + '" is not a Cordova iOS project.');
        }
        self.xcodeproj = path.join(self.root, xcodeproj_dir);
        self.originalName = self.xcodeproj.substring(self.xcodeproj.lastIndexOf(path.sep)+1, self.xcodeproj.indexOf('.xcodeproj'));
        self.cordovaproj = path.join(self.root, self.originalName);
    } catch(e) {
        throw new CordovaError('The provided path "' + self.root + '" is not a Cordova iOS project.');
    }

    self.pbxproj = path.join(self.xcodeproj, 'project.pbxproj');
    self.configXml = path.join(self.originalName, 'config.xml');
}

IosProject.prototype.update_from_config = update_from_config;
function update_from_config(cfg) {
    var self = checkThis(this);
    var config = cfg || self.cfg;
    if (config instanceof ConfigParser) {
    } else {
        return Q.reject(new Error('update_from_config requires a ConfigParser object'));
    }
    // CB-6992 it is necessary to normalize characters
    // because node and shell scripts handles unicode symbols differently
    // We need to normalize the name to NFD form since iOS uses NFD unicode form
    var name = unorm.nfd(config.name());
    var pkg = config.ios_CFBundleIdentifier() || config.packageName();
    var version = config.version();

    // Update package id (bundle id)
    var plistFile = path.join(this.cordovaproj, this.originalName + '-Info.plist');
    var infoPlist = plist.parse(fs.readFileSync(plistFile, 'utf8'));
    infoPlist['CFBundleIdentifier'] = pkg;

    // Update version (bundle version)
    infoPlist['CFBundleShortVersionString'] = version;
    var CFBundleVersion = config.ios_CFBundleVersion() || default_CFBundleVersion(version);
    infoPlist['CFBundleVersion'] = CFBundleVersion;

    var orientation = config.getPreference('orientation', self.platform);

    if (orientation && orientation != 'default') {
        switch (orientation.toLowerCase()) {
            case 'portrait':
                infoPlist['UIInterfaceOrientation'] = [ 'UIInterfaceOrientationPortrait' ];
                infoPlist['UISupportedInterfaceOrientations'] = [ 'UIInterfaceOrientationPortrait', 'UIInterfaceOrientationPortraitUpsideDown' ];
                break;
            case 'landscape':
                infoPlist['UIInterfaceOrientation'] = [ 'UIInterfaceOrientationLandscapeLeft' ];
                infoPlist['UISupportedInterfaceOrientations'] = [ 'UIInterfaceOrientationLandscapeLeft', 'UIInterfaceOrientationLandscapeRight' ];
                break;
            default:
                infoPlist['UIInterfaceOrientation'] = [ orientation ];
                delete infoPlist['UISupportedInterfaceOrientations'];
        }
    } else {
        delete infoPlist['UISupportedInterfaceOrientations'];
        delete infoPlist['UIInterfaceOrientation'];
    }

    var info_contents = plist.build(infoPlist);
    info_contents = info_contents.replace(/<string>[\s\r\n]*<\/string>/g,'<string></string>');
    fs.writeFileSync(plistFile, info_contents, 'utf-8');
    events.emit('verbose', 'Wrote out iOS Bundle Identifier to "' + pkg + '"');
    events.emit('verbose', 'Wrote out iOS Bundle Version to "' + version + '"');

    // Update icons
    var icons = config.getIcons('ios');
    var platformRoot = this.cordovaproj;
    var appRoot = self.appRoot;

    // See https://developer.apple.com/library/ios/documentation/userexperience/conceptual/mobilehig/LaunchImages.html
    // for launch images sizes reference.
    var platformIcons = [
        {dest: 'icon-60.png', width: 60, height: 60},
        {dest: 'icon-60@2x.png', width: 120, height: 120},
        {dest: 'icon-60@3x.png', width: 180, height: 180},
        {dest: 'icon-76.png', width: 76, height: 76},
        {dest: 'icon-76@2x.png', width: 152, height: 152},
        {dest: 'icon-small.png', width: 29, height: 29},
        {dest: 'icon-small@2x.png', width: 58, height: 58},
        {dest: 'icon-40.png', width: 40, height: 40},
        {dest: 'icon-40@2x.png', width: 80, height: 80},
        {dest: 'icon.png', width: 57, height: 57},
        {dest: 'icon@2x.png', width: 114, height: 114},
        {dest: 'icon-72.png', width: 72, height: 72},
        {dest: 'icon-72@2x.png', width: 144, height: 144},
        {dest: 'icon-50.png', width: 50, height: 50},
        {dest: 'icon-50@2x.png', width: 100, height: 100}
    ];

    platformIcons.forEach(function (item) {
        var icon = icons.getBySize(item.width, item.height) || icons.getDefault();
        if (icon){
            var src = path.join(appRoot, icon.src),
                dest = path.join(platformRoot, 'Resources/icons/', item.dest);
            events.emit('verbose', 'Copying icon from ' + src + ' to ' + dest);
            shell.cp('-f', src, dest);
        }
    });

    // Update splashscreens
    var splashScreens = config.getSplashScreens('ios');
    var platformSplashScreens = [
        {dest: 'Resources/splash/Default~iphone.png', width: 320, height: 480},
        {dest: 'Resources/splash/Default@2x~iphone.png', width: 640, height: 960},
        {dest: 'Resources/splash/Default-Portrait~ipad.png', width: 768, height: 1024},
        {dest: 'Resources/splash/Default-Portrait@2x~ipad.png', width: 1536, height: 2048},
        {dest: 'Resources/splash/Default-Landscape~ipad.png', width: 1024, height: 768},
        {dest: 'Resources/splash/Default-Landscape@2x~ipad.png', width: 2048, height: 1536},
        {dest: 'Resources/splash/Default-568h@2x~iphone.png', width: 640, height: 1136},
        {dest: 'Resources/splash/Default-667h.png', width: 750, height: 1334},
        {dest: 'Resources/splash/Default-736h.png', width: 1242, height: 2208},
        {dest: 'Resources/splash/Default-Landscape-736h.png', width: 2208, height: 1242}
    ];

    platformSplashScreens.forEach(function(item) {
        var splash = splashScreens.getBySize(item.width, item.height);
        if (splash){
            var src = path.join(appRoot, splash.src),
                dest = path.join(platformRoot, item.dest);
            events.emit('verbose', 'Copying splash from ' + src + ' to ' + dest);
            shell.cp('-f', src, dest);
        }
    });

    var me = this;
    return this.update_build_settings(config).then(function() {
        if (name == me.originalName) {
            events.emit('verbose', 'iOS Product Name has not changed (still "' + me.originalName + '")');
            return Q();
        }

        // TODO: extract this into a separate function.
        // Update product name inside pbxproj file
        var proj = new xcode.project(me.pbxproj);
        var parser = me;
        var d = Q.defer();
        proj.parse(function(err,hash) {
            if (err) {
                d.reject(new Error('An error occured during parsing of project.pbxproj. Start weeping. Output: ' + err));
            } else {
                proj.updateProductName(name);
                fs.writeFileSync(parser.pbxproj, proj.writeSync(), 'utf-8');
                // Move the xcodeproj and other name-based dirs over.
                shell.mv(path.join(parser.cordovaproj, parser.originalName + '-Info.plist'), path.join(parser.cordovaproj, name + '-Info.plist'));
                shell.mv(path.join(parser.cordovaproj, parser.originalName + '-Prefix.pch'), path.join(parser.cordovaproj, name + '-Prefix.pch'));
                shell.mv(parser.xcodeproj, path.join(parser.path, name + '.xcodeproj'));
                shell.mv(parser.cordovaproj, path.join(parser.path, name));
                // Update self object with new paths
                var old_name = parser.originalName;
                parser = new module.exports(parser.path);
                // Hack this shi*t
                var pbx_contents = fs.readFileSync(parser.pbxproj, 'utf-8');
                pbx_contents = pbx_contents.split(old_name).join(name);
                fs.writeFileSync(parser.pbxproj, pbx_contents, 'utf-8');
                events.emit('verbose', 'Wrote out iOS Product Name and updated XCode project file names from "'+old_name+'" to "' + name + '".');
                d.resolve();
            }
        });
        return d.promise;
    });
}

IosProject.prototype.update_build_settings = update_build_settings;
function update_build_settings(cfg) {
    var self = checkThis(this);
    var config = cfg || self.cfg;
    var targetDevice = parseTargetDevicePreference(config.getPreference('target-device', 'ios'));
    var deploymentTarget = config.getPreference('deployment-target', 'ios');

    // no build settings provided, we don't need to parse and update .pbxproj file
    if (!targetDevice && !deploymentTarget) {
        return Q();
    }

    var me = this;
    var d = Q.defer();
    var proj = new xcode.project(this.pbxproj);
    proj.parse(function(err,hash) {
        if (err) {
            d.reject(new Error('An error occured during parsing of project.pbxproj. Start weeping. Output: ' + err));
            return;
        }
        if (targetDevice) {
            events.emit('verbose', 'Set TARGETED_DEVICE_FAMILY to ' + targetDevice + '.');
            proj.updateBuildProperty('TARGETED_DEVICE_FAMILY', targetDevice);
        }
        if (deploymentTarget) {
            events.emit('verbose', 'Set IPHONEOS_DEPLOYMENT_TARGET to "' + deploymentTarget + '".');
            proj.updateBuildProperty('IPHONEOS_DEPLOYMENT_TARGET', deploymentTarget);
        }
        fs.writeFileSync(me.pbxproj, proj.writeSync(), 'utf-8');
        d.resolve();
    });
    return d.promise;
}


/*
IosProject.prototype.funcName = funcName;
function funcName(opts) {

}
*/

function checkThis(t) {
    if (!(t instanceof IosProject)) {
        throw new Error('Function not bound properly to `this`.');
    }
    return t;
}


// Construct a default value for CFBundleVersion as the version with any
// -rclabel stripped=.
function default_CFBundleVersion(version) {
    return version.split('-')[0];
}

// Converts cordova specific representation of target device to XCode value
function parseTargetDevicePreference(value) {
    if (!value) return null;
    var map = { 'universal': '"1,2"', 'handset': '"1"', 'tablet': '"2"'};
    if (map[value.toLowerCase()]) {
        return map[value.toLowerCase()];
    }
    events.emit('warn', 'Unknown target-device preference value: "' + value + '".');
    return null;
}
