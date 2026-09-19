"use strict";
/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
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
exports.updateContext = updateContext;
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const vscode = __importStar(require("vscode"));
const types_1 = require("./types");
async function updateContext(cache, document) {
    if (!document) {
        // don't disable outlines when no editor is selected (which happens if audit or preview
        // webviews are selected) to prevent flicker
        return;
    }
    if (document.fileName.endsWith(".graphql") ||
        document.fileName.endsWith(".gql") ||
        document.fileName.endsWith(".graphqls") ||
        document.fileName.endsWith(".sdl")) {
        vscode.commands.executeCommand("setContext", "graphqlEnabled", true);
    }
    else {
        vscode.commands.executeCommand("setContext", "graphqlEnabled", false);
    }
    const version = cache.getDocumentVersion(document);
    if (version !== types_1.OpenApiVersion.Unknown) {
        if (version === types_1.OpenApiVersion.V2) {
            vscode.commands.executeCommand("setContext", "openapiTwoEnabled", true);
            vscode.commands.executeCommand("setContext", "openapiThreeEnabled", false);
            vscode.commands.executeCommand("setContext", "openapiThreeZeroEnabled", false);
            vscode.commands.executeCommand("setContext", "openapiThreeOneEnabled", false);
        }
        else if (version === types_1.OpenApiVersion.V3) {
            vscode.commands.executeCommand("setContext", "openapiThreeEnabled", true);
            vscode.commands.executeCommand("setContext", "openapiThreeZeroEnabled", true);
            vscode.commands.executeCommand("setContext", "openapiTwoEnabled", false);
            vscode.commands.executeCommand("setContext", "openapiThreeOneEnabled", false);
        }
        else if (version === types_1.OpenApiVersion.V3_1) {
            vscode.commands.executeCommand("setContext", "openapiThreeEnabled", true);
            vscode.commands.executeCommand("setContext", "openapiThreeZeroEnabled", false);
            vscode.commands.executeCommand("setContext", "openapiTwoEnabled", false);
            vscode.commands.executeCommand("setContext", "openapiThreeOneEnabled", true);
        }
        vscode.commands.executeCommand("setContext", "openapiDocumentScheme", document?.uri?.scheme);
        const root = cache.getLastGoodParsedDocument(document);
        if (root) {
            checkTree(root);
        }
    }
    else {
        vscode.commands.executeCommand("setContext", "openapiThreeEnabled", false);
        vscode.commands.executeCommand("setContext", "openapiTwoEnabled", false);
        vscode.commands.executeCommand("setContext", "openapiThreeEnabled", false);
        vscode.commands.executeCommand("setContext", "openapiThreeOneEnabled", false);
    }
}
function checkTree(tree) {
    setContext("openapiMissingHost", isMissing(tree, "/host"));
    setContext("openapiMissingBasePath", isMissing(tree, "/basePath"));
    setContext("openapiMissingInfo", isMissing(tree, "/info"));
}
function isMissing(tree, pointer) {
    return (0, preserving_json_yaml_parser_1.find)(tree, pointer) === undefined;
}
function setContext(name, value) {
    vscode.commands.executeCommand("setContext", name, value);
}
//# sourceMappingURL=context.js.map