"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const EnvironmentProvider_1 = require("../providers/EnvironmentProvider");
const QuickCreateProvider_1 = require("../providers/QuickCreateProvider");
const RepositoryProvider_1 = require("../providers/RepositoryProvider");
const RecommendedProvider_1 = require("../providers/RecommendedProvider");
class FenixViewContainer {
    constructor(context) {
        this.quickCreateProvider = new QuickCreateProvider_1.default(context.extensionPath);
        this.repositoryProvider = new RepositoryProvider_1.default(context.extensionPath);
        this.environmentProvider = new EnvironmentProvider_1.default(context.extensionPath);
        this.recommendedProvider = new RecommendedProvider_1.default(context.extensionPath);
        this.quickCreateView = vscode.window.createTreeView('fenixQuickCreate', {
            treeDataProvider: this.quickCreateProvider,
        });
        this.repositoryView = vscode.window.createTreeView('fenixRepositories', {
            treeDataProvider: this.repositoryProvider,
        });
        this.environmentView = vscode.window.createTreeView('fenixEnvironment', {
            treeDataProvider: this.environmentProvider,
        });
        this.recommendedView = vscode.window.createTreeView('fenixRecommended', {
            treeDataProvider: this.recommendedProvider,
        });
    }
}
exports.default = FenixViewContainer;
//# sourceMappingURL=FenixViewContainer.js.map