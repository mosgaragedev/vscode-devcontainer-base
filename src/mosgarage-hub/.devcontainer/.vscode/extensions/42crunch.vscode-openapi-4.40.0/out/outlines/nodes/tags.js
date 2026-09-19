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
exports.TagChildNode = exports.TagNode = exports.TagsNode = void 0;
const vscode = __importStar(require("vscode"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const base_1 = require("./base");
const simple_1 = require("./simple");
class TagsNode extends base_1.AbstractOutlineNode {
    constructor(parent, tags, paths) {
        super(parent, "/tags", "Tags", hasTags(tags, paths)
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None, tags, parent.context);
        this.paths = paths;
        this.icon = "tags.svg";
        this.searchable = false;
    }
    getChildren() {
        const tagNodes = [];
        const tagsOpsMap = new Map();
        const tagsPointersMap = new Map();
        const tagsNodesMap = new Map();
        // Collect all tags from all operations
        if (this.paths) {
            for (const [pathName, path] of Object.entries(this.paths)) {
                for (const [opName, operation] of Object.entries(path)) {
                    if (!base_1.HTTP_METHODS.includes(opName)) {
                        continue;
                    }
                    const tags = operation["tags"];
                    if (Array.isArray(tags)) {
                        for (const tag of tags) {
                            if (!tagsOpsMap.has(tag)) {
                                tagsOpsMap.set(tag, []);
                            }
                            const opId = operation;
                            if (opId) {
                                const name = getUniqueName(pathName, opName, operation);
                                const location = (0, preserving_json_yaml_parser_1.getLocation)(path, opName);
                                const tagOperation = {
                                    type: "operation",
                                    name,
                                    operation,
                                    location,
                                };
                                tagsOpsMap.get(tag)?.push(tagOperation);
                            }
                        }
                    }
                }
            }
        }
        // Collect all tags from tags object
        if (this.node) {
            const tags = this.node;
            let ix = 0;
            for (const tag of tags) {
                const tagName = tag["name"];
                if (tagName) {
                    if (!tagsOpsMap.has(tagName)) {
                        tagsOpsMap.set(tagName, []);
                    }
                    tagsPointersMap.set(tagName, this.nextPointer(ix));
                    tagsNodesMap.set(tagName, tag);
                    ix += 1;
                }
            }
        }
        for (const [tagName, operations] of tagsOpsMap) {
            const pointer = tagsPointersMap.get(tagName) || this.nextPointer(tagName);
            const node = tagsNodesMap.get(tagName);
            tagNodes.push(new TagNode(this, pointer, tagName, node, operations));
        }
        return tagNodes;
    }
}
exports.TagsNode = TagsNode;
class TagNode extends base_1.AbstractOutlineNode {
    constructor(parent, pointer, key, node, operations) {
        super(parent, pointer, key, operations.length === 0
            ? vscode.TreeItemCollapsibleState.None
            : vscode.TreeItemCollapsibleState.Collapsed, node, parent.context);
        this.tagOps = operations;
        this.contextValue = "tag";
    }
    getChildren() {
        const res = [];
        if (this.tagOps) {
            let ix = 0;
            for (const tagOp of this.tagOps) {
                res.push(new TagChildNode(this, this.nextPointer(ix), tagOp));
                ix += 1;
            }
        }
        return res;
    }
}
exports.TagNode = TagNode;
class TagChildNode extends base_1.AbstractOutlineNode {
    constructor(parent, id, tagOp) {
        super(parent, id, uniqueNameToString(tagOp.name), vscode.TreeItemCollapsibleState.Collapsed, tagOp.operation, parent.context);
        this.tagOp = tagOp;
        this.updateLocation(tagOp.location);
        if (tagOp.name.type === "operationId") {
            this.item.tooltip = getTooltip(tagOp.name);
        }
        this.contextValue = "tag-child";
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
exports.TagChildNode = TagChildNode;
function getTooltip(name) {
    return `${name.method.toUpperCase()} ${name.path}`;
}
function uniqueNameToString(name) {
    return name.type === "operationId" ? name.operationId : getTooltip(name);
}
function getUniqueName(path, method, operation) {
    const operationId = operation["operationId"];
    if (operationId && operationId !== "") {
        return { type: "operationId", operationId, path, method };
    }
    return {
        type: "pathMethod",
        method,
        path,
    };
}
function hasTags(tags, paths) {
    if (tags && Array.isArray(tags) && tags.length > 0) {
        return true;
    }
    if (paths) {
        for (const [, path] of Object.entries(paths)) {
            for (const [opName, operation] of Object.entries(path)) {
                if (!base_1.HTTP_METHODS.includes(opName)) {
                    continue;
                }
                const tags = operation["tags"];
                if (Array.isArray(tags) && tags.length > 0) {
                    return true;
                }
            }
        }
    }
    return false;
}
//# sourceMappingURL=tags.js.map