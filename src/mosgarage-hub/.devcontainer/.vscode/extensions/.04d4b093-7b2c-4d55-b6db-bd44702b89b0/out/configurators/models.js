"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyConfig = void 0;
const vscode = require("vscode");
exports.emptyConfig = {
    enabled: true,
    projectName: vscode.workspace.rootPath,
    autoRefreshInterval: 10000,
    showDockerCompose: true,
    enableTelemetry: false,
    shell: "/bin/sh",
    files: ["docker-compose.yml"]
};
//# sourceMappingURL=models.js.map