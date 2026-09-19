"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandsProvider = exports.registerCommands = exports.COMMAND_SHOW_LAUNCH_CONFIGURATION = exports.COMMAND_MOVE_CURSOR_AND_EXEC_TEST = void 0;
const vscode = require("vscode");
const testProvider_1 = require("./testProvider");
exports.COMMAND_MOVE_CURSOR_AND_EXEC_TEST = 'vscode-go-test-suite._moveCursorAndExecuteTest';
exports.COMMAND_SHOW_LAUNCH_CONFIGURATION = 'vscode-go-test-suite._showLaunchConfiguration';
function registerCommands(cmd) {
    return [
        vscode.commands.registerCommand(exports.COMMAND_MOVE_CURSOR_AND_EXEC_TEST, cmd.moveCursorAndExecuteTest.bind(cmd)),
        vscode.commands.registerCommand(exports.COMMAND_SHOW_LAUNCH_CONFIGURATION, cmd.showLaunchConfiguration.bind(cmd)),
    ];
}
exports.registerCommands = registerCommands;
class CommandsProvider {
    constructor(providers) {
        this.providers = providers;
    }
    moveCursorAndExecuteTest(test, mode) {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.uri.toString() !== test.uri?.toString() || !test.range) {
            return;
        }
        const lastSelection = editor.selection;
        editor.selection = new vscode.Selection(test.range.start, test.range.end);
        if (mode === 'debug') {
            vscode.commands.executeCommand('testing.debugAtCursor');
        }
        else {
            vscode.commands.executeCommand('testing.runAtCursor');
        }
        editor.selection = lastSelection;
    }
    _findTestData(test) {
        for (const provider of this.providers) {
            const result = provider.getTestData(test);
            if (result) {
                return [result, provider];
            }
        }
    }
    async showLaunchConfiguration(test) {
        const hit = this._findTestData(test);
        if (!hit) {
            return;
        }
        const [testData, provider] = hit;
        if (!(0, testProvider_1.hasLaunchConfiguration)(testData)) {
            return;
        }
        const launchConfiguration = await provider.getDebugLaunchConfiguration(test, testData);
        if (!launchConfiguration) {
            return;
        }
        const fullLaunchConfiguration = {
            "version": "0.2.0",
            "configurations": [
                launchConfiguration
            ],
        };
        const content = JSON.stringify(fullLaunchConfiguration, null, 4);
        const doc = await vscode.workspace.openTextDocument({ language: "jsonc", content });
        await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
    }
}
exports.CommandsProvider = CommandsProvider;
//# sourceMappingURL=command.js.map