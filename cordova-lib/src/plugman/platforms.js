/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

var platforms = module.exports = {
    'android': require('./platforms/android'),
    'amazon-fireos': require('./platforms/amazon-fireos'),
    'ios': require('./platforms/ios'),
    'blackberry10': require('./platforms/blackberry10'),
    'wp8': require('./platforms/wp8'),
    'windows8' : require('./platforms/windows'),
    'windows' : require('./platforms/windows'),
    'firefoxos': require('./platforms/firefoxos'),
    'ubuntu': require('./platforms/ubuntu'),
    'tizen': require('./platforms/tizen'),
    'browser': require('./platforms/browser')
};

// Add (un)installer getter for compatibility with unified platform handlers
// Function signatures are:
//   install(obj, plugin_dir, project_dir, plugin_id, options, project)
// uninstall(obj,             project_dir, plugin_id, options, project)
function getInstaller(type) {
    return this[type].install;
}

function getUninstaller(type) {
    return this[type].uninstall;
}

Object.keys(platforms).forEach(function(platform) {
    platforms[platform].getInstaller = getInstaller;
    platforms[platform].getUninstaller = getUninstaller;
});
