"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerComposeExecutor = void 0;
const commandExecutor_1 = require("./commandExecutor");
const exceptions_1 = require("./exceptions");
class DockerComposeExecutor extends commandExecutor_1.CommandExecutor {
    constructor(name = null, files = [], shell = "/bin/sh", cwd = null) {
        if (name !== null)
            process.env.COMPOSE_PROJECT_NAME = name;
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
        let composeCommand = `--version`;
        return this.executeSync(composeCommand);
    }
    getConnfigServices() {
        let configServicesCommand = `config --services`;
        return this.executeSync(configServicesCommand);
    }
    getPs() {
        let composeCommand = `ps`;
        return this.executeSync(composeCommand);
    }
    shell(serviceName) {
        let shellCommand = this.getShellCommand();
        let composeCommand = `exec ${serviceName} ${shellCommand}`;
        let terminalName = `${serviceName} shell`;
        this.runInTerminal(composeCommand, true, terminalName);
    }
    up(serviceName) {
        let composeCommand = serviceName === undefined ? `up --no-recreate` : `up --no-recreate ${serviceName}`;
        return this.execute(composeCommand);
    }
    down(serviceName) {
        let composeCommand = serviceName === undefined ? `down` : `down ${serviceName}`;
        return this.execute(composeCommand);
    }
    start(serviceName) {
        let composeCommand = serviceName === undefined ? `start` : `start ${serviceName}`;
        return this.execute(composeCommand);
    }
    stop(serviceName) {
        let composeCommand = serviceName === undefined ? `stop` : `stop ${serviceName}`;
        return this.execute(composeCommand);
    }
    restart(serviceName) {
        let composeCommand = `restart ${serviceName}`;
        return this.execute(composeCommand);
    }
    build(serviceName) {
        let composeCommand = `build --no-cache ${serviceName}`;
        return this.execute(composeCommand);
    }
    kill(serviceName) {
        let composeCommand = `kill ${serviceName}`;
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
                throw new exceptions_1.ComposeExecutorError(err.message, err.output);
        }
    }
}
exports.DockerComposeExecutor = DockerComposeExecutor;
//# sourceMappingURL=dockerComposeExecutor.js.map