"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const test_electron_1 = require("@vscode/test-electron");
async function main() {
    try {
        const extensionDevelopmentPath = (0, path_1.resolve)(__dirname, "../../");
        const extensionTestsPath = (0, path_1.resolve)(__dirname, "./suite/index");
        const workspacePath = (0, path_1.resolve)(extensionDevelopmentPath, "./src/tests/suite/workspace/test.code-workspace");
        await (0, test_electron_1.runTests)({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: ["--disable-extensions", workspacePath],
        });
    }
    catch (e) {
        console.error(e);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=runTests.js.map