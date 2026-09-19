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
exports.getOrCreateScanconfUri = getOrCreateScanconfUri;
exports.getScanconfUri = getScanconfUri;
exports.getOpenapiAlias = getOpenapiAlias;
exports.getRootUri = getRootUri;
exports.readConfigOrDefault = readConfigOrDefault;
exports.writeConfig = writeConfig;
exports.convertTitleToAlias = convertTitleToAlias;
exports.getUniqueAlias = getUniqueAlias;
exports.getGitRoot = getGitRoot;
const vscode = __importStar(require("vscode"));
const yaml = __importStar(require("yaml"));
const node_fs_1 = require("node:fs");
const fs_util_1 = require("../../fs-util");
const fs_1 = require("../../util/fs");
async function getOrCreateScanconfUri(openapiUri, title) {
    const rootUri = getRootUri(openapiUri);
    const configDirUri = vscode.Uri.joinPath(rootUri, ".42c");
    const configUri = vscode.Uri.joinPath(rootUri, ".42c", "conf.yaml");
    const relativeOasPath = (0, fs_util_1.relative)(rootUri, openapiUri);
    const config = await readConfigOrDefault(configUri);
    if (config.apis[relativeOasPath] === undefined) {
        const aliases = Object.values(config.apis).map((api) => api.alias);
        const uniqueAlias = getUniqueAlias(aliases, convertTitleToAlias(title));
        config.apis[relativeOasPath] = { alias: uniqueAlias };
        // make "config" dir
        if (!(await (0, fs_1.exists)(configDirUri.fsPath))) {
            (0, node_fs_1.mkdirSync)(configDirUri.fsPath);
        }
        // write config
        writeConfig(configUri, config);
    }
    const alias = config.apis[relativeOasPath].alias;
    // safeguard by making "scan" dir, "scan/<alias>" dirs in case these
    // have been removed
    const scanDirectoryUri = vscode.Uri.joinPath(rootUri, ".42c", "scan");
    if (!(await (0, fs_1.exists)(scanDirectoryUri.fsPath))) {
        (0, node_fs_1.mkdirSync)(scanDirectoryUri.fsPath);
    }
    const scanDirectoryAliasUri = vscode.Uri.joinPath(rootUri, ".42c", "scan", alias);
    if (!(await (0, fs_1.exists)(scanDirectoryAliasUri.fsPath))) {
        (0, node_fs_1.mkdirSync)(scanDirectoryAliasUri.fsPath);
    }
    return vscode.Uri.joinPath(rootUri, ".42c", "scan", alias, `scanconf.json`);
}
async function getScanconfUri(openapiUri) {
    const rootUri = getRootUri(openapiUri);
    const configUri = vscode.Uri.joinPath(rootUri, ".42c", "conf.yaml");
    const relativeOasPath = (0, fs_util_1.relative)(rootUri, openapiUri);
    const config = await readConfigOrDefault(configUri);
    if (config.apis[relativeOasPath] === undefined) {
        return undefined;
    }
    const alias = config.apis[relativeOasPath].alias;
    if (alias === undefined) {
        return undefined;
    }
    return vscode.Uri.joinPath(rootUri, ".42c", "scan", alias, `scanconf.json`);
}
async function getOpenapiAlias(openapiUri) {
    const rootUri = getRootUri(openapiUri);
    const configUri = vscode.Uri.joinPath(rootUri, ".42c", "conf.yaml");
    const relativeOasPath = (0, fs_util_1.relative)(rootUri, openapiUri);
    const config = await readConfigOrDefault(configUri);
    if (config.apis[relativeOasPath] === undefined) {
        return undefined;
    }
    return config.apis[relativeOasPath].alias;
}
function getRootUri(oasUri) {
    // find root URI for the OAS file
    // in order of preference: a parent directory with a .git folder, workspace folder, or OAS dirname()
    const gitRoot = getGitRoot(oasUri);
    if (gitRoot !== undefined) {
        return gitRoot;
    }
    const workspaceRoot = getWorkspaceFolder(oasUri);
    if (workspaceRoot !== undefined) {
        return workspaceRoot.uri;
    }
    return (0, fs_util_1.dirnameUri)(oasUri);
}
async function readConfigOrDefault(configUri) {
    if (!(await (0, fs_1.exists)(configUri.fsPath))) {
        return { apis: {} };
    }
    // TODO check schema
    return yaml.parse((0, node_fs_1.readFileSync)(configUri.fsPath, "utf8"));
}
function writeConfig(configUri, config) {
    const text = yaml.stringify(config, null, { indent: 2 });
    (0, node_fs_1.writeFileSync)(configUri.fsPath, text, { encoding: "utf8" });
}
function convertTitleToAlias(title) {
    const MAX_ALIAS_LENGTH = 32;
    return title
        .replace(/[^A-Za-z0-9_\\-\\.]/g, "-")
        .toLowerCase()
        .split(/-+/)
        .filter((segment) => segment !== "")
        .join("-")
        .substring(0, MAX_ALIAS_LENGTH);
}
function getUniqueAlias(aliases, newAlias) {
    let uniqueAlias = newAlias;
    for (let count = 1; aliases.includes(uniqueAlias); count++) {
        uniqueAlias = `${newAlias}${count}`;
    }
    return uniqueAlias;
}
function getWorkspaceFolder(uri) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        for (const folder of workspaceFolders) {
            if (uri.fsPath.startsWith(folder.uri.fsPath)) {
                return folder;
            }
        }
    }
    return undefined;
}
function getGitRoot(oasUri) {
    for (let dir = (0, fs_util_1.dirnameUri)(oasUri); dir.path !== "/"; dir = (0, fs_util_1.dirnameUri)(dir)) {
        const gitDirUri = vscode.Uri.joinPath(dir, ".git");
        if ((0, fs_1.existsDir)(gitDirUri.fsPath)) {
            return dir;
        }
    }
    return undefined;
}
//# sourceMappingURL=config.js.map