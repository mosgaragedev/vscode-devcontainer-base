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
const vscode = require("vscode");
const FenixConfig_1 = require("../core/FenixConfig");
exports.default = {
    'fenix.env.new': (e) => __awaiter(void 0, void 0, void 0, function* () {
        const id = yield vscode.window.showInputBox({ placeHolder: 'Enter variable id' });
        if (!id) {
            return;
        }
        const value = yield vscode.window.showInputBox({ placeHolder: 'Enter variable value' });
        if (!value) {
            return;
        }
        yield FenixConfig_1.default.get().addEnvVar(id, value);
    }),
    'fenix.env.edit': (e) => __awaiter(void 0, void 0, void 0, function* () {
        const newValue = yield vscode.window.showInputBox({
            value: e.varValue,
        });
        if (newValue) {
            FenixConfig_1.default.get().editVar(e.varID, newValue);
        }
    }),
    'fenix.env.delete': (e) => __awaiter(void 0, void 0, void 0, function* () {
        yield FenixConfig_1.default.get().deleteVar(e.varID);
    }),
};
//# sourceMappingURL=EnvironmentCommands.js.map