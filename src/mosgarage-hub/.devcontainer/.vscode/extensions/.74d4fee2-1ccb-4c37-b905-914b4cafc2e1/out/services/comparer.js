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
exports.CompareResult = exports.compareFolders = exports.showFile = exports.showDiffs = exports.chooseFoldersAndCompare = void 0;
const vscode_1 = require("vscode");
const dir_compare_1 = require("dir-compare");
const openFolder_1 = require("./openFolder");
const path = __importStar(require("path"));
const configuration_1 = require("./configuration");
const path_1 = require("../context/path");
const ignoreExtensionTools_1 = require("./ignoreExtensionTools");
const logger_1 = require("./logger");
const ui_1 = require("../utils/ui");
const validators_1 = require("./validators");
const includeExcludeFilesGetter_1 = require("./includeExcludeFilesGetter");
const gitignoreFilter_1 = require("./gitignoreFilter");
const diffMergeExtension = vscode_1.extensions.getExtension('moshfeu.diff-merge');
function chooseFoldersAndCompare(path) {
    return __awaiter(this, void 0, void 0, function* () {
        const folder1Path = path || (yield (0, openFolder_1.openFolder)());
        const folder2Path = yield (0, openFolder_1.openFolder)();
        if (!folder1Path || !folder2Path) {
            return;
        }
        path_1.pathContext.setPaths(folder1Path, folder2Path);
        return compareFolders();
    });
}
exports.chooseFoldersAndCompare = chooseFoldersAndCompare;
function getTitle(path, relativePath, titleFormat = (0, configuration_1.getConfiguration)('diffViewTitle')) {
    switch (titleFormat) {
        case 'name only':
            return relativePath;
        case 'compared path':
            return `${path} ↔ ${relativePath}`;
        default:
            return '';
    }
}
function showDiffs([file1, file2], relativePath) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((0, configuration_1.getConfiguration)('useDiffMerge')) {
            if (diffMergeExtension) {
                vscode_1.commands.executeCommand('diffMerge.compareSelected', vscode_1.Uri.file(file1), [
                    vscode_1.Uri.file(file1),
                    vscode_1.Uri.file(file2),
                ]);
            }
            else {
                vscode_1.window.showErrorMessage('In order to use "Diff & Merge" extension you should install / enable it');
            }
            return;
        }
        else {
            vscode_1.commands.executeCommand('vscode.diff', vscode_1.Uri.file(file1), vscode_1.Uri.file(file2), getTitle(file1, relativePath, (0, ignoreExtensionTools_1.compareIgnoredExtension)(file1, file2) ? 'full path' : undefined));
        }
    });
}
exports.showDiffs = showDiffs;
function showFile(file) {
    return __awaiter(this, void 0, void 0, function* () {
        vscode_1.commands.executeCommand('vscode.open', vscode_1.Uri.file(file));
    });
}
exports.showFile = showFile;
function getOptions() {
    const { compareContent, ignoreFileNameCase, ignoreExtension, ignoreWhiteSpaces, ignoreAllWhiteSpaces, ignoreEmptyLines, ignoreLineEnding, respectGitIgnore, } = (0, configuration_1.getConfiguration)('compareContent', 'ignoreFileNameCase', 'ignoreExtension', 'ignoreWhiteSpaces', 'ignoreAllWhiteSpaces', 'ignoreEmptyLines', 'ignoreLineEnding', 'respectGitIgnore');
    const { excludeFilter, includeFilter } = (0, includeExcludeFilesGetter_1.getIncludeAndExcludePaths)();
    const filterHandler = respectGitIgnore ? (0, gitignoreFilter_1.getGitignoreFilter)(...path_1.pathContext.getPaths()) : undefined;
    const options = {
        compareContent,
        excludeFilter,
        includeFilter,
        ignoreCase: ignoreFileNameCase,
        ignoreExtension,
        ignoreWhiteSpaces,
        ignoreAllWhiteSpaces,
        ignoreEmptyLines,
        ignoreLineEnding,
        filterHandler,
        compareFileAsync: dir_compare_1.fileCompareHandlers.lineBasedFileCompare.compareAsync,
        compareNameHandler: (ignoreExtension && ignoreExtensionTools_1.compareName) || undefined,
    };
    return options;
}
function compareFolders() {
    return __awaiter(this, void 0, void 0, function* () {
        const emptyResponse = () => Promise.resolve(new CompareResult([], [], [], [], [], '', ''));
        try {
            if (!(0, ignoreExtensionTools_1.validate)()) {
                return emptyResponse();
            }
            const [folder1Path, folder2Path] = path_1.pathContext.getPaths();
            (0, validators_1.validatePermissions)(folder1Path, folder2Path);
            const showIdentical = (0, configuration_1.getConfiguration)('showIdentical');
            const options = getOptions();
            const concatenatedOptions = Object.assign({ compareContent: true, handlePermissionDenied: true }, options);
            // do the comparison
            const res = yield (0, dir_compare_1.compare)(folder1Path, folder2Path, concatenatedOptions);
            (0, logger_1.printOptions)(options);
            (0, logger_1.printResult)(res);
            // get the diffs
            const { diffSet = [] } = res;
            // diffSet contains all the files and filter only the not equals files and map them to pairs of Uris
            const distinct = diffSet
                .filter((diff) => diff.state === 'distinct')
                .map((diff) => [path.join(diff.path1, diff.name1), path.join(diff.path2, diff.name2)]);
            // readable 👍 performance 👎
            const left = diffSet
                .filter((diff) => diff.state === 'left' && diff.type1 === 'file')
                .map((diff) => [buildPath(diff, '1')]);
            const right = diffSet
                .filter((diff) => diff.state === 'right' && diff.type2 === 'file')
                .map((diff) => [buildPath(diff, '2')]);
            const identicals = showIdentical
                ? diffSet
                    .filter((diff) => diff.state === 'equal' && diff.type1 === 'file')
                    .map((diff) => [buildPath(diff, '1')])
                : [];
            const unaccessibles = diffSet
                .filter((diff) => diff.permissionDeniedState !== 'access-ok')
                .map((diff) => buildPath(diff, diff.permissionDeniedState === 'access-error-left' ? '1' : '2'));
            return new CompareResult(distinct, left, right, identicals, unaccessibles, folder1Path, folder2Path);
        }
        catch (error) {
            (0, logger_1.log)('error while comparing', error);
            (0, ui_1.showErrorMessage)('Oops, something went wrong while comparing', error);
            return emptyResponse();
        }
    });
}
exports.compareFolders = compareFolders;
function buildPath(diff, side) {
    if (!diff[`path${side}`] || !diff[`name${side}`]) {
        throw new Error('path or name is missing');
    }
    return path.join(diff[`path${side}`], diff[`name${side}`]);
}
class CompareResult {
    constructor(distinct, left, right, identicals, unaccessibles, leftPath, rightPath) {
        this.distinct = distinct;
        this.left = left;
        this.right = right;
        this.identicals = identicals;
        this.unaccessibles = unaccessibles;
        this.leftPath = leftPath;
        this.rightPath = rightPath;
        //
    }
    hasResult() {
        return this.distinct.length || this.left.length || this.right.length;
    }
}
exports.CompareResult = CompareResult;
//# sourceMappingURL=comparer.js.map