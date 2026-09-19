"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultProjectSaveLocation = defaultProjectSaveLocation;
exports.defaultProjectNameNewProj = defaultProjectNameNewProj;
exports.defaultProjectNameFromDb = defaultProjectNameFromDb;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const os = require("os");
const constants = require("../common/constants");
const utils = require("../common/utils");
/**
 * Returns the default location to save a new database project
 */
function defaultProjectSaveLocation() {
    const workspaceApi = utils.getDataWorkspaceExtensionApi();
    return workspaceApi.defaultProjectSaveLocation;
}
/**
 * Returns default project name for a fresh new project, such as 'DatabaseProject1'. Auto-increments
 * the suggestion if a project of that name already exists in the default save location
 */
function defaultProjectNameNewProj() {
    return defaultProjectName(constants.defaultProjectNameStarter, 1);
}
/**
 * Returns default project name for a new project based on given dbName. Auto-increments
 * the suggestion if a project of that name already exists in the default save location
 *
 * @param dbName the database name to base the default project name off of
 */
function defaultProjectNameFromDb(dbName) {
    if (!dbName) {
        return '';
    }
    const projectNameStarter = constants.defaultProjectNameStarter + dbName;
    const defaultLocation = defaultProjectSaveLocation() ?? vscode.Uri.file(os.homedir());
    const projectPath = path.join(defaultLocation.fsPath, projectNameStarter);
    if (!fs.existsSync(projectPath)) {
        return projectNameStarter;
    }
    return defaultProjectName(projectNameStarter, 2);
}
/**
 * Returns a project name that begins with the given nameStarter, and ends in a number, such as
 * 'DatabaseProject1'. Number begins at the given counter, but auto-increments if a project of
 * that name already exists in the default save location.
 *
 * @param nameStarter the beginning of the default project name, such as 'DatabaseProject'
 * @param counter the starting value of of the number appended to the nameStarter
 */
function defaultProjectName(nameStarter, counter) {
    while (counter < Number.MAX_SAFE_INTEGER) {
        const name = nameStarter + counter;
        const defaultLocation = defaultProjectSaveLocation() ?? vscode.Uri.file(os.homedir());
        const projectPath = path.join(defaultLocation.fsPath, name);
        if (!fs.existsSync(projectPath)) {
            return name;
        }
        counter++;
    }
    return constants.defaultProjectNameStarter + counter;
}
//# sourceMappingURL=newProjectTool.js.map