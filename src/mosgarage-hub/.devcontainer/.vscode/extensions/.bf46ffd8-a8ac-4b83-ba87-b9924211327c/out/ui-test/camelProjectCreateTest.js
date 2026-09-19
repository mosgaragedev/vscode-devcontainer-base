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
exports.testCreatingCamelProject = exports.WORKSPACE_PATH = void 0;
const fs = require("fs");
const vscode_extension_tester_1 = require("vscode-extension-tester");
const chai_1 = require("chai");
const commonUtils_1 = require("./common/commonUtils");
const projectInitializerConstants_1 = require("./common/projectInitializerConstants");
let path = require('path');
const CAMEL_MISSIONS_EXPECTED = [
    'circuit-breaker', 'configmap', 'health-check', 'rest-http', 'istio-distributed-tracing'
];
const DIR = 'Fuse_Camel_TestFolder';
const RUNTIME_VERSION = 'fuse redhat760';
// temp directory for testing
exports.WORKSPACE_PATH = path.join(path.resolve(__dirname, '..', '..'), '.ui-testing');
/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
function testCreatingCamelProject() {
    describe('Verify Project initializer Camel-Fuse projects creation', function () {
        return __awaiter(this, void 0, void 0, function* () {
            let homedir;
            let inputBox;
            let driver;
            this.beforeAll('Workspace setup', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    this.timeout(60000);
                    driver = vscode_extension_tester_1.VSBrowser.instance.driver;
                    if (!fs.existsSync(exports.WORKSPACE_PATH)) {
                        fs.mkdirSync(exports.WORKSPACE_PATH);
                    }
                    homedir = exports.WORKSPACE_PATH + path.sep + DIR;
                    if (!fs.existsSync(homedir)) {
                        fs.mkdirSync(homedir);
                    }
                    // Open Workspace
                    yield (0, commonUtils_1.openCommandPrompt)();
                    const quick = yield vscode_extension_tester_1.InputBox.create();
                    yield quick.setText('>File: Open Folder...');
                    yield quick.confirm();
                    let confirmedPrompt = yield vscode_extension_tester_1.InputBox.create();
                    yield confirmedPrompt.setText(homedir);
                    yield confirmedPrompt.confirm();
                    yield new Promise(resolve => setTimeout(resolve, 5000));
                });
            });
            for (const mission of CAMEL_MISSIONS_EXPECTED) {
                describe('Test creating Camel-Fuse project ' + mission + ' runtime and version ' + RUNTIME_VERSION, function () {
                    return __awaiter(this, void 0, void 0, function* () {
                        this.timeout(60000);
                        before('Open command prompt', function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                try {
                                    inputBox = yield (0, commonUtils_1.openCommandPrompt)();
                                }
                                catch (error) {
                                    chai_1.expect.fail('Could not open command palette - timed out on error: ' + error.message);
                                }
                            });
                        });
                        after(function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                this.timeout(10000);
                                if (inputBox && (yield inputBox.isDisplayed())) {
                                    yield inputBox.cancel();
                                }
                                // delete created project - files from the folder
                                (0, commonUtils_1.removeFilePathRecursively)(homedir);
                            });
                        });
                        it('Select camel project', function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                yield (0, commonUtils_1.typeCommandConfirm)(`>${projectInitializerConstants_1.ProjectInitializer.PI_GENERAL.camel}`, vscode_extension_tester_1.QuickPickItem.prototype.getLabel);
                            });
                        });
                        it(`Select mission ${mission}`, function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                inputBox = yield vscode_extension_tester_1.InputBox.create();
                                (0, chai_1.expect)(yield inputBox.getPlaceHolder()).to.be.equal('Choose mission');
                                const quickPick = yield (0, commonUtils_1.waitForQuickPick)({
                                    input: inputBox,
                                    quickPickText: mission,
                                    quickPickGetter: vscode_extension_tester_1.QuickPickItem.prototype.getLabel,
                                    timeout: 5000
                                }).catch(() => chai_1.expect.fail(`Could not find mission: ${mission}`));
                                if (quickPick) {
                                    yield quickPick.select();
                                }
                                else {
                                    chai_1.expect.fail('QuickPick was not found for ' + mission);
                                }
                            });
                        });
                        it(`Select runtime version ${RUNTIME_VERSION}`, function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                inputBox = yield vscode_extension_tester_1.InputBox.create();
                                (0, chai_1.expect)(yield inputBox.getPlaceHolder()).to.be.equal('Choose runtime');
                                yield inputBox.selectQuickPick(RUNTIME_VERSION);
                                inputBox = yield vscode_extension_tester_1.InputBox.create();
                                (0, chai_1.expect)(yield inputBox.getPlaceHolder()).to.be.equal('Enter the group id');
                            });
                        });
                        it('Select default groupId', function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                inputBox = yield vscode_extension_tester_1.InputBox.create();
                                (0, chai_1.expect)(yield inputBox.getPlaceHolder()).to.be.equal('Enter the group id');
                                yield inputBox.confirm();
                            });
                        });
                        it('Select default artifactId', function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                inputBox = yield vscode_extension_tester_1.InputBox.create();
                                (0, chai_1.expect)(yield inputBox.getPlaceHolder()).to.be.equal('Enter the artifact id');
                                yield inputBox.confirm();
                            });
                        });
                        it('Select default version', function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                inputBox = yield vscode_extension_tester_1.InputBox.create();
                                (0, chai_1.expect)(yield inputBox.getPlaceHolder()).to.be.equal('Enter the version');
                                yield inputBox.confirm();
                            });
                        });
                        it('Select home directory', function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                inputBox = yield vscode_extension_tester_1.InputBox.create();
                                (0, chai_1.expect)(yield inputBox.getPlaceHolder()).to.be.equal('Select the target workspace folder');
                                yield inputBox.confirm();
                                yield driver.wait(() => __awaiter(this, void 0, void 0, function* () { return !(yield inputBox.isDisplayed()); }), 3000);
                            });
                        });
                        it('Check notification', function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                this.timeout(12000);
                                // check the notification 'Project saved to ;
                                // on Windows seems the C: is translated to c: by VSCode so we can't check this part
                                let notification;
                                try {
                                    notification = yield (0, commonUtils_1.notificationExists)('Project saved to ', 5000);
                                }
                                catch (error) {
                                    chai_1.expect.fail(`Could not find notification: ${error}`);
                                }
                                try {
                                    if (notification) {
                                        yield driver.actions().mouseMove(notification).perform();
                                        yield new Promise(resolve => setTimeout(resolve, 1000));
                                        yield notification.dismiss();
                                    }
                                }
                                catch (error) {
                                    chai_1.expect.fail(`Could not dismiss notifications. Error: ${error}`);
                                }
                            });
                        });
                        it('Check if explorer contains created project', function () {
                            var _a;
                            return __awaiter(this, void 0, void 0, function* () {
                                // check explorer that it contains created project
                                const explorerView = yield ((_a = (yield new vscode_extension_tester_1.ActivityBar().getViewControl('Explorer'))) === null || _a === void 0 ? void 0 : _a.openView());
                                const viewTab = yield (explorerView === null || explorerView === void 0 ? void 0 : explorerView.getContent().getSection(DIR));
                                yield driver.wait(() => __awaiter(this, void 0, void 0, function* () {
                                    const items = yield (viewTab === null || viewTab === void 0 ? void 0 : viewTab.getVisibleItems());
                                    return items.find((item) => __awaiter(this, void 0, void 0, function* () { return (yield item.getLabel()) === 'pom.xml'; })) !== undefined;
                                }), 8000, 'Could not find pom.xml in file explorer.').catch(chai_1.expect.fail);
                            });
                        });
                    });
                });
            }
        });
    });
}
exports.testCreatingCamelProject = testCreatingCamelProject;
//# sourceMappingURL=camelProjectCreateTest.js.map