"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openFolder = void 0;
const vscode_1 = require("vscode");
function openFolder() {
    const options = {
        canSelectMany: false,
        openLabel: 'Open',
        canSelectFolders: true,
    };
    return new Promise((resolve) => {
        vscode_1.window.showOpenDialog(options).then(fileUri => {
            if (fileUri && fileUri[0]) {
                resolve(fileUri[0].fsPath);
            }
            else {
                resolve(undefined);
            }
        });
    });
}
exports.openFolder = openFolder;
//# sourceMappingURL=openFolder.js.map