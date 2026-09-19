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
exports.AuditCodelensProvider = void 0;
const vscode = __importStar(require("vscode"));
const openapi_1 = require("@xliic/openapi");
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const parsers_1 = require("../parsers");
const types_1 = require("../types");
const supportedVersions = [types_1.OpenApiVersion.V2, types_1.OpenApiVersion.V3, types_1.OpenApiVersion.V3_1];
class AuditCodelensProvider {
    constructor(cache) {
        this.cache = cache;
        this.lenses = {};
    }
    async provideCodeLenses(document, token) {
        const parsed = this.cache.getParsedDocument(document);
        if (supportedVersions.includes((0, parsers_1.getOpenApiVersion)(parsed))) {
            const result = [];
            const oas = parsed;
            const operations = (0, openapi_1.getOperations)(oas);
            for (const [path, method, operation] of operations) {
                result.push(auditLens(document, oas, path, method));
            }
            result.push(topAuditLens(document));
            this.lenses[document.uri.toString()] = result.filter((lens) => lens !== undefined);
        }
        return this.lenses[document.uri.toString()];
    }
}
exports.AuditCodelensProvider = AuditCodelensProvider;
function auditLens(document, oas, path, method) {
    const pathItem = oas.paths?.[path];
    if (!pathItem) {
        return undefined;
    }
    const location = (0, preserving_json_yaml_parser_1.getLocation)(pathItem, method);
    if (!location) {
        return undefined;
    }
    const position = document.positionAt(location.key.start);
    const line = document.lineAt(position.line + 1);
    const range = new vscode.Range(new vscode.Position(position.line + 1, line.firstNonWhitespaceCharacterIndex), new vscode.Position(position.line + 1, line.range.end.character));
    return new vscode.CodeLens(range, {
        title: `Audit`,
        tooltip: "Audit this operation",
        command: "openapi.editorSingleOperationAudit",
        arguments: [path, method],
    });
}
function topAuditLens(document) {
    const line = document.lineAt(0);
    return new vscode.CodeLens(line.range, {
        title: "Audit",
        tooltip: "Audit this OpenAPI file",
        command: "openapi.securityAudit",
    });
}
//# sourceMappingURL=lens.js.map