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
exports.PlatformTagCodelensProvider = exports.CodelensProvider = void 0;
const vscode = __importStar(require("vscode"));
const util_1 = require("./util");
const parsers_1 = require("../parsers");
const types_1 = require("../types");
const tags_1 = require("@xliic/common/tags");
const credentials_1 = require("../credentials");
const supportedVersions = [types_1.OpenApiVersion.V2, types_1.OpenApiVersion.V3, types_1.OpenApiVersion.V3_1];
class CodelensProvider {
    constructor(store) {
        this.store = store;
    }
    async provideCodeLenses(document, token) {
        const apiId = (0, util_1.getApiId)(document.uri);
        const api = await this.store.getApi(apiId);
        const collection = await this.store.getCollection(api.desc.cid);
        const collectionLens = new vscode.CodeLens(new vscode.Range(0, 0, 0, 100), {
            title: `${collection.desc.name}`,
            tooltip: "Collection name",
            command: "openapi.platform.focusCollection",
            arguments: [collection.desc.id],
        });
        const apiLens = new vscode.CodeLens(new vscode.Range(0, 0, 0, 100), {
            title: `${api.desc.name}`,
            tooltip: "API name",
            command: "openapi.platform.focusApi",
            arguments: [collection.desc.id, api.desc.id],
        });
        const uuidLens = new vscode.CodeLens(new vscode.Range(0, 0, 0, 100), {
            title: `${api.desc.id}`,
            tooltip: "API UUID",
            command: "openapi.platform.copyToClipboard",
            arguments: [api.desc.id, `Copied UUID ${api.desc.id} to clipboard`],
        });
        return [collectionLens, apiLens, uuidLens];
    }
}
exports.CodelensProvider = CodelensProvider;
class PlatformTagCodelensProvider {
    constructor(cache, configuration, secrets, memento) {
        this.cache = cache;
        this.configuration = configuration;
        this.secrets = secrets;
        this.memento = memento;
    }
    async provideCodeLenses(document, token) {
        const credentials = await (0, credentials_1.hasCredentials)(this.configuration, this.secrets);
        if (credentials === "api-token") {
            const parsed = this.cache.getParsedDocument(document);
            if (supportedVersions.includes((0, parsers_1.getOpenApiVersion)(parsed))) {
                return [new TagsLens(document.uri)];
            }
        }
        return [];
    }
    async resolveCodeLens(codeLens, token) {
        const targetFileName = codeLens.uri?.fsPath;
        if (targetFileName) {
            const selectedTagNames = [];
            const tagsData = this.memento.get(tags_1.TAGS_DATA_KEY, {});
            let title;
            let tooltip;
            const data = tagsData[targetFileName];
            if (data) {
                if (Array.isArray(data)) {
                    data.forEach((tagEntry) => selectedTagNames.push(`${tagEntry.categoryName}: ${tagEntry.tagName}`));
                    title = `Tags: ${selectedTagNames.length} selected`;
                    tooltip = selectedTagNames.length > 0 ? "Tags: " + `${selectedTagNames.join(", ")}` : "";
                }
                else {
                    title = `Tags: linked to API`;
                    tooltip =
                        "Linked to API " + `${data.apiName}` + " in collection " + `${data.collectionName}`;
                }
            }
            else {
                title = "Tags: 0 selected";
                tooltip = "No tags selected";
            }
            codeLens.command = {
                title,
                tooltip,
                command: "openapi.platform.setTags",
                arguments: [codeLens.uri],
            };
        }
        return codeLens;
    }
}
exports.PlatformTagCodelensProvider = PlatformTagCodelensProvider;
class TagsLens extends vscode.CodeLens {
    constructor(uri) {
        super(new vscode.Range(0, 1, 0, 1024));
        this.uri = uri;
    }
}
//# sourceMappingURL=codelens.js.map