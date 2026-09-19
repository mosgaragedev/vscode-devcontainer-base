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
exports.AbstractOutlineNode = exports.HTTP_METHODS = void 0;
const vscode = __importStar(require("vscode"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const pointer_1 = require("../../pointer");
exports.HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];
const SKIP_DEEP_SEARCH_CONTEXT_VALUES = new Set([
    "tag",
    "tag-child",
    "path",
    "operation",
    "operation-id",
]);
class AbstractOutlineNode {
    constructor(parent, id, title, collapsible, node, context) {
        this.parent = parent;
        this.id = id;
        this.title = title;
        this.collapsible = collapsible;
        this.node = node;
        this.context = context;
        this.item = new vscode.TreeItem({
            label: title,
            highlights: getHighlights(id, title, context),
        }, getCollapsibleState(parent, id, collapsible, node));
        if (this.parent) {
            const key = (0, pointer_1.getPointerLastSegment)(this.id);
            this.location = (0, preserving_json_yaml_parser_1.getLocation)(this.parent.node, key);
        }
        this.item.command = this.getCommand();
        this.searchable = true;
        this.skipDeepSearch = parent?.skipDeepSearch || false;
    }
    getChildren() {
        return [];
    }
    getAndFilterChildren() {
        const children = this.getChildren();
        const searchValue = this.context.search?.toLowerCase();
        if (!searchValue || this.parent?.skipDeepSearch) {
            return children;
        }
        const res = [];
        for (const child of children) {
            // Pass filtering if node's passFilter API returns true
            if (child.passFilter(searchValue)) {
                res.push(child);
                if ((child.contextValue && SKIP_DEEP_SEARCH_CONTEXT_VALUES.has(child.contextValue)) ||
                    (child.parent && child.parent.contextValue === "tag-child")) {
                    child.skipDeepSearch = true;
                }
                // or node has a descendant that meets search criteria
            }
            else if (child.getAndFilterChildren().length > 0) {
                res.push(child);
            }
        }
        return res;
    }
    passFilter(value) {
        // Pass filtering if node is configured as not searchable (paths, components, ...)
        // or node's tree title includes search value
        return !this.searchable || this.getLabel().toLowerCase().includes(value);
    }
    getCommand() {
        const documentUri = this.context.documentUri;
        const [editor] = vscode.window.visibleTextEditors.filter((editor) => editor.document.uri.toString() === documentUri);
        if (editor) {
            if (this.location) {
                const { start, end } = this.location.key ? this.location.key : this.location.value;
                return {
                    command: "openapi.goToLine",
                    title: "",
                    arguments: [
                        documentUri,
                        new vscode.Range(editor.document.positionAt(start), editor.document.positionAt(end)),
                    ],
                };
            }
        }
        return undefined;
    }
    updateLocation(location) {
        this.location = location;
        this.item.command = this.getCommand();
    }
    getOffset() {
        if (this.location) {
            const { start } = this.location.key ? this.location.key : this.location.value;
            return start;
        }
        return -1;
    }
    getLabel() {
        if (typeof this.item.label === "string") {
            return this.item.label;
        }
        return this.item.label?.label;
    }
    nextPointer(segment) {
        if (typeof segment === "string") {
            return this.id + "/" + (0, pointer_1.encodeJsonPointerSegment)(segment);
        }
        else {
            return this.id + "/" + segment;
        }
    }
    getChildrenByKey(getNode) {
        const res = [];
        if (this.node) {
            for (const key of Object.keys(this.node)) {
                const result = getNode(key, this.nextPointer(key), this.node[key]);
                if (result) {
                    res.push(result);
                }
            }
        }
        return res;
    }
    getChildrenById(getNode) {
        const res = [];
        if (this.node) {
            let id = 0;
            for (const item of this.node) {
                const result = getNode(id, this.nextPointer(id), item);
                if (result) {
                    res.push(result);
                }
                id += 1;
            }
        }
        return res;
    }
}
exports.AbstractOutlineNode = AbstractOutlineNode;
function getCollapsibleState(parent, id, defaultState, node) {
    if (id === "/tags" || parent?.id === "/tags") {
        return defaultState;
    }
    return node === undefined ? vscode.TreeItemCollapsibleState.None : defaultState;
}
function getHighlights(id, title, context) {
    if (id === "oultine-search") {
        return [];
    }
    const searchValue = context.search?.toLowerCase();
    if (!searchValue) {
        return [];
    }
    let i = -1;
    const ranges = [];
    while ((i = title.toLowerCase().indexOf(searchValue, i + 1)) != -1) {
        ranges.push([i, i + searchValue.length]);
    }
    return ranges;
}
//# sourceMappingURL=base.js.map