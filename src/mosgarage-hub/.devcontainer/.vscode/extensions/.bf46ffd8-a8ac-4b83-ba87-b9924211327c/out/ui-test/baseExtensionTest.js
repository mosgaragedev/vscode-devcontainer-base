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
exports.baseExtensionUITest = void 0;
const vscode_extension_tester_1 = require("vscode-extension-tester");
const chai_1 = require("chai");
const commonUtils_1 = require("./common/commonUtils");
const projectInitializerConstants_1 = require("./common/projectInitializerConstants");
function baseExtensionUITest() {
    describe('Verify extension\'s base assets available after install', () => {
        let inputBox;
        it('Command Palette prompt knows project initializer commands', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(4000);
                inputBox = yield (0, commonUtils_1.openCommandPrompt)(this.timeout() - 500);
                yield verifyCommandPalette(inputBox);
            });
        });
        it('Project initializer extension is installed', function () {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(5000);
                const view = yield ((_a = (yield new vscode_extension_tester_1.ActivityBar().getViewControl('Extensions'))) === null || _a === void 0 ? void 0 : _a.openView());
                const section = yield (view === null || view === void 0 ? void 0 : view.getContent().getSection('Installed'));
                let item = yield section.findItem(`@installed ${projectInitializerConstants_1.ProjectInitializer.PROJECT_INITIALIZER_FULL_NAME}`);
                (0, chai_1.expect)(item).not.undefined;
            });
        });
        after(function () {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                if (inputBox && (yield inputBox.isDisplayed())) {
                    yield inputBox.cancel();
                }
                yield ((_a = (yield new vscode_extension_tester_1.ActivityBar().getViewControl('Extensions'))) === null || _a === void 0 ? void 0 : _a.closeView());
            });
        });
    });
}
exports.baseExtensionUITest = baseExtensionUITest;
function verifyCommandPalette(input) {
    return __awaiter(this, void 0, void 0, function* () {
        yield input.setText(`>${projectInitializerConstants_1.ProjectInitializer.PROJECT_INITIALIZER_NAME}`);
        const options = yield input.getQuickPicks();
        (0, chai_1.expect)(options[0].getText()).not.equal('No commands matching');
    });
}
//# sourceMappingURL=baseExtensionTest.js.map