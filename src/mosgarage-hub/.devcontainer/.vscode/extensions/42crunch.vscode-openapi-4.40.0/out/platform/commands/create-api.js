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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = __importStar(require("vscode"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const api_1 = require("../explorer/nodes/api");
const got_1 = __importDefault(require("got"));
const util_1 = require("../util");
const types_1 = require("../types");
exports.default = (store, importedUrls, provider, tree, cache) => ({
    createApi: (collection) => createApi(store, provider, tree, cache, collection),
    createApiFromUrl: (collection) => createApiFromUrl(store, importedUrls, provider, tree, cache, collection),
    editorReloadApiFromUrl: (editor, edit) => reloadApiFromUrl(store, importedUrls, editor, edit),
});
async function createApi(store, provider, tree, cache, collection) {
    const uri = await vscode.window.showOpenDialog({
        title: "Import API",
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        // TODO use language filter from extension.ts
        filters: {
            OpenAPI: ["json", "yaml", "yml"],
        },
    });
    if (uri) {
        const document = await vscode.workspace.openTextDocument(uri[0]);
        // TODO handle bundling errors
        const bundle = await cache.getDocumentBundle(document);
        if (!bundle || "errors" in bundle) {
            throw new Error("Unable to import API, please check the file you're trying to import for errors");
        }
        const convention = await store.getApiNamingConvention();
        const name = await vscode.window.showInputBox({
            title: "Import API into a collection",
            value: mangle(bundle?.value?.info?.title ?? "OpenAPI"),
            ...(0, util_1.createApiNamingConventionInputBoxOptions)(convention),
        });
        if (name) {
            const json = (0, preserving_json_yaml_parser_1.stringify)(bundle.value);
            const api = await store.createApi(collection.getCollectionId(), name, json);
            const apiNode = new api_1.ApiNode(collection, store, api);
            provider.refresh();
            tree.reveal(apiNode, { focus: true });
        }
    }
}
async function createApiFromUrl(store, importedUrls, provider, tree, cache, collection) {
    const uri = await vscode.window.showInputBox({
        prompt: "Import API from URL",
    });
    if (uri) {
        const { body, headers } = await (0, got_1.default)(uri);
        const [parsed, errors] = (0, preserving_json_yaml_parser_1.parse)(body, "json", {});
        if (errors.length > 0) {
            throw new Error("Unable to import API, please check the file you're trying to import for errors");
        }
        const convention = await store.getApiNamingConvention();
        const name = await vscode.window.showInputBox({
            title: "Import API into a collection",
            value: mangle(parsed?.info?.title ?? "OpenAPI"),
            ...(0, util_1.createApiNamingConventionInputBoxOptions)(convention),
        });
        if (name) {
            const api = await store.createApi(collection.getCollectionId(), name, body);
            importedUrls.setUrl(api.desc.id, uri);
            const apiNode = new api_1.ApiNode(collection, store, api);
            provider.refresh();
            tree.reveal(apiNode, { focus: true });
        }
    }
}
async function reloadApiFromUrl(store, importedUrls, editor, edit) {
    // TODO check for dirty status of the document, and confirm contents to be overwritten
    const apiId = (0, util_1.getApiId)(editor.document.uri);
    const old = importedUrls.getUrl(apiId);
    const uri = await vscode.window.showInputBox({
        prompt: "Reload API from URL",
        value: old,
    });
    if (uri) {
        const { body, headers } = await (0, got_1.default)(uri);
        const [parsed, errors] = (0, preserving_json_yaml_parser_1.parse)(body, "json", {});
        if (errors.length > 0) {
            throw new Error("Unable to import API, please check the file you're trying to import for errors");
        }
        const text = (0, preserving_json_yaml_parser_1.stringify)(parsed, 2);
        const range = editor.document.validateRange(new vscode.Range(0, 0, Number.MAX_SAFE_INTEGER, 0));
        editor.edit((edit) => {
            edit.replace(range, text);
        });
    }
}
function mangle(name) {
    return name.replace(/[^A-Za-z0-9_\\-\\.\\ ]/g, "-").substring(0, types_1.MAX_NAME_LEN);
}
//# sourceMappingURL=create-api.js.map