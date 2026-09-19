"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutorestHelper = void 0;
const vscode = require("vscode");
const constants = require("../common/constants");
const utils = require("../common/utils");
const semver = require("semver");
const netcoreTool_1 = require("./netcoreTool");
const shellExecutionHelper_1 = require("./shellExecutionHelper");
const autorestPackageName = 'autorest-sql-testing'; // name of AutoRest.Sql package on npm
const nodejsDoNotAskAgainKey = 'nodejsDoNotAsk';
const autorestSqlVersionKey = 'autorestSqlVersion';
/**
 * Helper class for dealing with Autorest generation and detection
 */
class AutorestHelper extends shellExecutionHelper_1.ShellExecutionHelper {
    constructor(_outputChannel) {
        super(_outputChannel);
    }
    /**
     * Checks the workspace configuration to for an AutoRest.Sql override, otherwise latest will be used from NPM
     */
    get autorestSqlPackageVersion() {
        let configVal = vscode.workspace.getConfiguration(netcoreTool_1.DBProjectConfigurationKey)[autorestSqlVersionKey];
        if (configVal && semver.valid(configVal.trim())) {
            return configVal.trim();
        }
        else {
            return 'latest';
        }
    }
    /**
     * @returns the beginning of the command to execute autorest; 'autorest' if available, 'npx autorest' if module not installed, or undefined if neither
     */
    async detectInstallation() {
        const autorestCommand = 'autorest';
        const npxCommand = 'npx';
        if (await utils.detectCommandInstallation(autorestCommand)) {
            return autorestCommand;
        }
        else if (await utils.detectCommandInstallation(npxCommand)) {
            this._outputChannel.appendLine(constants.nodeButNotAutorestFound);
            const response = await vscode.window.showInformationMessage(constants.nodeButNotAutorestFoundPrompt, constants.installGlobally, constants.runViaNpx);
            if (response === constants.installGlobally) {
                this._outputChannel.appendLine(constants.userSelectionInstallGlobally);
                await this.runStreamedCommand('npm install autorest -g');
                return autorestCommand;
            }
            else if (response === constants.runViaNpx) {
                this._outputChannel.appendLine(constants.userSelectionRunNpx);
                return `${npxCommand} ${autorestCommand}`;
            }
            else {
                this._outputChannel.appendLine(constants.userSelectionCancelled);
            }
        }
        else {
            this._outputChannel.appendLine(constants.nodeNotFound);
        }
        return undefined;
    }
    /**
     * Calls autorest to generate files from the spec, piping standard and error output to the host console
     * @param specPath path to the OpenAPI spec file
     * @param outputFolder folder in which to generate the .sql script files
     * @returns console output from autorest execution
     */
    async generateAutorestFiles(specPath, outputFolder) {
        const commandExecutable = await this.detectInstallation();
        if (!commandExecutable) {
            // unable to find autorest or npx
            if (vscode.workspace.getConfiguration(netcoreTool_1.DBProjectConfigurationKey)[nodejsDoNotAskAgainKey] !== true) {
                return; // user doesn't want to be prompted about installing it
            }
            // prompt user to install Node.js
            const result = await vscode.window.showErrorMessage(constants.nodeNotFound, constants.DoNotAskAgain, constants.Install);
            if (result === constants.Install) {
                //open install link
                const nodejsInstallationUrl = 'https://nodejs.dev/download';
                await vscode.env.openExternal(vscode.Uri.parse(nodejsInstallationUrl));
            }
            else if (result === constants.DoNotAskAgain) {
                const config = vscode.workspace.getConfiguration(netcoreTool_1.DBProjectConfigurationKey);
                await config.update(nodejsDoNotAskAgainKey, true, vscode.ConfigurationTarget.Global);
            }
            return;
        }
        const command = this.constructAutorestCommand(commandExecutable, specPath, outputFolder);
        const output = await this.runStreamedCommand(command);
        return output;
    }
    /**
     *
     * @param executable either "autorest" or "npx autorest", depending on whether autorest is already present in the global cache
     * @param specPath path to the OpenAPI spec
     * @param outputFolder folder in which to generate the files
     * @returns composed command to be executed
     */
    constructAutorestCommand(executable, specPath, outputFolder) {
        // TODO: should --clear-output-folder be included? We should always be writing to a folder created just for this, but potentially risky
        return `${executable} --use:${autorestPackageName}@${this.autorestSqlPackageVersion} --input-file="${specPath}" --output-folder="${outputFolder}" --clear-output-folder --verbose`;
    }
}
exports.AutorestHelper = AutorestHelper;
//# sourceMappingURL=autorestHelper.js.map