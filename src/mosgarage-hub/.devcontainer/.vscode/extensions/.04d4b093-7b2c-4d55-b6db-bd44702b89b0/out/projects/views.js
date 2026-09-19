"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsNode = exports.ProjectNode = void 0;
const vscode_1 = require("vscode");
const enums_1 = require("../enums");
const views_1 = require("../services/views");
const views_2 = require("../compose/views");
class ProjectNode extends views_2.ComposeNode {
    constructor(context, project, collapsbleState = vscode_1.TreeItemCollapsibleState.Expanded) {
        super(context);
        this.project = project;
        this.collapsbleState = collapsbleState;
    }
    async getChildren() {
        if (this.collapsbleState === vscode_1.TreeItemCollapsibleState.None)
            return [];
        this.resetChildren();
        const services = await this.project.getServices(false);
        this.children = services
            .map(service => new views_1.ServiceNode(this.context, service));
        return this.children;
    }
    getTreeItem() {
        const item = new vscode_1.TreeItem(this.project.name, this.collapsbleState);
        item.contextValue = enums_1.ResourceType.Project;
        item.iconPath = new vscode_1.ThemeIcon("multiple-windows");
        item.tooltip = this.project.cwd;
        item.command = {
            title: 'Select Node',
            command: 'docker-compose.project.select',
            arguments: [this]
        };
        return item;
    }
}
exports.ProjectNode = ProjectNode;
class ProjectsNode extends views_2.ComposeNode {
    constructor(context, workspace, projectNodeCollapsbleState = vscode_1.TreeItemCollapsibleState.Expanded) {
        super(context);
        this.workspace = workspace;
        this.projectNodeCollapsbleState = projectNodeCollapsbleState;
    }
    async getChildren() {
        this.resetChildren();
        try {
            this.workspace.validate();
        }
        catch (err) {
            return this.handleError(err);
        }
        this.children = this.workspace.getProjects(true)
            .map(project => new ProjectNode(this.context, project, this.projectNodeCollapsbleState));
        return this.children;
    }
    getTreeItem() {
        const item = new vscode_1.TreeItem(`Projects`, vscode_1.TreeItemCollapsibleState.Expanded);
        item.contextValue = enums_1.ResourceType.Projects;
        return item;
    }
}
exports.ProjectsNode = ProjectsNode;
//# sourceMappingURL=views.js.map