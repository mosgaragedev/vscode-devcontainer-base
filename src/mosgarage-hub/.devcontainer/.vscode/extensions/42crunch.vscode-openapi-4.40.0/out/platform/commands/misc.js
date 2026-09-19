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
const vscode = __importStar(require("vscode"));
const util_1 = require("../util");
const api_1 = require("../explorer/nodes/api");
const collection_1 = require("../explorer/nodes/collection");
exports.default = (store, favorites, provider, tree) => ({
    deleteApi: async (api) => {
        if (await (0, util_1.confirmed)("Are you sure you want to delete the selected API")) {
            const apiId = api.getApiId();
            for (const document of vscode.workspace.textDocuments) {
                if ((0, util_1.getApiId)(document.uri) === apiId) {
                    await vscode.window.showTextDocument(document, { preserveFocus: false });
                    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
                }
            }
            await store.deleteApi(apiId);
            provider.refresh();
        }
    },
    collectionAddToFavorite: async (collection) => {
        favorites.addFavoriteCollection(collection.getCollectionId());
        provider.refresh();
    },
    collectionRemoveFromFavorite: async (collection) => {
        if (await (0, util_1.confirmed)("Are you sure you want to remove selected collection from Favorite?")) {
            favorites.removeFavoriteCollection(collection.getCollectionId());
            provider.refresh();
        }
    },
    collectionRename: async (collection) => {
        const convention = await store.getCollectionNamingConvention();
        const name = await vscode.window.showInputBox({
            title: "Rename collection",
            value: collection.collection.desc.name,
            ...(0, util_1.createCollectionNamingConventionInputBoxOptions)(convention),
        });
        if (name) {
            await store.collectionRename(collection.getCollectionId(), name);
            provider.refresh();
        }
    },
    apiRename: async (api) => {
        const convention = await store.getCollectionNamingConvention();
        const name = await vscode.window.showInputBox({
            title: "Rename API",
            value: api.api.desc.name,
            ...(0, util_1.createCollectionNamingConventionInputBoxOptions)(convention),
        });
        if (name) {
            await store.apiRename(api.getApiId(), name);
            provider.refresh();
        }
    },
    deleteCollection: async (collection) => {
        if (collection.collection.summary.apis > 0) {
            await vscode.window.showWarningMessage("This collection is not empty, please remove all APIs in the collection first.");
            return;
        }
        if (await (0, util_1.confirmed)("Are you sure you want to delete the selected collection?")) {
            await store.deleteCollection(collection.getCollectionId());
            provider.refresh();
        }
    },
    focusApi: async (collectionId, apiId) => {
        const collection = await store.getCollection(collectionId);
        const api = await store.getApi(apiId);
        const collectionNode = new collection_1.CollectionNode(store, provider.root.collections, collection);
        const apiNode = new api_1.ApiNode(collectionNode, store, api);
        tree.reveal(apiNode, { focus: true });
    },
    focusCollection: async (collectionId) => {
        const collection = await store.getCollection(collectionId);
        const collectionNode = new collection_1.CollectionNode(store, provider.root.collections, collection);
        tree.reveal(collectionNode, { focus: true });
    },
    createCollection: async () => {
        const convention = await store.getCollectionNamingConvention();
        const name = await vscode.window.showInputBox({
            title: "Create new collection",
            placeHolder: "New collection name",
            ...(0, util_1.createCollectionNamingConventionInputBoxOptions)(convention),
        });
        if (name) {
            const collection = await store.createCollection(name);
            const collectionNode = new collection_1.CollectionNode(store, provider.root.collections, collection);
            provider.refresh();
            tree.reveal(collectionNode, { focus: true });
        }
    },
    refreshCollections: async () => {
        await store.refresh();
        provider.refresh();
    },
    editApi: async (apiId) => {
        const uri = (0, util_1.makePlatformUri)(apiId);
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document);
    },
    openFile: async (rootPath, technicalName) => {
        const uri = vscode.Uri.file(`${rootPath}/${technicalName}`);
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document);
    },
});
//# sourceMappingURL=misc.js.map