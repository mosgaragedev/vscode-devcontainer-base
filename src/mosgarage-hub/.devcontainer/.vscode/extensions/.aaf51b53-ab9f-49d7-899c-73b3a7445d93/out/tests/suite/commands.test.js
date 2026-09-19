"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const vscode_1 = require("vscode");
const commands_1 = require("../../features/commands");
describe("run commands", async () => {
    const workspaceUri = vscode_1.workspace.workspaceFolders[0].uri;
    const workspacePath = workspaceUri.path;
    const gitignorePath = (0, path_1.join)(workspacePath, ".gitignore");
    async function cleanWorkspace() {
        const paths = await (0, promises_1.readdir)(workspacePath);
        for (const path of paths) {
            if (path !== "test.code-workspace") {
                await (0, promises_1.unlink)((0, path_1.join)(workspacePath, path));
            }
        }
    }
    beforeEach("Clean workspace", async () => {
        await cleanWorkspace();
    });
    it("should create .gitignore", async () => {
        await (0, commands_1.createGitignoreFile)(workspaceUri);
        assert.ok((0, fs_1.existsSync)(gitignorePath));
        return Promise.resolve();
    });
    it("should add file to .gitignore", async () => {
        await (0, commands_1.addFileToGitignore)(vscode_1.Uri.file((0, path_1.resolve)(workspacePath, "file.c")));
        try {
            const data = await (0, promises_1.readFile)(gitignorePath);
            assert.strictEqual(data.toString(), "\nfile.c");
            return Promise.resolve();
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
    after("Clean workspace", async () => {
        await cleanWorkspace();
    });
});
//# sourceMappingURL=commands.test.js.map