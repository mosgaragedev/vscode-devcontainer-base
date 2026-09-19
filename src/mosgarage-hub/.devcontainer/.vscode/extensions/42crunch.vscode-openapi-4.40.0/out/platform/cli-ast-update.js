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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCliUpdate = getCliUpdate;
const got_1 = __importDefault(require("got"));
const vscode = __importStar(require("vscode"));
const semver = __importStar(require("semver"));
async function readManifest(repository) {
    const manifestUrl = vscode.Uri.joinPath(vscode.Uri.parse(repository), "42c-ast-manifest.json");
    const manifest = (await (0, got_1.default)(manifestUrl.toString()).json());
    return manifest;
}
async function getCliUpdate(repository, currentVersion) {
    const manifest = await readManifest(repository);
    const platform = getCliAstPlatform();
    const current = semver.parse(currentVersion);
    for (const entry of manifest) {
        if (entry.architecture === platform) {
            const latest = semver.parse(entry.version);
            if (current === null) {
                return entry;
            }
            else if (latest && semver.gt(latest, current)) {
                return entry;
            }
        }
    }
}
function getCliAstPlatform() {
    if (process.platform === "win32") {
        return "windows-amd64";
    }
    else if (process.platform === "darwin" && process.arch == "arm64") {
        return "darwin-arm64";
    }
    else if (process.platform === "darwin" && process.arch == "x64") {
        return "darwin-amd64";
    }
    else if (process.platform === "linux" && process.arch == "x64") {
        return "linux-amd64";
    }
}
//# sourceMappingURL=cli-ast-update.js.map