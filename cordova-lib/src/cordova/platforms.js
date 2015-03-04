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

var platforms = require('./platformsConfig.json');

// Avoid loading the same platform projects more than once (identified by path)
var cachedProjects = {};


var PARSER_PUBLIC_METHODS = [
    'config_xml',
    'cordovajs_path',
    'update_from_config',
    'update_overrides',
    'update_project',
    'update_www',
    'www_dir',
];


function PlatformProjectAdapter(platform, platformRootDir) {
    var self = this;
    self.root = platformRootDir;
    var ParserConstructor = require(platforms[platform].parser);
    self.parser = new ParserConstructor(platformRootDir);

    // Expos all public methods from the parser, properly bound.
    PARSER_PUBLIC_METHODS.forEach(function(method) {
        self[method] = self.parser[method].bind(self.parser);
    });
}

function getPlatformProject(platform, platformRootDir) {
    if (cachedProjects[platformRootDir]) {
        return cachedProjects[platformRootDir];
    } else if (platforms[platform]) {
        var adapter = new PlatformProjectAdapter(platform, platformRootDir);
        cachedProjects[platformRootDir] = adapter;
        return adapter;
    } else {
        throw new Error('Unknown platform ' + platform);
    }
}

module.exports = platforms;
module.exports.getPlatformProject = getPlatformProject;
