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

// Simple FS with some convenience properties
// - Refer to files relative to a root specified during creation
// - Parent dirs don't need to exist, will be created if needed
// - maybe later - caching / tagging / transactivity

/* jshint unused: false */
var path = require('path');
var fs = require('fs');
var shell = require('shelljs');
var __ = require('underscore');

exports = ProjFs;
function ProjFs(root) {
    this.root = normalizePath(root);
}

// Methods
ProjFs.prototype.resolve = resolve;
function resolve(p /* , p2, p3... */) {
    var args = __.toArray(arguments);
    args = [this.root].concat(args);
    var absPath = path.resolve.apply(path, args);

    if (absPath.indexOf(this.root) !== 0)
        throw new Error('Path ' + p + ' could not be resolved as ProjFs internal path under ' + this.root);
    return absPath;
}

ProjFs.prototype.exists = exists;
function exists(p) {
    return fs.existsSync(this.resolve(p));

}


ProjFs.prototype._ensureDirExists = _ensureDirExists;
function _ensureDirExists(p) {
    if (!this.exists(p))
        shell.mkdir('-p', this.resolve(p));

}

ProjFs.prototype._ensureParentExists = _ensureParentExists;
function _ensureParentExists(p) {
    var parent = path.dirname(p);
    this._ensureDirExists(parent);

}

ProjFs.prototype.read = read;
function read(filePath, binary) {
    var p = path.resolve(this.root, filePath);
    // TODO: do we ever need to read binary files this way
    if (binary)
        return fs.readFileSync(p);
    else
        return fs.readFileSync(p, 'utf8');
}

ProjFs.prototype.write = write;
function write(filePath, data) {
    fs.writeFileSync(this.resolve(filePath), data);

}

// Copy a file from outside into this fs. Use cp for copying files between
// locations inside the fs.
ProjFs.prototype.add = add;
function add(from, toDir, newName) {
    newName = newName || path.basename(from);
    this._ensureDirExists(toDir);
    shell.cp(from, this.resolve(toDir, newName));
}

// Copy file that already exists inside this fs.
ProjFs.prototype.cp = cp;
function cp(from, toDir, newName) {
    newName = newName || path.basename(from);
    this._ensureDirExists(toDir);
    shell.cp(this.resolve(from), this.resolve(toDir, newName));
}

ProjFs.prototype.rm = rm;
function rm(p) {
    shell.rm('-rf', this.resolve(p));
    // TODO: remove parent dirs if empty
}

ProjFs.prototype.mv = mv;
function mv(from, to) {
    shell.mv(this.resolve(from), this.resolve(to));
}

// Remove the file and any parent dirs that are empty.
ProjFs.prototype.rmNoEmpty = rmNoEmpty;
function rmNoEmpty(filePath) {
    if (!this.exists(filePath)) return;
    var p = this.resolve(filePath);
    shell.rm('-rf', p);

    // check if directory is empty
    var curDir = path.dirname(p);

    while (curDir !== this.root) {
        if (fs.existsSync(curDir) && fs.readdirSync(curDir).length === 0) {
            fs.rmdirSync(curDir);
            curDir = path.resolve(curDir, '..');
        } else {
            // directory not empty...do nothing
            break;
        }
    }
}


// ## Utility functions
function normalizePath(p) {
    return path.resolve(path.normalize(p));
}


function test() {
    var pfs = new ProjFs('/tmp/tstfs');
    pfs.rm('.');
    pfs.add('/Users/kamrik/tmp/ttt.html', 'www/js');
    // pfs.cp('www/js/ttt.html', 'www');
    // pfs.rm('www/js');
    var txt = pfs.read('www/js/ttt.html');
    pfs.write('www/newfile.txt', 'HelloWorld');
    // pfs.rmNoEmpty('www/js/ttt.html');
    console.log(txt.slice(0,10));
}

test();

