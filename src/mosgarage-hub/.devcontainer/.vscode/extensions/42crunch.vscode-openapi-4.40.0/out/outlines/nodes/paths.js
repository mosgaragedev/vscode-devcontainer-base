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
exports.OperationNode = exports.PathNode = exports.WebhooksNode = exports.PathsNode = void 0;
const vscode = __importStar(require("vscode"));
const base_1 = require("./base");
const simple_1 = require("./simple");
class PathsNode extends base_1.AbstractOutlineNode {
    constructor(parent, node) {
        super(parent, "/paths", "Paths", vscode.TreeItemCollapsibleState.Expanded, node, parent.context);
        this.icon = "swap-arrows.svg";
        this.contextValue = "paths";
        this.searchable = false;
    }
    getChildren() {
        return this.getChildrenByKey((key, pointer, node) => new PathNode(this, "path", pointer, key, node));
    }
}
exports.PathsNode = PathsNode;
class WebhooksNode extends base_1.AbstractOutlineNode {
    constructor(parent, node) {
        super(parent, "/webhooks", "Webhooks", vscode.TreeItemCollapsibleState.Expanded, node, parent.context);
        this.icon = "webhook.svg";
        this.contextValue = "webhooks";
        this.searchable = false;
    }
    getChildren() {
        return this.getChildrenByKey((key, pointer, node) => new PathNode(this, "webhook", pointer, key, node));
    }
}
exports.WebhooksNode = WebhooksNode;
class PathNode extends base_1.AbstractOutlineNode {
    constructor(parent, contextValue, pointer, key, node) {
        super(parent, pointer, key, vscode.TreeItemCollapsibleState.Collapsed, node, parent.context);
        this.contextValue = contextValue;
        this.path = key;
    }
    getChildren() {
        return this.getChildrenByKey((key, pointer, node) => {
            if (base_1.HTTP_METHODS.includes(key)) {
                return new OperationNode(this, pointer, key, node);
            }
            else if (key === "$ref") {
                return new simple_1.SimpleNode(this, pointer, key, node, 0);
            }
        });
    }
}
exports.PathNode = PathNode;
class OperationNode extends base_1.AbstractOutlineNode {
    constructor(parent, pointer, key, node) {
        super(parent, pointer, key, vscode.TreeItemCollapsibleState.Collapsed, node, parent.context);
        this.contextValue = "operation";
        this.method = key;
    }
    getChildren() {
        return this.getChildrenByKey((key, pointer, node) => {
            if (["responses", "parameters", "requestBody", "security"].includes(key)) {
                if (key === "parameters") {
                    return new simple_1.SimpleNode(this, pointer, key, node, 1, simple_1.getParameterLabel);
                }
                else if (key === "security") {
                    return new simple_1.SimpleNode(this, pointer, key, node, 0);
                }
                else {
                    return new simple_1.SimpleNode(this, pointer, key, node, 1);
                }
            }
        });
    }
}
exports.OperationNode = OperationNode;
//# sourceMappingURL=paths.js.map