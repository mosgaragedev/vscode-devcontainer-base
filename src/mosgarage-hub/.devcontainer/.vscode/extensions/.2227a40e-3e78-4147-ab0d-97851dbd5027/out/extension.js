'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const copyPaste = require("copy-paste");
const dockerExplorer_1 = require("./explorer/dockerExplorer");
const utility_1 = require("./utils/utility");
const url_1 = require("url");
const globals_1 = require("./globals");
function activate(context) {
    const dockerRegistryExplorer = new dockerExplorer_1.PrivateDockerExplorerProvider(context);
    vscode.window.registerTreeDataProvider('dockerRegistryExplorer', dockerRegistryExplorer);
    vscode.commands.registerCommand('dockerRegistryExplorer.refreshEntry', () => dockerRegistryExplorer.refresh());
    vscode.commands.registerCommand('dockerRegistryExplorer.addEntry', (node) => __awaiter(this, void 0, void 0, function* () {
        let keytar = utility_1.Utility.getCoreNodeModule('keytar');
        let regUrl = yield vscode.window.showInputBox({
            ignoreFocusOut: true,
            placeHolder: 'https://myregistry.io',
            prompt: 'Registry url',
            validateInput: (value) => {
                try {
                    let url = new url_1.URL(value);
                    let retVal = url.toString();
                    retVal = "";
                    return retVal;
                }
                catch (error) {
                    return `Please enter a valid url (A valid url begins with 'http://' or 'https://'). ${error}`;
                }
            }
        });
        if (regUrl) {
            try {
                let url = new url_1.URL(regUrl);
                let username = yield vscode.window.showInputBox({ ignoreFocusOut: true, prompt: `Username for ${url.toString()}` });
                if (username) {
                    let password = yield vscode.window.showInputBox({ ignoreFocusOut: true, prompt: `Password for ${url.toString()}`, password: true });
                    if (password) {
                        if (keytar) {
                            let nodesData = context.globalState.get(globals_1.Globals.GLOBAL_STATE_REGS_KEY, []);
                            nodesData.push(url.toString());
                            context.globalState.update(globals_1.Globals.GLOBAL_STATE_REGS_KEY, nodesData);
                            dockerRegistryExplorer.refresh();
                            keytar.setPassword(globals_1.Globals.KEYTAR_SECRETS_KEY, `${url.toString()}.${globals_1.Globals.KEYTAR_SECRETS_ACCOUNT_USER_POSTFIX_KEY}`, username);
                            keytar.setPassword(globals_1.Globals.KEYTAR_SECRETS_KEY, `${url.toString()}.${globals_1.Globals.KEYTAR_SECRETS_ACCOUNT_PASSWORD_POSTFIX_KEY}`, password);
                        }
                    }
                }
            }
            catch (error) {
                vscode.window.showErrorMessage('Error occured. Please try again. ' + error);
            }
        }
    }));
    vscode.commands.registerCommand('dockerRegistryExplorer.registryNode.refreshEntry', (node) => node.refresh());
    vscode.commands.registerCommand('dockerRegistryExplorer.registryNode.deleteEntry', (node) => __awaiter(this, void 0, void 0, function* () {
        let regName = node.key;
        const result = yield vscode.window.showWarningMessage(`Delete entry for '${regName}'?`, { title: 'Yes' }, { title: 'No', isCloseAffordance: true });
        if (result && result.title === 'Yes') {
            let nodesData = context.globalState.get(globals_1.Globals.GLOBAL_STATE_REGS_KEY, []);
            var index = nodesData.indexOf(regName);
            if (index !== -1) {
                nodesData.splice(index, 1);
                let keytar = utility_1.Utility.getCoreNodeModule('keytar');
                let isUserDeleted = yield keytar.deletePassword(globals_1.Globals.KEYTAR_SECRETS_KEY, `${regName}.${globals_1.Globals.KEYTAR_SECRETS_ACCOUNT_USER_POSTFIX_KEY}`);
                let isPassDeleted = yield keytar.deletePassword(globals_1.Globals.KEYTAR_SECRETS_KEY, `${regName}.${globals_1.Globals.KEYTAR_SECRETS_ACCOUNT_PASSWORD_POSTFIX_KEY}`);
                context.globalState.update(globals_1.Globals.GLOBAL_STATE_REGS_KEY, nodesData);
                if (isUserDeleted && isPassDeleted) {
                    vscode.window.showInformationMessage(`Registry settings for '${regName}' successfully deleted.`);
                }
                dockerRegistryExplorer.refresh();
            }
        }
    }));
    vscode.commands.registerCommand('dockerRegistryExplorer.repositoryNode.refreshEntry', (node) => node.refresh());
    vscode.commands.registerCommand('dockerRegistryExplorer.tagNode.copyName', (node) => __awaiter(this, void 0, void 0, function* () {
        let imageName = node.getImageName();
        copyPaste.copy(imageName);
        vscode.window.setStatusBarMessage(`The image name "${imageName}" is copied to clipboard.`, 3000);
    }));
    vscode.commands.registerCommand('dockerRegistryExplorer.tagNode.pullImage', (node) => __awaiter(this, void 0, void 0, function* () {
        let imageName = node.getImageName();
        const command = yield vscode.window.showInputBox({
            prompt: `Run this command to pull image?`,
            placeHolder: ``,
            value: `docker pull ${imageName}`
        });
        if (command === undefined || command === '') {
            return;
        }
        const terminal = vscode.window.createTerminal();
        terminal.show();
        terminal.sendText(command, false);
    }));
    vscode.commands.registerCommand('dockerRegistryExplorer.tagNode.removeLocalImage', (node) => __awaiter(this, void 0, void 0, function* () {
        let imageName = node.getImageName();
        const command = yield vscode.window.showInputBox({
            prompt: `Run this command to remove image?`,
            placeHolder: ``,
            value: `docker rmi ${imageName}`
        });
        if (command === undefined || command === '') {
            return;
        }
        const terminal = vscode.window.createTerminal();
        terminal.show();
        terminal.sendText(command, false);
    }));
    vscode.commands.registerCommand('dockerRegistryExplorer.tagNode.removeRemoteImage', (node) => __awaiter(this, void 0, void 0, function* () {
        const result = yield vscode.window.showWarningMessage(`Delete '${node.getImageName()}' from your docker repository?`, { title: 'Yes' }, { title: 'No', isCloseAffordance: true });
        if (result && result.title === 'Yes') {
            let res = yield node.deleteFromRepository();
            if (res) {
                if (node.parent) {
                    let repoNode = node.parent;
                    if (repoNode.chldrenCount !== 1) {
                        repoNode.refresh();
                    }
                    else if (repoNode.parent) {
                        repoNode.parent.refresh();
                    }
                }
            }
        }
    }));
    vscode.commands.registerCommand('dockerRegistryExplorer.layerNode.copyDigest', (node) => {
        let hash = node.layerItem.digest;
        copyPaste.copy(hash);
        vscode.window.setStatusBarMessage(`The digest value "${hash}" is copied to clipboard.`, 3000);
    });
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map