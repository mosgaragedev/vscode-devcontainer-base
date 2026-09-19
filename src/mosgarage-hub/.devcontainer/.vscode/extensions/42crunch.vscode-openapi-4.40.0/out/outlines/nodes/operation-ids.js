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
exports.OperationIdNode = exports.OperationIdsNode = void 0;
const vscode = __importStar(require("vscode"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const pointer_1 = require("../../pointer");
const base_1 = require("./base");
const simple_1 = require("./simple");
class OperationIdsNode extends base_1.AbstractOutlineNode {
    constructor(parent, node) {
        super(parent, "", "Operation ID", hasOperationIds(node)
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None, node, parent.context);
        this.icon = "id-card.svg";
        this.searchable = false;
    }
    getChildren() {
        const operations = [];
        if (this.node) {
            for (const pathName of Object.keys(this.node)) {
                let id = "/paths/" + (0, pointer_1.encodeJsonPointerSegment)(pathName);
                const path = this.node[pathName];
                for (const opName of Object.keys(path)) {
                    if (!base_1.HTTP_METHODS.includes(opName)) {
                        continue;
                    }
                    const operation = path[opName];
                    const operationId = operation["operationId"];
                    if (operationId) {
                        id += "/" + (0, pointer_1.encodeJsonPointerSegment)(opName) + "/operationId";
                        const opNode = new OperationIdNode(this, id, operationId, operation, pathName, opName);
                        const location = (0, preserving_json_yaml_parser_1.getLocation)(path, opName);
                        if (location) {
                            opNode.updateLocation(location);
                        }
                        operations.push(opNode);
                    }
                }
            }
        }
        return operations;
    }
}
exports.OperationIdsNode = OperationIdsNode;
class OperationIdNode extends base_1.AbstractOutlineNode {
    constructor(parent, pointer, key, node, path, method) {
        super(parent, pointer, key, vscode.TreeItemCollapsibleState.Collapsed, node, parent.context);
        this.path = path;
        this.method = method;
        this.contextValue = "operation-id";
    }
    getChildren() {
        return this.getChildrenByKey((key, pointer, node) => {
            if (["responses", "parameters", "requestBody", "security"].includes(key)) {
                if (key == "parameters") {
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
exports.OperationIdNode = OperationIdNode;
function hasOperationIds(node) {
    if (node) {
        for (const pathName of Object.keys(node)) {
            const path = node[pathName];
            for (const opName of Object.keys(path)) {
                if (base_1.HTTP_METHODS.includes(opName) && path[opName]["operationId"]) {
                    return true;
                }
            }
        }
    }
    return false;
}
//# sourceMappingURL=operation-ids.js.map