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
exports.ComponentsNode = void 0;
const vscode = __importStar(require("vscode"));
const base_1 = require("./base");
const simple_1 = require("./simple");
const subComponents = new Set([
    "schemas",
    "responses",
    "parameters",
    "examples",
    "requestBodies",
    "headers",
    "securitySchemes",
    "links",
    "callbacks",
]);
class ComponentsNode extends base_1.AbstractOutlineNode {
    constructor(parent, node) {
        super(parent, "/components", "Components", vscode.TreeItemCollapsibleState.Expanded, node, parent.context);
        this.icon = "box.svg";
        this.contextValue = "components";
        this.searchable = false;
    }
    getChildren() {
        return this.getChildrenByKey((key, pointer, node) => {
            if (subComponents.has(key)) {
                return new simple_1.SimpleNode(this, pointer, key, node, 1);
            }
        });
    }
}
exports.ComponentsNode = ComponentsNode;
//# sourceMappingURL=components.js.map