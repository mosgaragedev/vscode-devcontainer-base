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
exports.activate = activate;
exports.provideYamlSchemas = provideYamlSchemas;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const types_1 = require("./types");
function activate(context, cache, configuration) {
    const yamlExtension = vscode.extensions.getExtension("redhat.vscode-yaml");
    if (yamlExtension) {
        provideYamlSchemas(context, cache, configuration, yamlExtension);
    }
    else {
        // TODO log
    }
}
async function provideYamlSchemas(context, cache, configuration, yamlExtension) {
    if (!yamlExtension.isActive) {
        await yamlExtension.activate();
    }
    let disabled = configuration.get("advanced.disableYamlSchemaContribution");
    configuration.onDidChange((e) => {
        if (configuration.changed(e, "advanced.disableYamlSchemaContribution")) {
            disabled = configuration.get("advanced.disableYamlSchemaContribution");
        }
    });
    function requestSchema(uri) {
        if (disabled) {
            return null;
        }
        for (const document of vscode.workspace.textDocuments) {
            if (document.uri.toString() === uri) {
                const version = cache.getDocumentVersion(document);
                if (version === types_1.OpenApiVersion.V2) {
                    return "openapi:v2";
                }
                else if (version === types_1.OpenApiVersion.V3) {
                    return "openapi:v3";
                }
                else if (version === types_1.OpenApiVersion.V3_1) {
                    const parsed = cache.getParsedDocument(document);
                    if (parsed &&
                        (parsed?.jsonSchemaDialect === undefined ||
                            parsed?.jsonSchemaDialect ===
                                "https://spec.openapis.org/oas/3.1/dialect/base")) {
                        return "openapi:v3_1_2020";
                    }
                    else {
                        return "openapi:v3_1_unknown";
                    }
                }
                break;
            }
        }
        return null;
    }
    function requestSchemaContent(uri) {
        const schemas = {
            "openapi:v2": "openapi-2.0.json",
            "openapi:v3": "openapi-3.0-2019-04-02.json",
            "openapi:v3_1_2020": "openapi-3.1-2020.json",
            "openapi:v3_1_unknown": "openapi-3.1.json",
        };
        if (!disabled && schemas[uri] !== undefined) {
            const filename = path.join(context.extensionPath, "schema/generated", schemas[uri]);
            return fs.readFileSync(filename, { encoding: "utf8" });
        }
        return null;
    }
    const schemaContributor = yamlExtension.exports;
    schemaContributor.registerContributor("openapi", requestSchema, requestSchemaContent);
}
//# sourceMappingURL=yaml-schema-contributor.js.map