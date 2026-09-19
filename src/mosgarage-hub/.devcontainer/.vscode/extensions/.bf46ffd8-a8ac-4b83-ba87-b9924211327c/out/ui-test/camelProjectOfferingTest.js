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
exports.testFuseProjectOffering = void 0;
const testUtils_1 = require("./common/testUtils");
const Catalog_1 = require("../Catalog");
const commonUtils_1 = require("./common/commonUtils");
const chai_1 = require("chai");
const vscode_extension_tester_1 = require("vscode-extension-tester");
const mocha_1 = require("mocha");
const projectInitializerConstants_1 = require("./common/projectInitializerConstants");
const CAMEL_MISSIONS_EXPECTED = [
    'circuit-breaker', 'configmap', 'health-check', 'rest-http', 'istio-distributed-tracing'
];
/**
 * @author odockal@redhat.com
 */
function testFuseProjectOffering() {
    describe('Verify Project initializer Camel/Fuse Command palette options', function () {
        return __awaiter(this, void 0, void 0, function* () {
            let inputBox;
            let catalogBuilder = new Catalog_1.Catalog(projectInitializerConstants_1.ProjectInitializer.BUILDER_CATALOG_URL);
            let catalog = yield catalogBuilder.getCatalog();
            let catalogFuse = filterCatalogForRuntimes(catalog, projectInitializerConstants_1.ProjectInitializer.CAMEL_FUSE_RUNTIME_IDS);
            for (let mission of catalogFuse.missions) {
                describe(`Verifying runtimes and versions for '${mission.id}' mission`, function () {
                    return __awaiter(this, void 0, void 0, function* () {
                        this.timeout(10000);
                        before(function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                inputBox = yield (0, commonUtils_1.openCommandPrompt)();
                            });
                        });
                        after(function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                if (inputBox && (yield inputBox.isDisplayed())) {
                                    yield inputBox.cancel();
                                }
                            });
                        });
                        (0, mocha_1.it)(`Execute command ${projectInitializerConstants_1.ProjectInitializer.PI_GENERAL.camel}`, function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                yield (0, commonUtils_1.typeCommandConfirm)('>' + projectInitializerConstants_1.ProjectInitializer.PI_GENERAL.camel, vscode_extension_tester_1.QuickPickItem.prototype.getLabel);
                            });
                        });
                        (0, mocha_1.it)(`Select mission: ${mission.id}`, function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                inputBox = yield vscode_extension_tester_1.InputBox.create();
                                (0, chai_1.expect)(yield inputBox.getPlaceHolder()).to.be.equal('Choose mission');
                                yield inputBox.selectQuickPick(mission.id);
                            });
                        });
                        (0, mocha_1.it)('Verify mission versions', function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                let expectedRefs = findRefsForMissions(mission.id, catalogFuse.boosters);
                                let expected = expectedRefs.map((runver) => runver.runtime + ' ' + runver.version);
                                inputBox = yield vscode_extension_tester_1.InputBox.create();
                                let actual = yield (0, commonUtils_1.convertScrollableQuickPicksToTextAndDescription)(inputBox);
                                (0, chai_1.expect)(expected).to.have.members(actual);
                            });
                        });
                    });
                });
            }
            (0, mocha_1.it)('Verify options available for Camel/Fuse project', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    this.timeout(10000);
                    yield (0, commonUtils_1.openCommandPrompt)();
                    yield (0, commonUtils_1.typeCommandConfirm)('>' + projectInitializerConstants_1.ProjectInitializer.PI_GENERAL.camel, vscode_extension_tester_1.QuickPickItem.prototype.getLabel);
                    inputBox = yield vscode_extension_tester_1.InputBox.create();
                    (0, testUtils_1.assertEqualOptions)(CAMEL_MISSIONS_EXPECTED, yield (0, commonUtils_1.convertArrayObjectsToText)(yield inputBox.getQuickPicks()));
                    yield inputBox.cancel();
                });
            });
        });
    });
}
exports.testFuseProjectOffering = testFuseProjectOffering;
function filterCatalogForRuntimes(catalog, runtimeIds) {
    let filteredCatalog = JSON.parse(JSON.stringify(catalog));
    filteredCatalog.runtimes = catalog.runtimes.filter((runtime) => { return runtimeIds.indexOf(runtime.id) > -1; });
    let filteredBoosters = catalog.boosters.filter((booster) => { return runtimeIds.indexOf(booster.runtime) > -1; });
    filteredCatalog.boosters = filteredBoosters;
    let filteredMissionIds = filteredBoosters.map((booster) => { return booster.mission; });
    filteredCatalog.missions = catalog.missions.filter((mission) => { return filteredMissionIds.includes(mission.id); });
    return filteredCatalog;
}
function findRefsForMissions(mission, refCatalog) {
    let missionsRefs = refCatalog.filter((ref) => { return mission.indexOf(ref.mission) > -1; });
    return missionsRefs;
}
//# sourceMappingURL=camelProjectOfferingTest.js.map