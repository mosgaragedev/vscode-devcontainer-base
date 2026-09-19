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
exports.testCommandPaletteOffering = void 0;
const vscode_extension_tester_1 = require("vscode-extension-tester");
const commonUtils_1 = require("./common/commonUtils");
const projectInitializerConstants_1 = require("./common/projectInitializerConstants");
const GENERAL_PROJECT_EXPECTED = [
    'crud', 'cache', 'circuit-breaker', 'configmap', 'health-check', 'messaging', 'rest-http', 'rest-http-secured', 'istio-distributed-tracing'
];
/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
function testCommandPaletteOffering() {
    describe('Verify Project initializer Command palette options', () => {
        let inputBox;
        it('Command palette should show proper options on the first level', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(8000);
                yield inputBox.setText('>Project initializer');
                yield (0, commonUtils_1.verifyQuickPicks)(inputBox, projectInitializerConstants_1.ProjectInitializer.FIRST_LEVEL_OPTIONS, vscode_extension_tester_1.QuickPickItem.prototype.getLabel, 4500);
                yield inputBox.clear();
            });
        });
        it('Options available after general Project Initializer project generation', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(12000);
                yield (0, commonUtils_1.typeCommandConfirm)('>' + projectInitializerConstants_1.ProjectInitializer.PI_GENERAL.general, vscode_extension_tester_1.QuickPickItem.prototype.getLabel, 7500);
                inputBox = yield vscode_extension_tester_1.InputBox.create();
                yield (0, commonUtils_1.verifyQuickPicks)(inputBox, GENERAL_PROJECT_EXPECTED, vscode_extension_tester_1.QuickPickItem.prototype.getLabel, 5000);
            });
        });
        before(function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(8000);
                inputBox = yield (0, commonUtils_1.openCommandPrompt)();
            });
        });
        after(function () {
            return __awaiter(this, void 0, void 0, function* () {
                // ignore cancel command if input is not visible
                yield (inputBox === null || inputBox === void 0 ? void 0 : inputBox.cancel().catch(() => null));
            });
        });
    });
}
exports.testCommandPaletteOffering = testCommandPaletteOffering;
//# sourceMappingURL=commandPaletteOptionsTest.js.map