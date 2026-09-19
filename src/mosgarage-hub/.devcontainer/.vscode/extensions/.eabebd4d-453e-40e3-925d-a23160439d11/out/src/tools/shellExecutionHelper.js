"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShellExecutionHelper = void 0;
const cp = require("promisify-child-process");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
class ShellExecutionHelper {
    _outputChannel;
    constructor(_outputChannel) {
        this._outputChannel = _outputChannel;
    }
    /**
     * spawns the shell command with arguments and redirects the error and output to ADS output channel
     */
    async runStreamedCommand(command, options, sensitiveData = [], timeout = 5 * 60 * 1000) {
        const stdoutData = [];
        let cmdOutputMessage = command;
        sensitiveData.forEach(element => {
            cmdOutputMessage = cmdOutputMessage.replace(element, '***');
        });
        this._outputChannel.appendLine(`    > ${cmdOutputMessage}`);
        const spawnOptions = {
            cwd: options && options.workingDirectory,
            env: Object.assign({}, process.env, options && options.additionalEnvironmentVariables),
            encoding: 'utf8',
            maxBuffer: 10 * 1024 * 1024, // 10 Mb of output can be captured.
            shell: true,
            detached: false,
            windowsHide: true,
            timeout: timeout
        };
        try {
            const child = cp.spawn(command, [], spawnOptions);
            this._outputChannel.show();
            // Add listeners to print stdout and stderr and exit code
            void child.on('exit', (code, signal) => {
                if (code !== null) {
                    this._outputChannel.appendLine(localize('sqlDatabaseProjects.RunStreamedCommand.ExitedWithCode', "    >>> {0}    … exited with code: {1}", cmdOutputMessage, code));
                }
                else {
                    this._outputChannel.appendLine(localize('sqlDatabaseProjects.RunStreamedCommand.ExitedWithSignal', "    >>> {0}   … exited with signal: {1}", cmdOutputMessage, signal));
                }
            });
            child.stdout.on('data', (data) => {
                stdoutData.push(data.toString());
                ShellExecutionHelper.outputDataChunk(this._outputChannel, data, localize('sqlDatabaseProjects.RunCommand.stdout', "    stdout: "));
            });
            child.stderr.on('data', (data) => {
                ShellExecutionHelper.outputDataChunk(this._outputChannel, data, localize('sqlDatabaseProjects.RunCommand.stderr', "    stderr: "));
            });
            await child;
            return stdoutData.join('');
        }
        catch (err) {
            // removing sensitive data from the exception
            sensitiveData.forEach(element => {
                err.cmd = err.cmd?.replace(element, '***');
                err.message = err.message?.replace(element, '***');
            });
            throw err;
        }
    }
    static outputDataChunk(outputChannel, data, header) {
        data.toString().split(/\r?\n/)
            .forEach(line => {
            if (outputChannel) {
                outputChannel.appendLine(header + line);
            }
        });
    }
}
exports.ShellExecutionHelper = ShellExecutionHelper;
//# sourceMappingURL=shellExecutionHelper.js.map