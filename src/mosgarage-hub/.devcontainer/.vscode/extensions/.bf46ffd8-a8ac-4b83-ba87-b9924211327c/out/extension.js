'use strict';
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
exports.deactivate = exports.filterCatalogForRuntimes = exports.activate = exports.SPRINGBOOT_RUNTIME_IDS = exports.THORNTAIL_RUNTIME_IDS = exports.NODEJS_RUNTIME_IDS = exports.GOLANG_RUNTIME_IDS = exports.VERTX_RUNTIME_IDS = exports.CAMEL_FUSE_RUNTIME_IDS = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const Catalog_1 = require("./Catalog");
const yauzl = require("yauzl");
let fs = require('fs');
let p = require('path');
const telemetry_1 = require("./telemetry");
let catalogBuilder = new Catalog_1.Catalog(vscode.workspace.getConfiguration("project.initializer").get("endpointUrl", "https://forge.api.openshift.io/api/"));
exports.CAMEL_FUSE_RUNTIME_IDS = ['camel', 'fuse'];
exports.VERTX_RUNTIME_IDS = ['vert.x'];
exports.GOLANG_RUNTIME_IDS = ['golang'];
exports.NODEJS_RUNTIME_IDS = ['nodejs'];
exports.THORNTAIL_RUNTIME_IDS = ['thorntail'];
exports.SPRINGBOOT_RUNTIME_IDS = ['spring-boot'];
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let genericGenerationCommand = vscode.commands.registerCommand('project.initializer.generate', () => generateFromAllChoices('project.initializer.generate'));
    let fuseGenerationCommand = registerCommandForRuntimes('camelfuse', exports.CAMEL_FUSE_RUNTIME_IDS);
    let vertxGenerationCommand = registerCommandForRuntimes('vertx', exports.VERTX_RUNTIME_IDS);
    let goLangGenerationCommand = registerCommandForRuntimes('golang', exports.GOLANG_RUNTIME_IDS);
    let nodeJSGenerationCommand = registerCommandForRuntimes('nodejs', exports.NODEJS_RUNTIME_IDS);
    let thorntailGenerationCommand = registerCommandForRuntimes('thorntail', exports.THORNTAIL_RUNTIME_IDS);
    let springBootGenerationCommand = registerCommandForRuntimes('springboot', exports.SPRINGBOOT_RUNTIME_IDS);
    let disposableListener = vscode.workspace.onDidChangeConfiguration(event => { updateCatalog(event); });
    context.subscriptions.push(genericGenerationCommand);
    context.subscriptions.push(fuseGenerationCommand);
    context.subscriptions.push(vertxGenerationCommand);
    context.subscriptions.push(goLangGenerationCommand);
    context.subscriptions.push(nodeJSGenerationCommand);
    context.subscriptions.push(thorntailGenerationCommand);
    context.subscriptions.push(springBootGenerationCommand);
    context.subscriptions.push(disposableListener);
    (0, telemetry_1.startTelemetry)(context);
}
exports.activate = activate;
function updateCatalog(event) {
    if (event.affectsConfiguration("project.initializer.endpointUrl")) {
        let url = vscode.workspace.getConfiguration("project.initializer").get("endpointUrl", "https://forge.api.openshift.io/api/");
        if (catalogBuilder.endpoint !== url) {
            catalogBuilder = new Catalog_1.Catalog(url);
        }
    }
}
function registerCommandForRuntimes(commandIdSuffix, runtimeIds) {
    const commandId = 'project.initializer.generate.' + commandIdSuffix;
    return vscode.commands.registerCommand(commandId, () => generateForRuntimes(commandId, runtimeIds));
}
function generateForRuntimes(commandId, runtimeIds) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let catalog = yield catalogBuilder.getCatalog();
            yield generate(commandId, filterCatalogForRuntimes(catalog, runtimeIds));
        }
        catch (error) {
            vscode.window.showErrorMessage("Error while processing Project Initializer" + error);
        }
    });
}
function filterCatalogForRuntimes(catalog, runtimeIds) {
    let filteredCatalog = JSON.parse(JSON.stringify(catalog));
    filteredCatalog.runtimes = catalog.runtimes.filter((runtime) => { return runtimeIds.indexOf(runtime.id) > -1; });
    let filteredBoosters = catalog.boosters.filter((booster) => { return runtimeIds.indexOf(booster.runtime) > -1; });
    filteredCatalog.boosters = filteredBoosters;
    let filteredMissionIds = filteredBoosters.map((booster) => { return booster.mission; });
    filteredCatalog.missions = catalog.missions.filter((mission) => { return filteredMissionIds.includes(mission.id); });
    return filteredCatalog;
}
exports.filterCatalogForRuntimes = filterCatalogForRuntimes;
function generateFromAllChoices(commandId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let catalog = yield catalogBuilder.getCatalog();
            yield generate(commandId, catalog);
        }
        catch (error) {
            vscode.window.showErrorMessage("Error while processing Project Initializer" + error);
        }
    });
}
function generate(commandId, catalog) {
    return __awaiter(this, void 0, void 0, function* () {
        let telemetryProps = {
            identifier: commandId,
        };
        const startTime = Date.now();
        try {
            let missions = catalog.missions.map((mission) => ({ label: mission.id, description: mission.description }));
            let missionId = yield vscode.window.showQuickPick(missions, { placeHolder: 'Choose mission' });
            if (missionId) {
                let boosters = catalog.boosters.filter((item) => item.mission == missionId.label);
                if (boosters) {
                    let runtimeId = yield vscode.window.showQuickPick(boosters.map((item) => ({ label: `${item.runtime} ${item.version}` })), { placeHolder: 'Choose runtime' });
                    if (runtimeId) {
                        let groupId = yield vscode.window.showInputBox({ prompt: 'Group Id', placeHolder: 'Enter the group id', value: vscode.workspace.getConfiguration("project.initializer").get("defaultGroupId") });
                        if (groupId) {
                            let artifactId = yield vscode.window.showInputBox({ prompt: 'Artifact Id', placeHolder: 'Enter the artifact id', value: vscode.workspace.getConfiguration("project.initializer").get("defaultArtifactId") });
                            if (artifactId) {
                                let version = yield vscode.window.showInputBox({ prompt: 'Version', placeHolder: 'Enter the version', value: vscode.workspace.getConfiguration("project.initializer").get("defaultVersion") });
                                if (version) {
                                    vscode.window.setStatusBarMessage("Downloading zip project file", 1000);
                                    let runtimeLabel = runtimeId.label.substring(0, runtimeId.label.indexOf(' '));
                                    let runtimeDescription = runtimeId.label.substring(runtimeId.label.indexOf(' ') + 1, runtimeId.label.length);
                                    console.log(`runtimelabel: ${runtimeLabel} + ${runtimeDescription}`);
                                    let zipProject = yield catalogBuilder.zip(artifactId, missionId.label, runtimeLabel, runtimeDescription, groupId, artifactId, version);
                                    if (zipProject) {
                                        let folder = yield vscode.window.showWorkspaceFolderPick({ placeHolder: 'Select the target workspace folder' });
                                        if (folder) {
                                            vscode.window.setStatusBarMessage("Unzipping project file", 1000);
                                            extract(zipProject, folder.uri.fsPath);
                                            vscode.window.showInformationMessage("Project saved to " + folder.uri.fsPath);
                                            telemetryProps.mission = missionId.label;
                                            telemetryProps.runtime = runtimeId.label;
                                            telemetryProps.runtimeVersion = runtimeId.description;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        catch (error) {
            telemetryProps.error = (0, telemetry_1.sanitize)(error.toString());
        }
        finally {
            telemetryProps.duration = Date.now() - startTime;
            (0, telemetry_1.sendTelemetry)('command', telemetryProps);
        }
    });
}
function extract(content, path) {
    yauzl.fromBuffer(content, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
            throw err;
        }
        zipfile.readEntry();
        zipfile.on("entry", (entry) => {
            console.log("Processing " + entry.fileName);
            let entryPath = removeFirstLevel(entry.fileName);
            if (entryPath !== "/") {
                let mappedPath = p.resolve(path, p.normalize(entryPath));
                if (entryPath.endsWith("/")) {
                    fs.mkdirSync(mappedPath);
                }
                else {
                    zipfile.openReadStream(entry, (err, stream) => {
                        if (err) {
                            throw err;
                        }
                        stream.pipe(fs.createWriteStream(mappedPath, { mode: entry.externalFileAttributes >>> 16 }));
                    });
                }
            }
            zipfile.readEntry();
        });
    });
}
function removeFirstLevel(path) {
    let index = path.indexOf("/");
    if (index !== (-1)) {
        path = path.substring(index + 1);
    }
    return path;
}
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map