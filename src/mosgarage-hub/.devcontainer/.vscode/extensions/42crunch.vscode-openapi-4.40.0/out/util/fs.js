"use strict";
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
exports.createTempDirectory = createTempDirectory;
exports.existsSync = existsSync;
exports.exists = exists;
exports.existsDir = existsDir;
exports.existsUri = existsUri;
const node_os_1 = require("node:os");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const vscode = __importStar(require("vscode"));
const promises_1 = require("node:fs/promises");
function createTempDirectory(prefix) {
    const tmpDir = (0, node_os_1.tmpdir)();
    const dir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)(`${tmpDir}`, prefix));
    return dir;
}
function existsSync(filename) {
    try {
        (0, node_fs_1.accessSync)(filename, node_fs_1.constants.F_OK);
        return true;
    }
    catch (err) {
        return false;
    }
}
async function exists(filename) {
    try {
        await (0, promises_1.access)(filename, node_fs_1.constants.F_OK);
        return true;
    }
    catch (err) {
        return false;
    }
}
function existsDir(filename) {
    try {
        const stats = (0, node_fs_1.statSync)(filename);
        return stats.isDirectory();
    }
    catch (err) {
        return false;
    }
}
async function existsUri(uri) {
    try {
        const stat = await vscode.workspace.fs.stat(uri);
        return true;
    }
    catch (e) {
        return false;
    }
}
//# sourceMappingURL=fs.js.map