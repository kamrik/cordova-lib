// AndroidProject inherits from PlatformProjhect and will contain most of
// Android specific logic from those two files:
//  - src/cordova/metadata/android_parser.js
//  - plugman/platforms/android.js
// Eventually AndroidProject should live in cordova-android

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
