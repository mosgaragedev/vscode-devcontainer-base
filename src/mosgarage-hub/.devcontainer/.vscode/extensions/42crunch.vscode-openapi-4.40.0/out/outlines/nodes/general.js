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
exports.GeneralNode = exports.targetsVer2 = void 0;
const vscode = __importStar(require("vscode"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const base_1 = require("./base");
const simple_1 = require("./simple");
const types_1 = require("../../types");
exports.targetsVer2 = [
    "openapi",
    "swagger",
    "host",
    "basePath",
    "info",
    "schemes",
    "consumes",
    "produces",
    "externalDocs",
];
const targetsVer3 = ["openapi", "info", "externalDocs", "jsonSchemaDialect"];
const targetsByVersion = {
    [types_1.OpenApiVersion.V2]: exports.targetsVer2,
    [types_1.OpenApiVersion.V3]: targetsVer3,
    [types_1.OpenApiVersion.V3_1]: targetsVer3,
    [types_1.OpenApiVersion.Unknown]: [],
};
class GeneralNode extends base_1.AbstractOutlineNode {
    constructor(parent, node) {
        super(parent, "", "General", vscode.TreeItemCollapsibleState.Collapsed, node, parent.context);
        this.icon = "file-lines.svg";
        this.contextValue = "top-general";
        this.searchable = false;
    }
    getChildren() {
        const res = [];
        if (this.node) {
            const targets = targetsByVersion[this.context.version];
            for (const key of Object.keys(this.node)) {
                if (targets.includes(key)) {
                    const childNode = new simple_1.SimpleNode(this, this.nextPointer(key), key, this.node[key], 0);
                    res.push(childNode);
                    const location = (0, preserving_json_yaml_parser_1.getLocation)(this.node, key);
                    if (location) {
                        childNode.updateLocation(location);
                    }
                }
            }
        }
        return res;
    }
}
exports.GeneralNode = GeneralNode;
//# sourceMappingURL=general.js.map