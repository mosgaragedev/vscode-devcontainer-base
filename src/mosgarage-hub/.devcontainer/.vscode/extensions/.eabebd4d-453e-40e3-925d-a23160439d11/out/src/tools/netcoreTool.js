"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.DotNetError = exports.NetCoreTool = exports.minSupportedNetCoreVersionForBuild = exports.linuxPlatform = exports.macPlatform = exports.winPlatform = exports.NetCoreLinuxDefaultPath = exports.NetCoreMacDefaultPath = exports.NetCoreDoNotAskAgainKey = exports.DotnetInstallLocationKey = exports.NetCoreInstallLocationKey = exports.DBProjectConfigurationKey = void 0;
const child_process = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const semver = require("semver");
const util_1 = require("util");
const vscode = require("vscode");
const nls = require("vscode-nls");
const constants_1 = require("../common/constants");
const utils = require("../common/utils");
const shellExecutionHelper_1 = require("./shellExecutionHelper");
const localize = nls.loadMessageBundle();
exports.DBProjectConfigurationKey = 'sqlDatabaseProjects';
exports.NetCoreInstallLocationKey = 'netCoreSDKLocation';
exports.DotnetInstallLocationKey = 'dotnetSDK Location';
exports.NetCoreDoNotAskAgainKey = 'netCoreDoNotAsk';
exports.NetCoreMacDefaultPath = '/usr/local/share';
exports.NetCoreLinuxDefaultPath = '/usr/share';
exports.winPlatform = 'win32';
exports.macPlatform = 'darwin';
exports.linuxPlatform = 'linux';
exports.minSupportedNetCoreVersionForBuild = '8.0.0';
const dotnet = os.platform() === 'win32' ? 'dotnet.exe' : 'dotnet';
class NetCoreTool extends shellExecutionHelper_1.ShellExecutionHelper {
    osPlatform = os.platform();
    netCoreSdkInstalledVersion;
    netCoreInstallState = 2 /* netCoreInstallState.netCoreVersionSupported */;
    /**
     * This method presents the installation dialog for .NET Core, if not already present/supported
     * @param skipVersionSupportedCheck If true then skip the check to determine whether the .NET version is supported (for commands that work on all versions)
     * @returns True if .NET version was found and is supported
     * 			False if .NET version isn't present or present but not supported
     */
    async findOrInstallNetCore(skipVersionSupportedCheck = false) {
        if (!this.isNetCoreInstallationPresent || (this.isNetCoreInstallationPresent && !skipVersionSupportedCheck)) {
            if ((!this.isNetCoreInstallationPresent || !await this.isNetCoreVersionSupportedForBuild())) {
                if (vscode.workspace.getConfiguration(exports.DBProjectConfigurationKey)[exports.NetCoreDoNotAskAgainKey] !== true) {
                    void this.showInstallDialog(); // Removing await so that Build and extension load process doesn't wait on user input
                }
                return false;
            }
        }
        this.netCoreInstallState = 2 /* netCoreInstallState.netCoreVersionSupported */;
        return true;
    }
    constructor(_outputChannel) {
        super(_outputChannel);
    }
    async showInstallDialog() {
        let result;
        if (this.netCoreInstallState === 0 /* netCoreInstallState.netCoreNotPresent */) {
            result = await vscode.window.showErrorMessage(constants_1.DotnetInstallationConfirmation, constants_1.UpdateDotnetLocation, constants_1.Install, constants_1.DoNotAskAgain);
        }
        else {
            result = await vscode.window.showErrorMessage((0, constants_1.NetCoreSupportedVersionInstallationConfirmation)(this.netCoreSdkInstalledVersion), constants_1.UpdateDotnetLocation, constants_1.Install, constants_1.DoNotAskAgain);
        }
        if (result === constants_1.UpdateDotnetLocation) {
            //open settings
            await vscode.commands.executeCommand('workbench.action.openGlobalSettings');
        }
        else if (result === constants_1.Install) {
            //open install link
            const dotnetSdkUrl = 'https://aka.ms/sqlprojects-dotnet';
            await vscode.env.openExternal(vscode.Uri.parse(dotnetSdkUrl));
        }
        else if (result === constants_1.DoNotAskAgain) {
            const config = vscode.workspace.getConfiguration(exports.DBProjectConfigurationKey);
            await config.update(exports.NetCoreDoNotAskAgainKey, true, vscode.ConfigurationTarget.Global);
        }
    }
    get isNetCoreInstallationPresent() {
        const netCoreInstallationPresent = (!(0, util_1.isNullOrUndefined)(this.netcoreInstallLocation) && fs.existsSync(this.netcoreInstallLocation));
        if (!netCoreInstallationPresent) {
            this.netCoreInstallState = 0 /* netCoreInstallState.netCoreNotPresent */;
        }
        return netCoreInstallationPresent;
    }
    get netcoreInstallLocation() {
        return vscode.workspace.getConfiguration(exports.DBProjectConfigurationKey)[exports.DotnetInstallLocationKey] ||
            this.defaultLocalInstallLocationByDistribution;
    }
    get defaultLocalInstallLocationByDistribution() {
        switch (this.osPlatform) {
            case exports.winPlatform: return this.defaultWindowsLocation;
            case exports.macPlatform: return this.defaultMacLocation;
            case exports.linuxPlatform: return this.defaultLinuxLocation;
            default: return undefined;
        }
    }
    get defaultMacLocation() {
        return this.getDotnetPathIfPresent(exports.NetCoreMacDefaultPath) || //default folder for net core sdk on Mac
            this.getDotnetPathIfPresent(os.homedir()) ||
            undefined;
    }
    get defaultLinuxLocation() {
        return this.getDotnetPathIfPresent(exports.NetCoreLinuxDefaultPath) || //default folder for net core sdk on Linux
            this.getDotnetPathIfPresent(os.homedir()) ||
            undefined;
    }
    get defaultWindowsLocation() {
        return this.getDotnetPathIfPresent(process.env['ProgramW6432']) ||
            this.getDotnetPathIfPresent(process.env['ProgramFiles(x86)']) ||
            this.getDotnetPathIfPresent(process.env['ProgramFiles']);
    }
    getDotnetPathIfPresent(folderPath) {
        if (!(0, util_1.isNullOrUndefined)(folderPath) && fs.existsSync(path.join(folderPath, 'dotnet'))) {
            return path.join(folderPath, 'dotnet');
        }
        return undefined;
    }
    /**
     * This function checks if the installed dotnet version is at least minSupportedNetCoreVersionForBuild.
     * Versions lower than minSupportedNetCoreVersionForBuild aren't supported for building projects.
     * Returns: True if installed dotnet version is supported, false otherwise.
     * 			Undefined if dotnet isn't installed.
     */
    async isNetCoreVersionSupportedForBuild() {
        try {
            const spawn = child_process.spawn;
            let child;
            let isSupported = false;
            const stdoutBuffers = [];
            child = spawn('dotnet --version', [], {
                shell: true
            });
            child.stdout.on('data', (b) => stdoutBuffers.push(b));
            await new Promise((resolve, reject) => {
                child.on('exit', () => {
                    this.netCoreSdkInstalledVersion = Buffer.concat(stdoutBuffers).toString('utf8').trim();
                    try {
                        if (semver.gte(this.netCoreSdkInstalledVersion, exports.minSupportedNetCoreVersionForBuild)) { // Net core version greater than or equal to minSupportedNetCoreVersion are supported for Build
                            isSupported = true;
                        }
                        else {
                            isSupported = false;
                        }
                        resolve({ stdout: this.netCoreSdkInstalledVersion });
                    }
                    catch (err) {
                        console.log(err);
                        reject(err);
                    }
                });
                child.on('error', (err) => {
                    console.log(err);
                    this.netCoreInstallState = 0 /* netCoreInstallState.netCoreNotPresent */;
                    reject(err);
                });
            });
            if (isSupported) {
                this.netCoreInstallState = 2 /* netCoreInstallState.netCoreVersionSupported */;
            }
            else {
                this.netCoreInstallState = 1 /* netCoreInstallState.netCoreVersionNotSupported */;
            }
            return isSupported;
        }
        catch (err) {
            console.log(err);
            this.netCoreInstallState = 0 /* netCoreInstallState.netCoreNotPresent */;
            return undefined;
        }
    }
    /**
     * Runs the specified dotnet command
     * @param options The options to use when launching the process
     * @param skipVersionSupportedCheck If true then skip the check to determine whether the .NET version is supported (for commands that work on all versions)
     * @returns
     */
    async runDotnetCommand(options, skipVersionSupportedCheck = false) {
        if (options && options.commandTitle !== undefined && options.commandTitle !== null) {
            this._outputChannel.appendLine(`\t[ ${options.commandTitle} ]`);
        }
        await this.verifyNetCoreInstallation(skipVersionSupportedCheck);
        const dotnetPath = utils.getQuotedPath(path.join(this.netcoreInstallLocation, dotnet));
        const command = dotnetPath + ' ' + options.argument;
        try {
            return await this.runStreamedCommand(command, options);
        }
        catch (error) {
            this._outputChannel.append(localize('sqlDatabaseProject.RunCommand.ErroredOut', "\t>>> {0}   … errored out: {1}", command, utils.getErrorMessage(error))); //errors are localized in our code where emitted, other errors are pass through from external components that are not easily localized
            throw error;
        }
    }
    /**
     * Assesses whether the .NET Core installation is present and supported.
     * If not, it will prompt the user to install or update .NET Core.
     * @param skipVersionSupportedCheck
     */
    async verifyNetCoreInstallation(skipVersionSupportedCheck = false) {
        if (!(await this.findOrInstallNetCore(skipVersionSupportedCheck))) {
            if (this.netCoreInstallState === 0 /* netCoreInstallState.netCoreNotPresent */) {
                throw new DotNetError(constants_1.DotnetInstallationConfirmation);
            }
            else {
                throw new DotNetError((0, constants_1.NetCoreSupportedVersionInstallationConfirmation)(this.netCoreSdkInstalledVersion));
            }
        }
    }
}
exports.NetCoreTool = NetCoreTool;
class DotNetError extends Error {
}
exports.DotNetError = DotNetError;
//# sourceMappingURL=netcoreTool.js.map