"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandExecutor = void 0;
const child_process_1 = require("child_process");
const vscode = require("vscode");
class CommandExecutor {
    constructor(cwd = null, env = process.env) {
        this.terminals = {};
        this._cwd = cwd;
        this._env = env;
        if ('onDidCloseTerminal' in vscode.window) {
            vscode.window.onDidCloseTerminal((terminal) => {
                this.onDidCloseTerminal(terminal);
            });
        }
    }
    getBaseCommand() {
        return '';
    }
    runInTerminal(subCommand, addNewLine = true, terminal = "Docker Compose") {
        const baseCommand = this.getBaseCommand();
        const command = `${baseCommand} ${subCommand}`;
        if (this.terminals[terminal] === undefined) {
            this.terminals[terminal] = vscode.window.createTerminal(terminal);
            this.terminals[terminal].sendText(command, addNewLine);
        }
        this.terminals[terminal].show();
    }
    exec(command) {
        return (0, child_process_1.exec)(command, { env: this._env, cwd: this._cwd, encoding: "utf8" });
    }
    execSync(command) {
        return (0, child_process_1.execSync)(command, { env: this._env, cwd: this._cwd, encoding: "utf8" });
    }
    onDidCloseTerminal(closedTerminal) {
        delete this.terminals[closedTerminal.name];
    }
    execute(subCommand) {
        const baseCommand = this.getBaseCommand();
        const command = `${baseCommand} ${subCommand}`;
        return this.exec(command);
    }
    executeSync(subCommand) {
        const baseCommand = this.getBaseCommand();
        const command = `${baseCommand} ${subCommand}`;
        return this.execSync(command);
    }
}
exports.CommandExecutor = CommandExecutor;
//# sourceMappingURL=commandExecutor.js.map