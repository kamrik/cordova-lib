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

var util = require('./util');
var platforms = require('../platforms/platformsConfig.json');

// Until all platforms move to the new style.
var newStylePlatforms = {
    'ios': '../platforms/IosProject',
};

var cachedProjects = {};

function getPlatformProject(platform, platformRootDir) {
    if (cachedProjects[platformRootDir]) {
        return cachedProjects[platformRootDir];
    } else if (newStylePlatforms[platform]) {
        var PlatformConstructor = require(newStylePlatforms[platform]);
        var prj = new PlatformConstructor();
        prj.open(platformRootDir);
        prj.appRoot = util.isCordova(platformRootDir);
        prj.appWww = util.projectWww(prj.appRoot);
        cachedProjects[platformRootDir] = prj;
        return prj;
    } else if (platforms[platform]) {
        var ParserConstructor = require(platforms[platform].parser);
        var parser = new ParserConstructor(platformRootDir);
        cachedProjects[platformRootDir] = parser;
        return parser;
    } else {
        throw new Error('Unknown platform ' + platform);
    }
}

platforms.getPlatformProject = getPlatformProject;
module.exports = platforms;
