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
exports.pickFromRecents = void 0;
const vscode_1 = require("vscode");
const globalState_1 = require("./globalState");
const ui_1 = require("../utils/ui");
const commands_1 = require("../constants/commands");
const logger_1 = require("./logger");
function pickFromRecents() {
    return __awaiter(this, void 0, void 0, function* () {
        const paths = globalState_1.globalState.getPaths();
        if (!(paths === null || paths === void 0 ? void 0 : paths.length)) {
            (0, ui_1.showInfoMessageWithTimeout)('History is empty');
            return;
        }
        const chosen = yield vscode_1.window.showQuickPick(Array.from(paths), {
            placeHolder: 'Pick from history',
        });
        if (!chosen) {
            return;
        }
        const URIs = chosen.split(globalState_1.SEPERATOR).map((path) => ({
            fsPath: path
        }));
        try {
            yield vscode_1.commands.executeCommand(commands_1.COMPARE_SELECTED_FOLDERS, undefined, URIs);
        }
        catch (error) {
            (0, logger_1.log)(`failed to run COMPARE_SELECTED_FOLDERS because ${error}`);
        }
    });
}
exports.pickFromRecents = pickFromRecents;
//# sourceMappingURL=pickFromRecentCompares.js.map