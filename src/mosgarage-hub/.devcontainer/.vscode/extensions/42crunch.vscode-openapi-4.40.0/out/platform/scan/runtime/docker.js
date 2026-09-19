"use strict";
/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScanWithDocker = runScanWithDocker;
const vscode = __importStar(require("vscode"));
const time_util_1 = require("../../../time-util");
const proxy_1 = require("../../../proxy");
async function runScanWithDocker(envStore, scanEnv, config, logger, token) {
    logger.info(`Running API Conformance Scan using docker`);
    const terminal = findOrCreateTerminal();
    const env = { ...scanEnv };
    const services = config.platformServices.source === "auto"
        ? config.platformServices.auto
        : config.platformServices.manual;
    env["SCAN_TOKEN"] = token.trim();
    env["PLATFORM_SERVICE"] = services;
    Object.assign(env, await (0, proxy_1.getProxyEnv)(`https://${scanEnv["PLATFORM_SERVICE"]}`, scanEnv["SCAN42C_HOST"], config, logger));
    const envString = Object.entries(env)
        .map(([key, value]) => `-e ${key}='${value}'`)
        .join(" ");
    const hostNetwork = config.docker.useHostNetwork && (config.platform == "linux" || config.platform == "freebsd")
        ? "--network host"
        : "";
    terminal.sendText("");
    terminal.show();
    await (0, time_util_1.delay)(2000);
    terminal.sendText(`docker run ${hostNetwork} --rm ${envString} ${config.scanImage}`);
    return undefined;
}
function findOrCreateTerminal() {
    const name = "scan";
    for (const terminal of vscode.window.terminals) {
        if (terminal.name === name && terminal.exitStatus === undefined) {
            return terminal;
        }
    }
    return vscode.window.createTerminal({ name });
}
//# sourceMappingURL=docker.js.map