"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Container = void 0;
const enums_1 = require("../containers/enums");
class Container {
    constructor(executor, name, command, status, ports) {
        this.executor = executor;
        this.name = name;
        this.command = command;
        this.status = status;
        this.ports = ports;
    }
    get state() {
        return this.status.startsWith('Up') ? enums_1.ContainerState.Up : enums_1.ContainerState.Exit;
    }
    get healthy() {
        return this.status.includes('(healthy)') ? true : this.status.includes('(unhealthy)') ? false : null;
    }
    attach() {
        this.executor.attach(this.name);
    }
    logs() {
        return this.executor.logs(this.name);
    }
    start() {
        return this.executor.start(this.name);
    }
    stop() {
        return this.executor.stop(this.name);
    }
    kill() {
        return this.executor.kill(this.name);
    }
}
exports.Container = Container;
//# sourceMappingURL=models.js.map