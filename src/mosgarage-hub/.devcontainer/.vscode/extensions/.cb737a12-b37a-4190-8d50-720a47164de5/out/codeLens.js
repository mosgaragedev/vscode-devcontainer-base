"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecuteTestCodeLensProvider = void 0;
const vscode = require("vscode");
const command_1 = require("./command");
const testProvider_1 = require("./testProvider");
class ExecuteTestCodeLensProvider {
    constructor(providers) {
        this.providers = providers;
        this._disposables = [];
        this._onDidChangeCodeLensesEmitter = new vscode.EventEmitter();
        this.onDidChangeCodeLenses = this._onDidChangeCodeLensesEmitter.event;
        this._disposables.push(...this.providers.map(x => x.onUpdate(() => {
            this._onDidChangeCodeLensesEmitter.fire(undefined);
        })));
    }
    dispose() {
        this._disposables.forEach(x => x.dispose());
    }
    provideCodeLenses(document, token) {
        if (document.isDirty) {
            return [];
        }
        const uriString = document.uri.toString();
        const result = [];
        for (const provider of this.providers) {
            const tests = provider.getTests().filter(x => x.uri && x.uri.toString() === uriString && x.range);
            if (!tests.length) {
                continue;
            }
            for (const item of tests) {
                result.push(new vscode.CodeLens(item.range, {
                    title: "Run",
                    command: command_1.COMMAND_MOVE_CURSOR_AND_EXEC_TEST,
                    arguments: [item, 'run'],
                }), new vscode.CodeLens(item.range, {
                    title: "Debug",
                    command: command_1.COMMAND_MOVE_CURSOR_AND_EXEC_TEST,
                    arguments: [item, 'debug'],
                }));
                const testData = provider.getTestData(item);
                if (testData && (0, testProvider_1.hasLaunchConfiguration)(testData)) {
                    result.push(new vscode.CodeLens(item.range, {
                        title: "Launch Configuration",
                        command: command_1.COMMAND_SHOW_LAUNCH_CONFIGURATION,
                        arguments: [item],
                    }));
                }
            }
        }
        return result;
    }
}
exports.ExecuteTestCodeLensProvider = ExecuteTestCodeLensProvider;
//# sourceMappingURL=codeLens.js.map