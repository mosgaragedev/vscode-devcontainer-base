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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = void 0;
const vscode_1 = require("vscode");
const set_1 = __importDefault(require("lodash/set"));
const get_1 = __importDefault(require("lodash/get"));
const commands_1 = require("../constants/commands");
const file_1 = require("../models/file");
const path = __importStar(require("path"));
const ui_1 = require("../context/ui");
const logger_1 = require("./logger");
function build(paths, basePath) {
    if (ui_1.uiContext.diffViewMode === 'list') {
        return {
            tree: {},
            treeItems: createList(paths, basePath),
        };
    }
    const tree = {};
    try {
        paths.forEach((filePath) => {
            const relativePath = path.relative(basePath, filePath[0]);
            const segments = relativePath.split(path.sep);
            const fileSegment = segments.pop();
            segments.reduce((prev, current) => {
                prev.push(current);
                if (!(0, get_1.default)(tree, prev)) {
                    (0, set_1.default)(tree, prev, {
                        path: path.join(basePath, ...prev),
                    });
                }
                return prev;
            }, []);
            (0, set_1.default)(tree, [...segments, fileSegment], [filePath, relativePath]);
        });
    }
    catch (error) {
        (0, logger_1.log)(`can't build the tree: ${error}`);
    }
    finally {
        const treeItems = createHierarchy(tree);
        return { tree, treeItems };
    }
}
exports.build = build;
function createList(paths, basePath) {
    try {
        return paths.map(([path1, path2]) => {
            const relativePath = path.relative(basePath, path1);
            const fileName = path.basename(path1);
            return new file_1.File(fileName, 'file', vscode_1.TreeItemCollapsibleState.None, {
                title: path1,
                command: commands_1.COMPARE_FILES,
                arguments: [[path1, path2 || ''], relativePath],
            }, undefined, vscode_1.Uri.file(path1), true);
        });
    }
    catch (error) {
        (0, logger_1.log)(`can't create list`, error);
        return [];
    }
}
function createHierarchy(src) {
    const children = Object.entries(src).reduce((prev, [key, childrenOrFileData]) => {
        if (childrenOrFileData.path) {
            const { path } = childrenOrFileData, children = __rest(childrenOrFileData, ["path"]);
            prev.push(new file_1.File(key, 'folder', vscode_1.TreeItemCollapsibleState.Collapsed, undefined, createHierarchy(children), vscode_1.Uri.file(path)));
        }
        else {
            const [paths, relativePath] = childrenOrFileData;
            prev.push(new file_1.File(key, 'file', vscode_1.TreeItemCollapsibleState.None, {
                title: key,
                command: commands_1.COMPARE_FILES,
                arguments: [paths, relativePath],
            }, undefined, vscode_1.Uri.file(paths[0])));
        }
        return prev;
    }, []);
    return children;
}
//# sourceMappingURL=treeBuilder.js.map