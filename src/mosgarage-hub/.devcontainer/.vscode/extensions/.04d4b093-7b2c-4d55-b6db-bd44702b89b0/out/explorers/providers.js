"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerComposeServicesProvider = exports.DockerComposeProjectsProvider = exports.AutoRefreshTreeDataProvider = void 0;
const vscode = require("vscode");
const vscode_1 = require("vscode");
const views_1 = require("../projects/views");
class AutoRefreshTreeDataProvider {
    constructor(context) {
        this.context = context;
        this._onDidChangeAutoRefresh = new vscode_1.EventEmitter();
        this._onDidChangeTreeData = new vscode_1.EventEmitter();
        this.autoRefreshEnabled = true;
    }
    get onDidChangeAutoRefresh() {
        return this._onDidChangeAutoRefresh.event;
    }
    get onDidChangeTreeData() {
        return this._onDidChangeTreeData.event;
    }
    setAutoRefresh(interval) {
        if (interval > 0) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setInterval(() => {
                if (this.autoRefreshEnabled)
                    this.refresh();
            }, interval);
        }
    }
    async refresh(root) {
        this._onDidChangeTreeData.fire(root);
    }
    disableAutoRefresh() {
        this.autoRefreshEnabled = false;
    }
    enableAutoRefresh() {
        this.autoRefreshEnabled = true;
    }
}
exports.AutoRefreshTreeDataProvider = AutoRefreshTreeDataProvider;
class DockerComposeProjectsProvider {
    constructor(context, workspace) {
        this.context = context;
        this.workspace = workspace;
        this._onDidChangeTreeData = new vscode_1.EventEmitter();
        this._onDidChangeSelect = new vscode_1.EventEmitter();
    }
    _initRoot() {
        return new views_1.ProjectsNode(this.context, this.workspace, vscode.TreeItemCollapsibleState.None);
    }
    get onDidChangeTreeData() {
        return this._onDidChangeTreeData.event;
    }
    async refresh(root) {
        this._onDidChangeTreeData.fire(root);
    }
    getRefreshCallable(node) {
        return this.refresh.bind(node);
    }
    getRoot() {
        if (this._root === undefined)
            this._root = this._initRoot();
        return this._root;
    }
    async getChildren(node) {
        if (this._loading !== undefined) {
            await this._loading;
            this._loading = undefined;
        }
        if (node === undefined)
            node = this.getRoot();
        try {
            return await node.getChildren();
        }
        catch (err) {
            return node.handleError(err);
        }
    }
    async getTreeItem(node) {
        return node.getTreeItem();
    }
    get onDidChangeSelect() {
        return this._onDidChangeSelect.event;
    }
    async startProject(node) {
        return node.project.start();
    }
    async stopProject(node) {
        return node.project.stop();
    }
    async upProject(node) {
        const child_process = node.project.up();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async downProject(node) {
        const child_process = node.project.down();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
}
exports.DockerComposeProjectsProvider = DockerComposeProjectsProvider;
class DockerComposeServicesProvider extends AutoRefreshTreeDataProvider {
    constructor(context, workspace) {
        super(context);
        this.workspace = workspace;
    }
    _initRoot() {
        return new views_1.ProjectsNode(this.context, this.workspace);
    }
    getRefreshCallable(node) {
        return this.refresh.bind(node);
    }
    getRoot() {
        if (this._root === undefined)
            this._root = this._initRoot();
        return this._root;
    }
    async setRoot(node) {
        this._root = new views_1.ProjectNode(node.context, node.project, vscode.TreeItemCollapsibleState.Expanded);
    }
    async getChildren(node) {
        if (this._loading !== undefined) {
            await this._loading;
            this._loading = undefined;
        }
        if (node === undefined)
            node = this.getRoot();
        try {
            return await node.getChildren();
        }
        catch (err) {
            return node.handleError(err);
        }
    }
    async getTreeItem(node) {
        return node.getTreeItem();
    }
    async selectProject(node) {
        await this.setRoot(node);
        await this.refresh();
    }
    async startProject(node) {
        return node.project.start();
    }
    async stopProject(node) {
        return node.project.stop();
    }
    async upProject(node) {
        const child_process = node.project.up();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async downProject(node) {
        const child_process = node.project.down();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async shellService(node) {
        node.service.shell();
    }
    async upService(node) {
        const child_process = node.service.up();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async downService(node) {
        const child_process = node.service.down();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async buildService(node) {
        const child_process = node.service.build();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async startService(node) {
        const child_process = node.service.start();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async stopService(node) {
        const child_process = node.service.stop();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async restartService(node) {
        const child_process = node.service.restart();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async killService(node) {
        const child_process = node.service.kill();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async attachContainer(node) {
        node.container.attach();
    }
    async logsContainer(node) {
        const setting = vscode_1.Uri.parse("untitled:" + node.container.name + ".logs");
        const content = node.container.logs();
        vscode.workspace.openTextDocument(setting).then((doc) => {
            vscode_1.window.showTextDocument(doc, 1, false).then(editor => {
                editor.edit(edit => {
                    edit.insert(new vscode_1.Position(0, 0), content);
                });
            });
        });
    }
    async startContainer(node) {
        const child_process = node.container.start();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async stopContainer(node) {
        const child_process = node.container.stop();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
    async killContainer(node) {
        const child_process = node.container.kill();
        child_process.on('close', this.getRefreshCallable(node));
        return child_process;
    }
}
exports.DockerComposeServicesProvider = DockerComposeServicesProvider;
//# sourceMappingURL=providers.js.map