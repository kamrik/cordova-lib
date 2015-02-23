var __ = require('underscore');
var pp = require('./PlatformProject');

// Constructor
module.exports = IosProject;
IosProject.prototype = new pp.PlatformProject();
function IosProject() {
    var self = this;
    self.platform = 'ios';
    __.bindAll(self, 'build', 'run', 'emulate');  // TODO: add all methods and/or find a better way to do this.
}


/*
IosProject.prototype.funcName = funcName;
function funcName(plugins, opts) {

}
*/
