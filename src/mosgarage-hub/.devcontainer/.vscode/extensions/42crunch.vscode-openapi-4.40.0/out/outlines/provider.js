"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutlineProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const root_1 = require("./nodes/root");
const types_1 = require("../types");
const configuration_1 = require("../configuration");
const panelsListVer3_1 = [
    "general",
    "tags",
    "paths",
    "operation id",
    "servers",
    "components",
    "webhooks",
    "security",
];
const panelsListVer3 = [
    "general",
    "tags",
    "paths",
    "operation id",
    "servers",
    "components",
    "security",
];
const panelsListVer2 = [
    "general",
    "tags",
    "paths",
    "operation id",
    "parameters",
    "responses",
    "definitions",
    "security",
    "security definitions",
];
const panelSortOrder = {
    [types_1.OpenApiVersion.V2]: panelsListVer2,
    [types_1.OpenApiVersion.V3]: panelsListVer3,
    [types_1.OpenApiVersion.V3_1]: panelsListVer3_1,
    [types_1.OpenApiVersion.Unknown]: [],
};
class OutlineProvider {
    constructor(context, cache) {
        this.context = context;
        this.cache = cache;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.search = {};
        cache.onDidActiveDocumentChange(async (document) => {
            if (document) {
                const version = this.cache.getDocumentVersion(document);
                if (version !== types_1.OpenApiVersion.Unknown) {
                    this.documentUri = document.uri.toString();
                    const root = cache.getLastGoodParsedDocument(document);
                    if (!(this.documentUri in this.search)) {
                        this.search[this.documentUri] = undefined;
                    }
                    const context = {
                        version,
                        documentUri: this.documentUri,
                        search: this.search[this.documentUri],
                    };
                    this.rootNode = new root_1.RootNode(root, context);
                }
                this.refresh();
            }
        });
        vscode.workspace.onDidCloseTextDocument((document) => {
            if (this.documentUri === document.uri.toString()) {
                this.rootNode = undefined;
                this.documentUri = undefined;
                this.search = {};
                vscode.commands.executeCommand("setContext", "openapiTwoEnabled", false);
                vscode.commands.executeCommand("setContext", "openapiThreeEnabled", false);
                vscode.commands.executeCommand("setContext", "openapiThreeZeroEnabled", false);
                vscode.commands.executeCommand("setContext", "openapiThreeOneEnabled", false);
            }
        });
        this.sort = configuration_1.configuration.get("sortOutlines");
        configuration_1.configuration.onDidChange(this.onConfigurationChanged, this);
    }
    onConfigurationChanged(e) {
        if (configuration_1.configuration.changed(e, "sortOutlines")) {
            this.sort = configuration_1.configuration.get("sortOutlines");
            this.refresh();
        }
    }
    runSearch(name) {
        if (this.rootNode && this.documentUri) {
            this.search[this.documentUri] = name;
            this.rootNode.context.search = name;
        }
    }
    getParent(element) {
        return element?.parent;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(node) {
        const item = node.item;
        if (item) {
            item.id = node.id;
            item.contextValue = node.contextValue;
            if (node.icon) {
                item.iconPath = this.getIcon(node.icon);
            }
        }
        return item;
    }
    getIcon(icon) {
        if (typeof icon === "string") {
            return {
                light: this.context.asAbsolutePath(path.join("resources", "light", icon)),
                dark: this.context.asAbsolutePath(path.join("resources", "dark", icon)),
            };
        }
    }
    getChildren(node) {
        if (node) {
            const children = node.getAndFilterChildren();
            if (children.length > 2) {
                return this.sortChildren(children);
            }
            return children;
        }
        if (this.rootNode) {
            return this.sortRootChildren(this.rootNode.getChildren());
        }
        return [];
    }
    sortChildren(children) {
        if (this.sort) {
            return children.sort((a, b) => {
                return a.getLabel().localeCompare(b.getLabel());
            });
        }
        else {
            return children.sort((a, b) => {
                return a.getOffset() - b.getOffset();
            });
        }
    }
    sortRootChildren(children) {
        return children.sort((a, b) => {
            const order = panelSortOrder[a.context.version];
            return order.indexOf(a.getLabel()) - order.indexOf(b.getLabel());
        });
    }
}
exports.OutlineProvider = OutlineProvider;
//# sourceMappingURL=provider.js.map