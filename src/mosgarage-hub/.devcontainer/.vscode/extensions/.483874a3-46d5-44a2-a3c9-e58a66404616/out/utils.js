"use strict";
/* IMPORT */
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const absolute = require("absolute");
// import absolute = require('absolute');
const findUp = require("find-up");
const path = require("path");
const pify = require("pify");
// import * as simpleGit from 'simple-git';
const simple_git_1 = require("simple-git");
const vscode = require("vscode");
const Commands = require("./commands");
const config_1 = require("./config");
/* UTILS */
const Utils = {
    initCommands(context) {
        const { commands } = vscode.extensions.getExtension('linduomin.open-git-remote').packageJSON.contributes;
        commands.forEach(({ command, title }) => {
            const commandName = _.last(command.split('.')), handler = Commands[commandName], disposable = vscode.commands.registerCommand(command, () => handler());
            context.subscriptions.push(disposable);
        });
        return Commands;
    },
    folder: {
        getRootPath(basePath) {
            const { workspaceFolders } = vscode.workspace;
            if (!workspaceFolders) {
                return;
            }
            const firstRootPath = workspaceFolders[0].uri.fsPath;
            // @ts-ignore
            if (!basePath || !absolute(basePath)) {
                return firstRootPath;
            }
            const rootPaths = workspaceFolders.map(folder => folder.uri.fsPath), sortedRootPaths = _.sortBy(rootPaths, [path => path.length]).reverse(); // In order to get the closest root
            return sortedRootPaths.find(rootPath => basePath.startsWith(rootPath));
        },
        async getWrapperPathOf(rootPath, cwdPath, findPath) {
            const foundPath = await findUp(findPath, { cwd: cwdPath });
            if (foundPath) {
                const wrapperPath = path.dirname(foundPath);
                return wrapperPath;
            }
        }
    },
    repo: {
        getGit(repopath) {
            return pify(_.bindAll((0, simple_git_1.default)(repopath), ['branch', 'getRemotes']));
        },
        async getHash(git) {
            return (await git.revparse(['HEAD'])).trim();
        },
        async getPath() {
            const { activeTextEditor } = vscode.window, editorPath = activeTextEditor && activeTextEditor.document.uri.fsPath, rootPath = Utils.folder.getRootPath(editorPath);
            if (!rootPath) {
                return false;
            }
            return await Utils.folder.getWrapperPathOf(rootPath, editorPath || rootPath, '.git');
        },
        async getBranch(git) {
            const config = config_1.default.get();
            if (!config.useLocalBranch) {
                return config.remote.branch;
            }
            const branches = await git.branch();
            return branches.current;
        },
        async getUrl(git) {
            const config = config_1.default.get(), remotes = await git.getRemotes(true), remotesGithub = config.github.domain ? remotes.filter(remote => (remote.refs.fetch || remote.refs.push).includes(config.github.domain)) : remotes, remoteOrigin = remotesGithub.filter(remote => remote.name === config.remote.name)[0], remote = remoteOrigin || remotesGithub[0];
            if (!remote) {
                return;
            }
            const ref = remote.refs.fetch || remote.refs.push, 
            // re = /\.[^.:/]+[:/]([^/]+)\/(.*?)(?:\.git|\/)?$/,
            re = /^[http|https|ssh]+:\/\/(?:.*?@)?(.*)\b\.git?\b$/; // 匹配 http https Gitab的（ssh）
            let match = re.exec(ref);
            if (!match) {
                // 支持github的ssh
                match = /git@github.com:(.*)\b.git?\b/.exec(ref);
            }
            if (!match) {
                return;
            }
            // 去除端口号
            const resultUrl = match[1].replace(/(:[0-9]+)(?:\/){1}/, '/');
            // return `https://${config.github.domain}/${match[1]}/${match[2]}`;
            return `https://${resultUrl}`;
        },
        isGithub(url) {
            return /github\.com/.test(url);
        }
    }
};
/* EXPORT */
exports.default = Utils;
//# sourceMappingURL=utils.js.map