"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComposeExecutor = void 0;
const commandExecutor_1 = require("./commandExecutor");
const exceptions_1 = require("./exceptions");
class ComposeExecutor extends commandExecutor_1.CommandExecutor {
    constructor(files = [], shell = "/bin/sh", cwd = null) {
        super(cwd, process.env);
        this._files = files;
        this._shell = shell;
    }
    getBaseCommand() {
        return this._files.reduce((myString, files) => myString + ' -f ' + files, 'docker compose');
    }
    getShellCommand() {
        return this._shell;
    }
    getVersion() {
        const composeCommand = `version`;
        return this.executeSync(composeCommand);
    }
    getConnfigServices() {
        const configServicesCommand = `config --services`;
        return this.executeSync(configServicesCommand);
    }
    getPs() {
        const composeCommand = `ps`;
        return this.executeSync(composeCommand);
    }
    getPs2(options) {
        const dockerCommand = `ps -a --format json`;
        const result = this.executeSync(dockerCommand);
        try {
            // Docker Compose up to 2.20 format
            return JSON.parse(result);
        }
        catch (e) {
            if (e instanceof SyntaxError) {
                // Docker Compose 2.21+ format
                return result.trim().split("\n").map(entry => JSON.parse(entry));
            }
            throw e;
        }
    }
    shell(serviceName) {
        const shellCommand = this.getShellCommand();
        const composeCommand = `exec ${serviceName} ${shellCommand}`;
        const terminalName = `${serviceName} shell`;
        this.runInTerminal(composeCommand, true, terminalName);
    }
    up(serviceName) {
        const composeCommand = serviceName === undefined ? `up --no-recreate` : `up --no-recreate ${serviceName}`;
        return this.execute(composeCommand);
    }
    down(serviceName) {
        const composeCommand = serviceName === undefined ? `down` : `down ${serviceName}`;
        return this.execute(composeCommand);
    }
    start(serviceName) {
        const composeCommand = serviceName === undefined ? `start` : `start ${serviceName}`;
        return this.execute(composeCommand);
    }
    stop(serviceName) {
        const composeCommand = serviceName === undefined ? `stop` : `stop ${serviceName}`;
        return this.execute(composeCommand);
    }
    restart(serviceName) {
        const composeCommand = `restart ${serviceName}`;
        return this.execute(composeCommand);
    }
    build(serviceName) {
        const composeCommand = `build --no-cache ${serviceName}`;
        return this.execute(composeCommand);
    }
    kill(serviceName) {
        const composeCommand = `kill ${serviceName}`;
        return this.execute(composeCommand);
    }
    executeSync(composeCommand) {
        try {
            return super.executeSync(composeCommand);
        }
        catch (err) {
            // 1 - Catchall for general errors
            if (err.status === 1)
                throw new exceptions_1.ComposeExecutorError(err.message, err.output);
            // 14 - docker compose configuration file not found
            else if (err.status === 14)
                throw new exceptions_1.ComposeFileNotFound(err.message, err.output);
            // 127 - docker compose command not found
            else if (err.status === 127)
                throw new exceptions_1.ComposeCommandNotFound(err.message, err.output);
            else
                throw new exceptions_1.ComposeUnhandledError(err.message, err.output);
        }
    }
}
exports.ComposeExecutor = ComposeExecutor;
//# sourceMappingURL=composeExecutor.js.map