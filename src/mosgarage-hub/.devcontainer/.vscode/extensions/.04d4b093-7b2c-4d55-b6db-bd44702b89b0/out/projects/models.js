'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Workspace = exports.Project = void 0;
const models_1 = require("../containers/models");
const models_2 = require("../services/models");
const dockerExecutor_1 = require("../executors/dockerExecutor");
const composeExecutor_1 = require("../executors/composeExecutor");
const v2_1 = require("docker-compose/dist/v2");
class Project {
    constructor(name, cwd = null, files = [], shell = "/bin/sh") {
        this.name = name;
        this.cwd = cwd;
        this._id = Math.random();
        this._files = files;
        this._shell = shell;
        this._services = undefined;
        this._containers = undefined;
        this.dockerExecutor = new dockerExecutor_1.DockerExecutor(this._shell, this.cwd);
        this.composeExecutor = new composeExecutor_1.ComposeExecutor(this._files, this._shell, this.cwd);
    }
    async getServices(force = false) {
        if (this._services === undefined || force) {
            await this.refreshServices();
        }
        return this._services;
    }
    async refreshServices() {
        this._services = await this._getServices();
    }
    async _getServices() {
        const servicesString = this.composeExecutor.getConnfigServices();
        const linesString = servicesString.split(/[\r\n]+/g).filter(item => item);
        return linesString.map(serviceString => {
            return new models_2.Service(this, serviceString, this.dockerExecutor, this.composeExecutor);
        });
    }
    async getContainers(force = false) {
        if (this._containers === undefined || force) {
            await this.refreshContainers();
        }
        return this._containers;
    }
    async refreshContainers() {
        this._containers = await this._getContainers();
    }
    async _getContainers2() {
        const config = ["docker-compose.yml", "docker-compose.yaml"];
        const result = await (0, v2_1.ps)({ cwd: this.cwd, log: true, config: config, commandOptions: ["--all"] });
        return result.data.services.map((service) => {
            const ports = service.ports.map((port) => port.exposed.port.toString());
            return new models_1.Container(this.dockerExecutor, service.name, service.command, service.state, ports);
        });
    }
    async _getContainers() {
        const result = this.composeExecutor.getPs2();
        return result.map((container) => {
            return new models_1.Container(this.dockerExecutor, container.Name, container.Command, container.Status, []);
        });
    }
    filterServiceContainers(serviceName, containers) {
        const pattern = this.name + '_' + serviceName + '_';
        return containers.filter((container) => {
            return container.name.includes(pattern);
        });
    }
    start() {
        return this.composeExecutor.start();
    }
    stop() {
        return this.composeExecutor.stop();
    }
    up() {
        return this.composeExecutor.up();
    }
    down() {
        return this.composeExecutor.down();
    }
}
exports.Project = Project;
class Workspace {
    constructor(workspaceFolders, projectNames, files = [], shell = "/bin/sh") {
        this.workspaceFolders = workspaceFolders;
        this.projectNames = projectNames;
        this.files = files;
        this.shell = shell;
        this._projects = undefined;
    }
    validate() {
        const dockerExecutor = new dockerExecutor_1.DockerExecutor(this.shell);
        dockerExecutor.getVersion();
        const composeExecutor = new composeExecutor_1.ComposeExecutor(this.files, this.shell);
        composeExecutor.getVersion();
    }
    getProjects(force = false) {
        if (this._projects === undefined || force)
            this.refreshProjects();
        return this._projects;
    }
    refreshProjects() {
        this._projects = this._getProjects();
    }
    _getProjects() {
        return this.workspaceFolders.map((folder) => {
            // project name from mapping or use workspace dir name
            const name = this.projectNames[folder.index] || folder.name.replace(/[^-_a-z0-9]/gi, '');
            return new Project(name, folder.uri.fsPath, this.files, this.shell);
        });
    }
}
exports.Workspace = Workspace;
//# sourceMappingURL=models.js.map