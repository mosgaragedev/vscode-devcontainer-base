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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.CompareFoldersProvider = void 0;
const vscode_1 = require("vscode");
const path = __importStar(require("path"));
const fs_extra_1 = require("fs-extra");
const commands_1 = require("../constants/commands");
const comparer_1 = require("../services/comparer");
const file_1 = require("../models/file");
const treeBuilder_1 = require("../services/treeBuilder");
const path_1 = require("../context/path");
const path_2 = require("../utils/path");
const configuration_1 = require("../services/configuration");
const global_1 = require("../context/global");
const contextKeys_1 = require("../constants/contextKeys");
const logger = __importStar(require("../services/logger"));
const ui_1 = require("../utils/ui");
const validators_1 = require("../services/validators");
const ui_2 = require("../context/ui");
class CompareFoldersProvider {
    constructor(onlyInA, onlyInB, identicals) {
        this.onlyInA = onlyInA;
        this.onlyInB = onlyInB;
        this.identicals = identicals;
        this._onDidChangeTreeData = new vscode_1.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.emptyState = false;
        this._diffs = null;
        this.ignoreDifferencesList = new Set();
        this.compareFoldersAgainstEachOther = () => __awaiter(this, void 0, void 0, function* () {
            yield this.chooseFoldersAndCompare(true);
        });
        this.compareSelectedFolders = (_e, uris) => __awaiter(this, void 0, void 0, function* () {
            if ((uris === null || uris === void 0 ? void 0 : uris.length) !== 2) {
                (0, ui_1.showErrorMessageWithMoreInfo)('Unfortunately, this command can run only by right clicking on 2 folders, no shortcuts here 😕', 'https://github.com/microsoft/vscode/issues/3553');
                return;
            }
            const [{ fsPath: folder1Path }, { fsPath: folder2Path }] = uris;
            path_1.pathContext.setPaths(folder1Path, folder2Path);
            return this.handleDiffResult(yield (0, comparer_1.compareFolders)());
        });
        this.dismissDifference = (e) => __awaiter(this, void 0, void 0, function* () {
            const { path } = e.resourceUri || {};
            if (!path) {
                return;
            }
            this.ignoreDifferencesList.add(path);
            this.filterIgnoredFromDiffs();
            yield this.updateUI();
        });
        this.chooseFoldersAndCompare = (ignoreWorkspace = false) => __awaiter(this, void 0, void 0, function* () {
            yield vscode_1.window.withProgress({
                location: vscode_1.ProgressLocation.Notification,
                title: `Compare folders...`,
            }, () => __awaiter(this, void 0, void 0, function* () {
                this.handleDiffResult(yield (0, comparer_1.chooseFoldersAndCompare)(ignoreWorkspace ? undefined : yield this.getWorkspaceFolder()));
            }));
        });
        this.getWorkspaceFolder = () => __awaiter(this, void 0, void 0, function* () {
            if (!vscode_1.workspace.workspaceFolders) {
                return Promise.resolve(undefined);
            }
            if (vscode_1.workspace.workspaceFolders && vscode_1.workspace.workspaceFolders.length === 1) {
                return Promise.resolve(this.workspaceRoot);
            }
            else {
                const selectedWorkspace = yield this.chooseWorkspace();
                if (!selectedWorkspace) {
                    throw new Error('Workspace not selected');
                }
                return selectedWorkspace;
            }
        });
        this.chooseWorkspace = () => __awaiter(this, void 0, void 0, function* () {
            const workspaces = vscode_1.workspace.workspaceFolders.map((folder) => ({
                label: folder.name,
                description: folder.uri.fsPath,
            }));
            const result = yield vscode_1.window.showQuickPick(workspaces, {
                canPickMany: false,
                placeHolder: 'Choose a workspace to compare with',
            });
            if (result) {
                this.workspaceRoot = result.description;
                return this.workspaceRoot;
            }
        });
        this.refresh = (resetIgnoredFiles = true, shouldShowInfoMessage = true) => __awaiter(this, void 0, void 0, function* () {
            if (resetIgnoredFiles) {
                this.ignoreDifferencesList.clear();
            }
            try {
                this._diffs = (yield (0, comparer_1.compareFolders)());
                this.filterIgnoredFromDiffs();
                if (shouldShowInfoMessage && this._diffs.hasResult()) {
                    (0, ui_1.showInfoMessageWithTimeout)('Source Refreshed');
                }
                this.updateUI();
            }
            catch (error) {
                logger.error(error);
            }
        });
        this.swap = () => {
            path_1.pathContext.swap();
            this.refresh(false);
        };
        this.viewAs = (mode) => () => {
            ui_2.uiContext.diffViewMode = mode;
            this.refresh(false, false);
        };
        this.copyToCompared = (e) => {
            this.copyToFolder(e.resourceUri, 'to-compared');
        };
        this.copyToMy = (e) => {
            this.copyToFolder(e.resourceUri, 'to-me');
        };
        this.deleteFile = (e) => __awaiter(this, void 0, void 0, function* () {
            const shouldDelete = yield (0, ui_1.warnBefore)('Are you sure you want to delete this file?');
            if (shouldDelete) {
                (0, fs_extra_1.removeSync)(e.resourceUri.fsPath);
                this.refresh(false);
            }
        });
        this.takeMyFile = (e) => __awaiter(this, void 0, void 0, function* () {
            const shouldTake = yield (0, ui_1.warnBefore)('Are you sure you want to take my file?');
            if (shouldTake) {
                const [[filePath]] = e.command.arguments;
                this.copyToFolder(vscode_1.Uri.file(filePath), 'to-compared');
            }
        });
        this.takeComparedFile = (e) => __awaiter(this, void 0, void 0, function* () {
            const shouldTake = yield (0, ui_1.warnBefore)('Are you sure you want to take the compared file?');
            if (shouldTake) {
                const [[, filePath]] = e.command.arguments;
                this.copyToFolder(vscode_1.Uri.file(filePath), 'to-me');
            }
        });
        this.workspaceRoot =
            vscode_1.workspace.workspaceFolders && vscode_1.workspace.workspaceFolders.length
                ? vscode_1.workspace.workspaceFolders[0].uri.fsPath
                : '';
    }
    handleDiffResult(diffs) {
        return __awaiter(this, void 0, void 0, function* () {
            this.ignoreDifferencesList.clear();
            if (!diffs) {
                return;
            }
            this._diffs = diffs;
            yield this.updateUI();
            this.warnUnaccessiblePaths();
            vscode_1.commands.executeCommand('foldersCompareAppService.focus');
            (0, global_1.setContext)(contextKeys_1.HAS_FOLDERS, true);
        });
    }
    warnUnaccessiblePaths() {
        var _a;
        if (!((_a = this._diffs) === null || _a === void 0 ? void 0 : _a.unaccessibles.length)) {
            return;
        }
        (0, validators_1.showUnaccessibleWarning)(this._diffs.unaccessibles.join('\n'));
    }
    onFileClicked([path1, path2], relativePath) {
        try {
            if (path2) {
                let diffs = [path2, path1];
                if ((0, configuration_1.getConfiguration)('diffLayout') === 'local <> compared') {
                    diffs = [path1, path2];
                }
                (0, comparer_1.showDiffs)(diffs, relativePath);
            }
            else {
                (0, comparer_1.showFile)(path1);
            }
        }
        catch (error) {
            console.error(error);
        }
    }
    updateUI() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._diffs) {
                return;
            }
            if (this._diffs.hasResult()) {
                this.emptyState = false;
                this._onDidChangeTreeData.fire(null);
            }
            else {
                this.showEmptyState();
                vscode_1.window.showInformationMessage('[Compare Folders] There are no differences in any file at the same path.');
            }
            this.onlyInA.update(this._diffs.left, this._diffs.leftPath);
            this.onlyInB.update(this._diffs.right, this._diffs.rightPath);
            this.identicals.update(this._diffs.identicals, this._diffs.leftPath);
        });
    }
    filterIgnoredFromDiffs() {
        this._diffs.distinct = this._diffs.distinct
            .filter(diff => {
            const path1 = diff[0];
            const path2 = diff[1];
            return !this.ignoreDifferencesList.has(path1) &&
                !this.ignoreDifferencesList.has(path2);
        });
    }
    copyToFolder(uri, direction) {
        try {
            const [folder1Path, folder2Path] = path_1.pathContext.getPaths();
            const [from, to] = direction === 'to-compared' ? [folder1Path, folder2Path] : [folder2Path, folder1Path];
            const fromPath = uri.fsPath;
            const toPath = path.join(to, path.relative(from, fromPath));
            (0, fs_extra_1.copySync)(fromPath, toPath);
            this.refresh(false);
        }
        catch (error) {
            (0, ui_1.showErrorMessage)('Failed to copy file', error);
            logger.error(error);
        }
    }
    showEmptyState() {
        this.emptyState = true;
        this._onDidChangeTreeData.fire(null);
    }
    getTreeItem(element) {
        return element;
    }
    getFolderName(filePath, basePath) {
        const base = basePath ? `${this.workspaceRoot}/${basePath}` : this.workspaceRoot;
        return path.basename(path.dirname((0, path_2.getLocalPath)(filePath, base)));
    }
    getChildren(element) {
        try {
            if (element && element.children) {
                return element.children;
            }
            const children = [openFolderChild(!!this.workspaceRoot)];
            if (this.emptyState) {
                children.push(emptyStateChild);
            }
            else if (this._diffs) {
                const tree = (0, treeBuilder_1.build)(this._diffs.distinct, path_1.pathContext.mainPath);
                children.push(...tree.treeItems);
            }
            return children;
        }
        catch (error) {
            logger.error(error);
            return [];
        }
    }
}
exports.CompareFoldersProvider = CompareFoldersProvider;
const openFolderChild = (isSingle) => new file_1.File(isSingle ? 'Click to select a folder' : 'Click to select folders', 'open', vscode_1.TreeItemCollapsibleState.None, {
    title: 'title',
    command: commands_1.CHOOSE_FOLDERS_AND_COMPARE,
});
const emptyStateChild = new file_1.File('The compared folders are synchronized', 'empty', vscode_1.TreeItemCollapsibleState.None);
//# sourceMappingURL=foldersCompareProvider.js.map