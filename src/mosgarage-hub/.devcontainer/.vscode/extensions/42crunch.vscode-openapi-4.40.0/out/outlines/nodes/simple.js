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
exports.SimpleNode = void 0;
exports.getParameterLabel = getParameterLabel;
const vscode = __importStar(require("vscode"));
const base_1 = require("./base");
const icons = {
    schemas: "sitemap.svg",
    headers: "line-columns.svg",
    securitySchemes: "shield-keyhole.svg",
    links: "link-simple.svg",
    callbacks: "phone-arrow-up-right.svg",
    examples: "message-code.svg",
    responses: "response.svg",
    parameters: "sliders.svg",
    requestBodies: "request.svg",
    requestBody: "request.svg",
    security: "key.svg",
};
const contextValues = {
    parameters: "parameter",
    responses: "response",
    definitions: "definition",
    security: "securityItem",
    securityDefinitions: "securityDefinition",
    servers: "server",
};
const titles = {
    parameters: "Parameters",
    responses: "Responses",
    securitySchemes: "Security Schemes",
    schemas: "Schemas",
    requestBodies: "Request Bodies",
    headers: "Headers",
    links: "Links",
    callbacks: "Callbacks",
    examples: "Examples",
};
class SimpleNode extends base_1.AbstractOutlineNode {
    constructor(parent, pointer, key, node, depth, getTitle) {
        super(parent, pointer, capitalize(key, pointer), depth == 0 ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed, node, parent.context);
        this.icon = icons[key];
        this.depth = depth;
        this.getTitle = getTitle;
        this.contextValue = getContextValue(key, parent);
        this.searchable = !(parent.id === "/components" || parent.contextValue === "general");
    }
    getChildren() {
        const res = [];
        if (this.node && this.depth > 0) {
            if (typeof this.node === "object") {
                if (this.node instanceof Array) {
                    let id = 0;
                    for (const item of this.node) {
                        const pointer = this.nextPointer(id);
                        const title = this.getTitle ? this.getTitle(String(id), item) : "<unknown(" + id + ")>";
                        res.push(new SimpleNode(this, pointer, title, item, this.depth - 1));
                        id += 1;
                    }
                }
                else {
                    for (const key of Object.keys(this.node)) {
                        const pointer = this.nextPointer(key);
                        const title = this.getTitle ? this.getTitle(key, this.node[key]) : key;
                        res.push(new SimpleNode(this, pointer, title, this.node[key], this.depth - 1));
                    }
                }
            }
        }
        return res;
    }
}
exports.SimpleNode = SimpleNode;
function capitalize(title, pointer) {
    if (pointer.startsWith("/paths") || pointer.startsWith("/tags")) {
        return title;
    }
    return title in titles ? titles[title] : title;
}
function getContextValue(key, parent) {
    const parentCv = parent.contextValue;
    if (parentCv && contextValues[parentCv]) {
        return contextValues[parentCv];
    }
    if (parentCv === "components") {
        return key;
    }
    if (parent?.parent?.contextValue === "components") {
        return "component";
    }
    return "simple-child";
}
function getParameterLabel(_key, value) {
    // return label for a parameter
    const label = value["$ref"] || value["name"];
    if (!label) {
        return "<unknown>";
    }
    return label;
}
//# sourceMappingURL=simple.js.map