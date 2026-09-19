"use strict";
/* IMPORT */
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const vscode = require("vscode");
const config_1 = require("./config");
const utils_1 = require("./utils");
/* URL */
const URL = {
    async get(file = false, permalink = false, page) {
        const repopath = await utils_1.default.repo.getPath();
        if (!repopath) {
            return vscode.window.showErrorMessage('You have to open a git project before being able to open it in GitHub');
        }
        const git = utils_1.default.repo.getGit(repopath), repourl = await utils_1.default.repo.getUrl(git);
        if (!repourl) {
            return vscode.window.showErrorMessage('Remote repository not found');
        }
        const config = config_1.default.get();
        let filePath = '', branch = '', lines = '', hash = '';
        if (file) {
            const { activeTextEditor } = vscode.window;
            if (!activeTextEditor) {
                return vscode.window.showErrorMessage('You have to open a file before being able to open it in GitHub');
            }
            const editorPath = activeTextEditor.document.uri.fsPath;
            filePath = editorPath ? editorPath.substring(repopath.length + 1).replace(/\\/g, '/') : undefined;
            if (filePath) {
                branch = await utils_1.default.repo.getBranch(git);
                if (config.useLocalRange) {
                    const selections = activeTextEditor.selections;
                    if (selections.length === 1) {
                        const selection = selections[0];
                        if (!selection.isEmpty) {
                            if (selection.start.line === selection.end.line) {
                                lines = `#L${selection.start.line + 1}`;
                            }
                            else {
                                lines = `#L${selection.start.line + 1}-L${selection.end.line + 1}`;
                            }
                        }
                        else if (config.useLocalLine) {
                            lines = `#L${selection.start.line + 1}`;
                        }
                    }
                }
                if (permalink) {
                    branch = '';
                    hash = await utils_1.default.repo.getHash(git);
                }
            }
        }
        if (_.isArray(page)) {
            page = utils_1.default.repo.isGithub(repourl) ? page[0] : page[1];
        }
        // if (_.isFunction(page)) {
        //   page = page();
        // }
        branch = encodeURIComponent(branch);
        filePath = encodeURIComponent(filePath).replace(/%2F/g, '/');
        const url = _.compact([repourl, page, branch, hash, filePath, lines]).join('/');
        return url;
    },
    async copy(file = false, permalink = false, page) {
        const url = await URL.get(file, permalink, page);
        await vscode.env.clipboard.writeText(url);
        vscode.window.showInformationMessage('Permalink copied to clipboard!');
    },
    async open(file = false, permalink = false, page) {
        const url = await URL.get(file, permalink, page);
        vscode.env.openExternal(vscode.Uri.parse(url));
    }
};
/* EXPORT */
exports.default = URL;
//# sourceMappingURL=url.js.map