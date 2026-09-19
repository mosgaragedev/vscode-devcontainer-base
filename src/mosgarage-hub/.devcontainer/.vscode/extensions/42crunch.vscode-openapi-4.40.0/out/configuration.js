"use strict";
/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.configuration = exports.Configuration = void 0;
const vscode_1 = require("vscode");
const types_1 = require("./types");
class Configuration {
    constructor(section) {
        this._onDidChange = new vscode_1.EventEmitter();
        this.section = section;
    }
    configure(context) {
        context.subscriptions.push(vscode_1.workspace.onDidChangeConfiguration(this.onConfigurationChanged, this));
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    onConfigurationChanged(e) {
        if (!e.affectsConfiguration(this.section)) {
            return;
        }
        this._onDidChange.fire(e);
    }
    changed(e, section, resource) {
        return e.affectsConfiguration(`${this.section}.${section}`, resource);
    }
    get(section, defaultValue) {
        return defaultValue === undefined
            ? vscode_1.workspace.getConfiguration(this.section).get(section)
            : vscode_1.workspace.getConfiguration(this.section).get(section, defaultValue);
    }
    update(section, value, configurationTarget) {
        const target = vscode_1.workspace.workspaceFolders ? configurationTarget : vscode_1.ConfigurationTarget.Global;
        return vscode_1.workspace.getConfiguration(this.section).update(section, value, target);
    }
    track(section, callback, defaultValue) {
        callback(this.get(section, defaultValue));
        return this.onDidChange((e) => {
            if (exports.configuration.changed(e, section)) {
                callback(this.get(section, defaultValue));
            }
        });
    }
}
exports.Configuration = Configuration;
exports.configuration = new Configuration(types_1.configId);
//# sourceMappingURL=configuration.js.map