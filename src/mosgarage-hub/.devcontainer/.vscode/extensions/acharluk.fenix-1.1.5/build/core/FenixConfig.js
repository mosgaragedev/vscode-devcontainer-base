"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const Fenix_1 = require("./Fenix");
class FenixConfig {
    constructor() {
        this._configRoot = 'fenix';
        this._defaultRepo = 'https://raw.githubusercontent.com/FenixTemplates/Default/master/fenix.json';
        let currentRepos = vscode.workspace.getConfiguration(this._configRoot).get('repos');
        // Create config in settings.json if it's empty
        if (currentRepos && currentRepos.length === 0) {
            this.resetRepos();
        }
    }
    static init() {
        if (!this.__instance) {
            this.__instance = new FenixConfig();
        }
    }
    static get() {
        return this.__instance;
    }
    getRepos() {
        return vscode.workspace.getConfiguration(this._configRoot).get('repos') || [this._defaultRepo];
    }
    addRepo(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentRepos = this.getRepos();
            if (!currentRepos.includes(url)) {
                currentRepos.push(url);
                yield vscode.workspace.getConfiguration(this._configRoot)
                    .update('repos', currentRepos, vscode.ConfigurationTarget.Global);
            }
            else {
                vscode.window.showErrorMessage('Repo already added');
            }
            Fenix_1.default.get().getViewContainer().repositoryProvider.refresh();
        });
    }
    removeRepo(repoUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${repoUrl}fenix.json`;
            const current = vscode.workspace.getConfiguration(this._configRoot).get('repos');
            if (!current) {
                return;
            }
            current.splice(current.indexOf(url), 1);
            yield vscode.workspace.getConfiguration(this._configRoot)
                .update('repos', current, vscode.ConfigurationTarget.Global);
            (yield Fenix_1.default.get().getRepoHandler().getTemplates())
                .filter(t => t.repoUrl === repoUrl)
                .forEach(t => this.deletePinned(t.id));
            Fenix_1.default.get().getViewContainer().repositoryProvider.refresh();
            Fenix_1.default.get().getViewContainer().quickCreateProvider.refresh();
        });
    }
    resetRepos() {
        vscode.workspace.getConfiguration(this._configRoot)
            .update('repos', [this._defaultRepo], vscode.ConfigurationTarget.Global);
        vscode.workspace.getConfiguration(this._configRoot)
            .update('runCommands', 'ask', vscode.ConfigurationTarget.Global);
    }
    getEnv() {
        return vscode.workspace.getConfiguration(this._configRoot).get('env');
    }
    addEnvVar(id, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (vscode.workspace.getConfiguration(this._configRoot + '.env').has(id)) {
                yield this.editVar(id, value);
            }
            else {
                yield vscode.workspace.getConfiguration(this._configRoot)
                    .update('env', Object.assign(Object.assign({}, vscode.workspace.getConfiguration(this._configRoot + '.env')), { [id]: value }), vscode.ConfigurationTarget.Global);
            }
            Fenix_1.default.get().getViewContainer().environmentProvider.refresh();
        });
    }
    editVar(id, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const current = vscode.workspace.getConfiguration(this._configRoot).get('env');
            current[id] = value;
            yield vscode.workspace.getConfiguration(this._configRoot)
                .update('env', current, vscode.ConfigurationTarget.Global);
            Fenix_1.default.get().getViewContainer().environmentProvider.refresh();
        });
    }
    deleteVar(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const current = vscode.workspace.getConfiguration(this._configRoot).get('env');
            current[id] = undefined;
            yield vscode.workspace.getConfiguration(this._configRoot)
                .update('env', current, vscode.ConfigurationTarget.Global);
            Fenix_1.default.get().getViewContainer().environmentProvider.refresh();
        });
    }
    getPinned() {
        return __awaiter(this, void 0, void 0, function* () {
            const templateIDs = (yield vscode.workspace.getConfiguration(this._configRoot).get('pinned')) || [];
            const templates = yield Fenix_1.default.get().getRepoHandler().getTemplates();
            const pinnedTemplates = templates.filter(t => templateIDs.includes(t.id));
            return pinnedTemplates;
        });
    }
    togglePinned(templateID) {
        return __awaiter(this, void 0, void 0, function* () {
            const pinned = vscode.workspace.getConfiguration(this._configRoot).get('pinned');
            if (!pinned) {
                return;
            }
            if (pinned.indexOf(templateID) > -1) {
                const current = vscode.workspace.getConfiguration(this._configRoot).get('pinned');
                current.splice(current.indexOf(templateID), 1);
                yield vscode.workspace.getConfiguration(this._configRoot)
                    .update('pinned', current, vscode.ConfigurationTarget.Global);
            }
            else {
                const current = vscode.workspace.getConfiguration(this._configRoot).get('pinned');
                current.push(templateID);
                yield vscode.workspace.getConfiguration(this._configRoot)
                    .update('pinned', current, vscode.ConfigurationTarget.Global);
            }
            Fenix_1.default.get().getViewContainer().quickCreateProvider.refresh();
        });
    }
    deletePinned(templateID) {
        return __awaiter(this, void 0, void 0, function* () {
            const pinned = vscode.workspace.getConfiguration(this._configRoot).get('pinned');
            if (!pinned) {
                return;
            }
            if (pinned.indexOf(templateID) > -1) {
                const current = vscode.workspace.getConfiguration(this._configRoot).get('pinned');
                current.splice(current.indexOf(templateID), 1);
                yield vscode.workspace.getConfiguration(this._configRoot)
                    .update('pinned', current, vscode.ConfigurationTarget.Global);
            }
            Fenix_1.default.get().getViewContainer().quickCreateProvider.refresh();
        });
    }
    canExecuteCommands(command) {
        return __awaiter(this, void 0, void 0, function* () {
            let runCommands = vscode.workspace.getConfiguration(this._configRoot).get('runCommands', 'ask');
            if (runCommands === 'ask') {
                let opts = [
                    { title: 'Yes' },
                    { title: 'No' },
                    { title: 'Always' },
                    { title: 'Never' },
                ];
                let res = yield vscode.window.showWarningMessage(`Allow Fenix to run template commands? (${command})`, {}, ...opts);
                if (!res || res.title === 'No') {
                    return false;
                }
                if (res.title === 'Always') {
                    vscode.workspace.getConfiguration(this._configRoot)
                        .update('runCommands', true, vscode.ConfigurationTarget.Global);
                }
                else if (res.title === 'Never') {
                    vscode.workspace.getConfiguration(this._configRoot)
                        .update('runCommands', false, vscode.ConfigurationTarget.Global);
                }
                return res.title === 'Yes' || res.title === 'Always';
            }
            else {
                return runCommands;
            }
        });
    }
}
exports.default = FenixConfig;
//# sourceMappingURL=FenixConfig.js.map