"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const extension_telemetry_1 = require("@vscode/extension-telemetry");
const fs_1 = require("fs");
const vscode = require("vscode");
const codeLens_1 = require("./codeLens");
const command_1 = require("./command");
const testProvider_1 = require("./testProvider");
const _TELEMETRY_CONNECTION_STRING = 'InstrumentationKey=52da75ef-7ead-4f50-be55-f5644f9b7f4f;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/;ApplicationId=20ec7ba9-71fc-446e-a841-80c584d1292c';
let _reporter;
function activate(context) {
    context.subscriptions.push(_reporter = new extension_telemetry_1.default(context.extensionMode === vscode.ExtensionMode.Production ? _TELEMETRY_CONNECTION_STRING : ''));
    (0, fs_1.mkdirSync)(context.logUri.fsPath, { recursive: true });
    const gocheck = setupGocheckTestProvider(context, _reporter);
    context.subscriptions.push(gocheck.controller, gocheck.output, gocheck.provider);
    const qtsuite = setupQtsuiteTestProvider(context, _reporter);
    context.subscriptions.push(qtsuite.controller, qtsuite.output, qtsuite.provider);
    context.subscriptions.push(vscode.languages.registerCodeLensProvider({ language: 'go', pattern: '/**/*_test.go' }, new codeLens_1.ExecuteTestCodeLensProvider([gocheck.provider, qtsuite.provider])));
    const cmd = new command_1.CommandsProvider([gocheck.provider, qtsuite.provider]);
    context.subscriptions.push(...(0, command_1.registerCommands)(cmd));
    vscode.commands.executeCommand('testing.refreshTests');
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
function setupGocheckTestProvider(context, reporter) {
    const controller = vscode.tests.createTestController('gocheck', 'Go (gocheck)');
    const output = vscode.window.createOutputChannel('Go (gocheck)');
    const adapter = new testProvider_1.GocheckTestLibraryAdapter();
    const telemetry = { reporter, events: { run: 'gocheck.run', debug: 'gocheck.debug', } };
    const provider = new testProvider_1.TestProvider(telemetry, controller, output, adapter, context.logUri);
    return { controller, output, provider };
}
function setupQtsuiteTestProvider(context, reporter) {
    const controller = vscode.tests.createTestController('qtsuite', 'Go (qtsuite)');
    const output = vscode.window.createOutputChannel('Go (qtsuite)');
    const adapter = new testProvider_1.QtsuiteTestLibraryAdapter();
    const telemetry = { reporter, events: { run: 'quicktest.run', debug: 'quicktest.debug', } };
    const provider = new testProvider_1.TestProvider(telemetry, controller, output, adapter, context.logUri);
    return { controller, output, provider };
}
//# sourceMappingURL=extension.js.map