"use strict";
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
exports.activate = void 0;
const vscode_1 = require("vscode");
const foldersCompareProvider_1 = require("./providers/foldersCompareProvider");
const commands_1 = require("./constants/commands");
const viewOnlyProvider_1 = require("./providers/viewOnlyProvider");
const globalState_1 = require("./services/globalState");
const pickFromRecentCompares_1 = require("./services/pickFromRecentCompares");
const configuration_1 = require("./services/configuration");
const ui_1 = require("./utils/ui");
const ignoreExtensionTools_1 = require("./services/ignoreExtensionTools");
const ui_2 = require("./context/ui");
function activate(context) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        globalState_1.globalState.init(context);
        ui_2.uiContext.init();
        const onlyInA = new viewOnlyProvider_1.ViewOnlyProvider();
        const onlyInB = new viewOnlyProvider_1.ViewOnlyProvider();
        const identicals = new viewOnlyProvider_1.ViewOnlyProvider(false);
        const foldersCompareProvider = new foldersCompareProvider_1.CompareFoldersProvider(onlyInA, onlyInB, identicals);
        context.subscriptions.push(vscode_1.window.registerTreeDataProvider('foldersCompareAppService', foldersCompareProvider), vscode_1.window.registerTreeDataProvider('foldersCompareAppServiceOnlyA', onlyInA), vscode_1.window.registerTreeDataProvider('foldersCompareAppServiceOnlyB', onlyInB), vscode_1.window.registerTreeDataProvider('foldersCompareAppServiceIdenticals', identicals), vscode_1.commands.registerCommand(commands_1.COMPARE_FILES, foldersCompareProvider.onFileClicked), vscode_1.commands.registerCommand(commands_1.CHOOSE_FOLDERS_AND_COMPARE, foldersCompareProvider.chooseFoldersAndCompare), vscode_1.commands.registerCommand(commands_1.COMPARE_FOLDERS_AGAINST_EACH_OTHER, foldersCompareProvider.compareFoldersAgainstEachOther), vscode_1.commands.registerCommand(commands_1.COMPARE_FOLDERS_AGAINST_WORKSPACE, foldersCompareProvider.chooseFoldersAndCompare), vscode_1.commands.registerCommand(commands_1.COMPARE_SELECTED_FOLDERS, foldersCompareProvider.compareSelectedFolders), vscode_1.commands.registerCommand(commands_1.DISMISS_DIFFERENCE, foldersCompareProvider.dismissDifference), vscode_1.commands.registerCommand(commands_1.REFRESH, foldersCompareProvider.refresh), vscode_1.commands.registerCommand(commands_1.SWAP, foldersCompareProvider.swap), vscode_1.commands.registerCommand(commands_1.VIEW_AS_LIST, foldersCompareProvider.viewAs('list')), vscode_1.commands.registerCommand(commands_1.VIEW_AS_TREE, foldersCompareProvider.viewAs('tree')), vscode_1.commands.registerCommand(commands_1.COPY_TO_COMPARED, foldersCompareProvider.copyToCompared), vscode_1.commands.registerCommand(commands_1.COPY_TO_MY, foldersCompareProvider.copyToMy), vscode_1.commands.registerCommand(commands_1.TAKE_MY_FILE, foldersCompareProvider.takeMyFile), vscode_1.commands.registerCommand(commands_1.TAKE_COMPARED_FILE, foldersCompareProvider.takeComparedFile), vscode_1.commands.registerCommand(commands_1.DELETE_FILE, foldersCompareProvider.deleteFile), vscode_1.commands.registerCommand(commands_1.PICK_FROM_RECENT_COMPARES, pickFromRecentCompares_1.pickFromRecents), vscode_1.commands.registerCommand(commands_1.CLEAR_RECENT_COMPARES, globalState_1.globalState.clear));
        const { folderLeft, folderRight } = (0, configuration_1.getConfiguration)('folderLeft', 'folderRight', 'ignoreExtension');
        if (folderLeft || folderRight) {
            // if the user set both folderLeft and folderRight they will be used on activation
            if (!folderLeft || !folderRight) {
                vscode_1.window.showInformationMessage(`In order to compare folders, the command should have been called with 2 folderLeft and folderRight settings`);
                return;
            }
            const folderLeftUri = vscode_1.Uri.file(folderLeft);
            const folderRightUri = vscode_1.Uri.file(folderRight);
            (0, ui_1.showDoneableInfo)(`Please wait, comparing folder ${folderLeft}-->${folderRight}`, () => foldersCompareProvider.compareSelectedFolders(folderLeftUri, [folderLeftUri, folderRightUri]));
        }
        else if (process.env.COMPARE_FOLDERS === 'DIFF') {
            if (((_a = vscode_1.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a.length) !== 2) {
                vscode_1.window.showInformationMessage(`In order to compare folders, the command should been called with 2 folders: e.g. COMPARE_FOLDERS=DIFF code path/to/folder1 path/to/folder2. Actual folders: ${((_b = vscode_1.workspace.workspaceFolders) === null || _b === void 0 ? void 0 : _b.length) || 0}`);
                return;
            }
            const [folder1Path, folder2Path] = vscode_1.workspace.workspaceFolders.map(folder => folder.uri);
            foldersCompareProvider.compareSelectedFolders(folder1Path, [folder1Path, folder2Path]);
        }
        (0, ignoreExtensionTools_1.validate)();
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map