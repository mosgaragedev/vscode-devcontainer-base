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
exports.SearchNode = exports.RootNode = void 0;
const vscode = __importStar(require("vscode"));
const base_1 = require("./base");
const general_1 = require("./general");
const types_1 = require("../../types");
const paths_1 = require("./paths");
const operation_ids_1 = require("./operation-ids");
const servers_1 = require("./servers");
const components_1 = require("./components");
const security_1 = require("./security");
const panel_1 = require("./panel");
const tags_1 = require("./tags");
class RootNode extends base_1.AbstractOutlineNode {
    constructor(root, context) {
        super(undefined, "/", "", vscode.TreeItemCollapsibleState.Expanded, root, context);
        this.searchable = false;
    }
    getChildren() {
        const res = [];
        if (this.node) {
            if (this.context.search) {
                res.push(new SearchNode(this, this.context));
            }
            res.push(new general_1.GeneralNode(this, this.node));
            if (this.context.version == types_1.OpenApiVersion.V3 ||
                this.context.version == types_1.OpenApiVersion.V3_1) {
                res.push(new servers_1.ServersNode(this, this.node["servers"]));
            }
            res.push(new security_1.SecurityNode(this, this.node["security"]));
            res.push(new tags_1.TagsNode(this, this.node["tags"], this.node["paths"]));
            res.push(new operation_ids_1.OperationIdsNode(this, this.node["paths"]));
            if (this.node["paths"] !== undefined) {
                res.push(new paths_1.PathsNode(this, this.node["paths"]));
            }
            if (this.context.version == types_1.OpenApiVersion.V3_1 && this.node["webhooks"] !== undefined) {
                res.push(new paths_1.WebhooksNode(this, this.node["webhooks"]));
            }
            if (this.context.version == types_1.OpenApiVersion.V3 ||
                this.context.version == types_1.OpenApiVersion.V3_1) {
                res.push(new components_1.ComponentsNode(this, this.node["components"]));
            }
            else {
                for (const key of panel_1.panelsVer2) {
                    res.push(new panel_1.PanelNode(this, key, this.node[key]));
                }
            }
        }
        return res;
    }
}
exports.RootNode = RootNode;
class SearchNode extends base_1.AbstractOutlineNode {
    constructor(parent, context) {
        super(parent, `oultine-search`, `Search: ${context.search}`, vscode.TreeItemCollapsibleState.None, undefined, context);
        this.parent = parent;
        this.context = context;
        this.icon = "search.svg";
        this.contextValue = "outlineSearch";
        this.searchable = false;
    }
}
exports.SearchNode = SearchNode;
//# sourceMappingURL=root.js.map