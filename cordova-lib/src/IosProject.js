var pp = require('./PlatformProject');

// Constructor
module.exports = IosProject;
IosProject.prototype = new pp.PlatformProject();
function IosProject() {
    var self = this;
    self.platform = 'ios';
}


/*
AndroidProject.prototype.funcName = funcName;
function funcName(plugins, opts) {

}
*/
