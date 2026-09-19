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
const fs = require("fs");
const node_fetch_1 = require("node-fetch");
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const FenixConfig_1 = require("./FenixConfig");
const FenixParser_1 = require("./FenixParser");
class RepoHandler {
    constructor() {
        this._repositories = [];
    }
    get _templateList() {
        const templateList = [];
        this._repositories.forEach(r => {
            templateList.push(...r.templates);
        });
        return templateList;
    }
    getTemplates(forceRefresh) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._templateList.length === 0 || forceRefresh) {
                yield this.refreshTemplates();
            }
            return this._templateList;
        });
    }
    refreshTemplates() {
        return __awaiter(this, void 0, void 0, function* () {
            const repositories = [];
            const savedRepos = FenixConfig_1.default.get().getRepos();
            if (savedRepos.length === 0) {
                savedRepos.push(FenixConfig_1.default.get()._defaultRepo);
            }
            this._repositories = [];
            yield Promise.all(savedRepos.map((repo) => __awaiter(this, void 0, void 0, function* () {
                try {
                    let remote = yield node_fetch_1.default(repo);
                    let json = yield remote.json();
                    // Copy extra properties from repo data to template data
                    json.templates.forEach((t) => {
                        t.author = json.author;
                        t.repoName = json.repoName;
                        t.repoUrl = json.repoUrl;
                        t.hasForm = t.environment ? 'true' : 'false';
                        t.parent = json.repoUrl;
                    });
                    repositories.push(json);
                }
                catch (e) {
                    let res = yield vscode.window.showErrorMessage(`[Fenix] Could not fetch repo: '${repo}' Do you want to keep it?`, {}, ...[
                        { title: 'Keep' },
                        { title: 'Remove' },
                    ]);
                    if (res && res.title === 'Remove') {
                        FenixConfig_1.default.get().removeRepo(repo);
                    }
                }
            })));
            this._repositories = repositories;
        });
    }
    runTemplate(templateID, rootPath) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const template = this._templateList.find(t => t.id === templateID);
            if (!template) {
                return;
            }
            // Generate directories
            (_a = template.directories) === null || _a === void 0 ? void 0 : _a.forEach((dir) => {
                const target = path.join(rootPath, dir);
                if (!fs.existsSync(target)) {
                    fs.mkdirSync(target);
                }
            });
            // Download files
            if (template.files && template.files.download) {
                yield Promise.all(template.files.download.map((file) => __awaiter(this, void 0, void 0, function* () {
                    let remote = yield node_fetch_1.default(template.repoUrl + file.from);
                    let data = yield remote.text();
                    data = FenixParser_1.default.get().renderRaw(data, template.environment);
                    fs.writeFileSync(path.join(rootPath, file.to), data);
                })));
            }
            // Generate blank files
            (_b = template.files.create) === null || _b === void 0 ? void 0 : _b.forEach((fileName) => {
                fs.writeFileSync(path.join(rootPath, fileName), '');
            });
            // Open files
            (_c = template.files.open) === null || _c === void 0 ? void 0 : _c.forEach((fileName) => __awaiter(this, void 0, void 0, function* () {
                let doc = yield vscode.workspace.openTextDocument(path.join(rootPath, fileName));
                vscode.window.showTextDocument(doc, { preview: false, viewColumn: vscode.ViewColumn.Active, preserveFocus: false });
            }));
            // Execute terminal commands
            if (template.command) {
                let commandToRun = '';
                if (typeof template.command === 'string') {
                    commandToRun = template.command;
                }
                else {
                    const currOS = os.type();
                    switch (currOS) {
                        case 'Windows_NT':
                            commandToRun = template.command.windows;
                            break;
                        case 'Linux':
                            commandToRun = template.command.Linux;
                            break;
                        case 'darwin':
                            commandToRun = template.command.macos;
                            break;
                        default:
                            return template.command[currOS]
                                ? commandToRun = template.command[currOS]
                                : vscode.window.showErrorMessage(`Command not set for OS: ${currOS}`);
                    }
                }
                const runCommand = yield FenixConfig_1.default.get().canExecuteCommands(commandToRun);
                if (!runCommand) {
                    return;
                }
                const term = vscode.window.createTerminal('Fenix');
                term.sendText(commandToRun);
                term.show();
            }
        });
    }
}
exports.default = RepoHandler;
//# sourceMappingURL=RepoHandler.js.map