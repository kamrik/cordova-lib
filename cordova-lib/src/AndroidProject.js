var pp = require('./PlatformProject');

// Constructor
module.exports = AndroidProject;
AndroidProject.prototype = new pp.PlatformProject();
function AndroidProject() {
    var self = this;
    self.platform = 'android';
}

/*
AndroidProject.prototype.funcName = funcName;
function funcName(plugins, opts) {

}
*/
