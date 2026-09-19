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
exports.extensionUIAssetsTest = void 0;
const adaptersContants_1 = require("./common/adaptersContants");
const chai_1 = require("chai");
const vscode_extension_tester_1 = require("vscode-extension-tester");
/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
function extensionUIAssetsTest() {
    describe('Verify extension\'s base assets are available after installation', () => {
        let view;
        let sideBar;
        let quickBox;
        let driver;
        before(function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(4000);
                view = yield new vscode_extension_tester_1.ActivityBar().getViewControl('Extensions');
                sideBar = yield view.openView();
                driver = vscode_extension_tester_1.VSBrowser.instance.driver;
                if (process.platform === 'darwin') {
                    yield driver.actions().sendKeys(vscode_extension_tester_1.Key.F1).perform();
                    quickBox = yield vscode_extension_tester_1.InputBox.create();
                }
                else {
                    quickBox = (yield new vscode_extension_tester_1.Workbench().openCommandPrompt());
                }
            });
        });
        it('Command Palette prompt knows RSP commands', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(45000);
                yield verifyCommandPalette(quickBox);
            });
        });
        it('Runtime Server Protocol UI extension is installed', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(8000);
                const section = yield sideBar.getContent().getSection('Installed');
                const item = yield section.findItem(`@installed ${adaptersContants_1.AdaptersConstants.RSP_UI_NAME}`);
                chai_1.expect(item).not.undefined;
            });
        });
        it('Action button "Create New Server..." from Servers tab is available', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(8000);
                const explorerView = yield new vscode_extension_tester_1.ActivityBar().getViewControl('Explorer');
                const bar = yield explorerView.openView();
                const content = bar.getContent();
                const section = yield content.getSection(adaptersContants_1.AdaptersConstants.RSP_SERVERS_LABEL);
                const actionButton = yield section.getAction(adaptersContants_1.AdaptersConstants.RSP_SERVER_ACTION_BUTTON);
                chai_1.expect(yield actionButton.getLabel()).to.equal(adaptersContants_1.AdaptersConstants.RSP_SERVER_ACTION_BUTTON);
            });
        });
        it('Servers tab is available under Explorer bar', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(8000);
                const explorerView = yield new vscode_extension_tester_1.ActivityBar().getViewControl('Explorer');
                chai_1.expect(explorerView).not.undefined;
                const bar = yield explorerView.openView();
                const content = bar.getContent();
                const sections = yield content.getSections();
                chai_1.expect(yield Promise.all(sections.map(item => item.getTitle()))).to.include(adaptersContants_1.AdaptersConstants.RSP_SERVERS_LABEL);
                const section = yield content.getSection(adaptersContants_1.AdaptersConstants.RSP_SERVERS_LABEL);
                chai_1.expect(section).not.undefined;
                chai_1.expect(yield section.getTitle()).to.equal(adaptersContants_1.AdaptersConstants.RSP_SERVERS_LABEL);
                const actionsButton = yield section.getActions();
                chai_1.expect(actionsButton.length).to.equal(1);
                chai_1.expect(yield actionsButton[0].getLabel()).to.equal(adaptersContants_1.AdaptersConstants.RSP_SERVER_ACTION_BUTTON);
            });
        });
        after(function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(5000);
                if (sideBar && (yield sideBar.isDisplayed())) {
                    const viewControl = yield new vscode_extension_tester_1.ActivityBar().getViewControl('Extensions');
                    sideBar = yield viewControl.openView();
                    const titlePart = sideBar.getTitlePart();
                    const actionButton = new vscode_extension_tester_1.TitleActionButton(vscode_extension_tester_1.By.xpath('.//a[@aria-label="Clear Extensions Search Results"]'), titlePart);
                    if (actionButton.isEnabled()) {
                        yield actionButton.click();
                    }
                }
                if (quickBox && (yield quickBox.isDisplayed())) {
                    yield quickBox.cancel();
                }
            });
        });
    });
}
exports.extensionUIAssetsTest = extensionUIAssetsTest;
function verifyCommandPalette(input) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!input || !(yield input.isDisplayed())) {
            input = (yield new vscode_extension_tester_1.Workbench().openCommandPrompt());
        }
        yield input.setText(`>${adaptersContants_1.AdaptersConstants.RSP_COMMAND}`);
        const options = yield input.getQuickPicks();
        chai_1.expect(yield options[0].getText()).not.equal('No commands matching');
        chai_1.expect(yield options[0].getText()).not.equal('No results found');
        for (const element of adaptersContants_1.AdaptersConstants.RSP_MAIN_COMMANDS) {
            const expression = `${adaptersContants_1.AdaptersConstants.RSP_COMMAND} ${element}`;
            yield input.setText(`>${expression}`);
            const option = yield input.getQuickPicks();
            const optionsString = yield Promise.all(option.map(item => item.getText()));
            chai_1.expect(optionsString).to.have.members([expression]);
        }
    });
}
//# sourceMappingURL=extensionUITest.js.map