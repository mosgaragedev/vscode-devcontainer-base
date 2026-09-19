"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopClient = exports.createClient = void 0;
const node_1 = require("vscode-languageclient/node");
const path_1 = require("path");
const clientOptions = {
    documentSelector: [
        {
            scheme: "file",
            language: "ignore",
        },
    ],
};
function getServerOptions(context) {
    let executableName = "gitignore_ultimate_server";
    if (process.platform === "win32")
        executableName += ".exe";
    return {
        command: context.asAbsolutePath((0, path_1.join)("bin", executableName)),
    };
}
function createClient(context) {
    return new node_1.LanguageClient("gitignore-ultimate-server", "GitIgnore Ultimate Server", getServerOptions(context), clientOptions);
}
exports.createClient = createClient;
function stopClient(client) {
    if (!client)
        return;
    return client.stop();
}
exports.stopClient = stopClient;
//# sourceMappingURL=client.js.map