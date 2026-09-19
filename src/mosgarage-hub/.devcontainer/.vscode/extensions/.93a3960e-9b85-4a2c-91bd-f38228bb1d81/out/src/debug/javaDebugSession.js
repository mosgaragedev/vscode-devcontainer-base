"use strict";
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the EPL v2.0 License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JavaDebugSession = exports.GLOBAL_STATE_SERVER_DEBUG_PROJECT_NAME_PREFIX = void 0;
const vscode = require("vscode");
const vscode_1 = require("vscode");
const extension_1 = require("../extension");
exports.GLOBAL_STATE_SERVER_DEBUG_PROJECT_NAME_PREFIX = 'rsp-ui.server.debug.projectName';
class JavaDebugSession {
    start(server, port, client) {
        this.processOutputListener = {
            port,
            server,
            listener: output => {
                if (output
                    && output.server
                    && output.server.id === server.id
                    && output.text
                    && output.text.includes('Listening for transport dt_socket')) {
                    this.startDebugger(port, server.id);
                    client.getIncomingHandler().removeOnServerProcessOutputAppended(this.processOutputListener.listener);
                }
            }
        };
        client.getIncomingHandler().onServerProcessOutputAppended(this.processOutputListener.listener);
    }
    discoverProjectName(serverId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = exports.GLOBAL_STATE_SERVER_DEBUG_PROJECT_NAME_PREFIX + '/' + serverId;
            const currVal = extension_1.myContext && extension_1.myContext.globalState ? extension_1.myContext.globalState.get(key) : undefined;
            const val = yield vscode_1.window.showInputBox({ prompt: 'Please input a project name to be used by the java debugger.',
                value: currVal || '', ignoreFocusOut: true });
            if (val !== currVal) {
                if (extension_1.myContext && extension_1.myContext.globalState)
                    extension_1.myContext.globalState.update(key, val);
            }
            return val;
        });
    }
    startDebugger(port, serverId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.port = port;
            const pName = yield this.discoverProjectName(serverId);
            const props = {
                type: 'java',
                request: 'attach',
                name: 'Debug (Remote)',
                hostName: 'localhost',
                port,
                projectName: pName,
            };
            const props2 = pName ? Object.assign(Object.assign({}, props), { projectName: pName }) : props;
            vscode.debug.startDebugging(undefined, props2);
        });
    }
    isDebuggerStarted() {
        return this.port !== undefined;
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            yield vscode.commands.executeCommand('workbench.action.debug.stop');
            this.port = undefined;
        });
    }
}
exports.JavaDebugSession = JavaDebugSession;
//# sourceMappingURL=javaDebugSession.js.map