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
const baseExtensionTest_1 = require("./baseExtensionTest");
const vscode_extension_tester_1 = require("vscode-extension-tester");
const commandPaletteOptionsTest_1 = require("./commandPaletteOptionsTest");
const camelProjectCreateTest_1 = require("./camelProjectCreateTest");
const camelProjectOfferingTest_1 = require("./camelProjectOfferingTest");
/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
describe('Project initializer UI tests', function () {
    vscode_extension_tester_1.QuickPickItem.prototype.select = function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getDriver().executeScript('arguments[0].click();', this);
        });
    };
    (0, baseExtensionTest_1.baseExtensionUITest)();
    (0, commandPaletteOptionsTest_1.testCommandPaletteOffering)();
    (0, camelProjectCreateTest_1.testCreatingCamelProject)();
    (0, camelProjectOfferingTest_1.testFuseProjectOffering)();
});
//# sourceMappingURL=allTestsSuite.js.map