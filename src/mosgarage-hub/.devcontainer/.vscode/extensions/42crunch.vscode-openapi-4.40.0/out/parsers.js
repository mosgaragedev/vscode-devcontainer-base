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
exports.parseDocument = parseDocument;
exports.getOpenApiVersion = getOpenApiVersion;
const vscode = __importStar(require("vscode"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const types_1 = require("./types");
function parseDocument(document, parserOptions) {
    if (!(document.languageId === "json" ||
        document.languageId === "jsonc" ||
        document.languageId == "yaml")) {
        return [types_1.OpenApiVersion.Unknown, null, []];
    }
    const [node, errors] = (0, preserving_json_yaml_parser_1.parse)(document.getText(), document.languageId, parserOptions);
    const version = getOpenApiVersion(node);
    const messages = errors.map((error) => {
        const start = document.positionAt(error.offset);
        const end = error.length ? document.positionAt(error.offset + error.length) : undefined;
        const range = end ? new vscode.Range(start, end) : document.lineAt(start).range;
        return {
            source: "vscode-openapi",
            code: "",
            severity: vscode.DiagnosticSeverity.Error,
            message: error.message,
            range,
        };
    });
    return [version, node, messages.length > 0 ? messages : []];
}
function getOpenApiVersion(root) {
    if (root?.swagger === "2.0") {
        return types_1.OpenApiVersion.V2;
    }
    else if (root?.openapi &&
        typeof root?.openapi === "string" &&
        root?.openapi?.match(/^3\.0\.\d(-.+)?$/)) {
        return types_1.OpenApiVersion.V3;
    }
    else if (root?.openapi &&
        typeof root?.openapi === "string" &&
        root?.openapi?.match(/^3\.1\.\d(-.+)?$/)) {
        return types_1.OpenApiVersion.V3_1;
    }
    else {
        return types_1.OpenApiVersion.Unknown;
    }
}
//# sourceMappingURL=parsers.js.map