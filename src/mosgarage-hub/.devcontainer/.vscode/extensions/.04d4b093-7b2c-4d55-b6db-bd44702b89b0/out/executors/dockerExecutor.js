"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerExecutor = void 0;
const commandExecutor_1 = require("./commandExecutor");
const exceptions_1 = require("./exceptions");
class DockerExecutor extends commandExecutor_1.CommandExecutor {
    constructor(shell = "/bin/sh", cwd = null) {
        super(cwd);
        this._shell = shell;
    }
    getBaseCommand() {
        return 'docker';
    }
    getShellCommand() {
        return this._shell;
    }
    getVersion() {
        const dockerCommand = `version`;
        return this.executeSync(dockerCommand);
    }
    getPs(options) {
        let dockerCommand = `ps -a --format '{{.Label "com.docker.compose.service"}}'`;
        if (options !== undefined) {
            if (options.projectName !== undefined)
                dockerCommand += ` --filter label=com.docker.compose.project=${options.projectName}`;
            if (options.projectDir !== undefined)
                dockerCommand += ` --filter label=com.docker.compose.project.working_dir=${options.projectDir}`;
            if (options.containerName !== undefined)
                dockerCommand += ` --filter name=${options.containerName}`;
        }
        return this.executeSync(dockerCommand);
    }
    attach(name) {
        const dockerCommand = `attach ${name}`;
        this.runInTerminal(dockerCommand, true, name);
    }
    logs(name) {
        const dockerCommand = `logs ${name}`;
        return this.executeSync(dockerCommand);
    }
    start(name) {
        const dockerCommand = `start ${name}`;
        return this.execute(dockerCommand);
    }
    stop(name) {
        const dockerCommand = `stop ${name}`;
        return this.execute(dockerCommand);
    }
    kill(name) {
        const dockerCommand = `kill ${name}`;
        return this.execute(dockerCommand);
    }
    executeSync(dockerCommand) {
        try {
            return super.executeSync(dockerCommand);
        }
        catch (err) {
            // 1 - Catchall for general errors
            if (err.status === 1)
                throw new exceptions_1.DockerExecutorError(err.message, err.output);
            else
                throw new exceptions_1.DockerUnhandledError(err.message, err.output);
        }
    }
}
exports.DockerExecutor = DockerExecutor;
//# sourceMappingURL=dockerExecutor.js.map