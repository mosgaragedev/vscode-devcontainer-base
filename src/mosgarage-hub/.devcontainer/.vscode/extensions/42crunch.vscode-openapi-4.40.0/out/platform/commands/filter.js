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
exports.default = (store, provider) => ({
    apisFilter: (collection) => apisFilter(store, provider, collection),
    favoriteApisFilter: (collection) => favoriteApisFilter(store, provider, collection),
    collectionsFilter: (collections) => collectionsFilter(store, provider, collections),
    collectionsFilterReset: async (node) => {
        store.filters.collection = undefined;
        provider.refresh();
    },
    apisFilterReset: async (node) => {
        store.filters.api.delete(node.getCollectionId());
        provider.refresh();
    },
    favoriteApisFilterReset: async (node) => {
        store.filters.favorite.delete(node.getCollectionId());
        provider.refresh();
    },
    loadMoreCollections: async (collections) => {
        store.limits.increaseCollections();
        provider.refresh();
    },
    loadMoreApis: async (collection) => {
        store.limits.increaseApis(collection.getCollectionId());
        provider.refresh();
    },
    loadMoreFavoriteApis: async (collection) => {
        store.limits.increaseFavorite(collection.getCollectionId());
        provider.refresh();
    },
});
async function collectionsFilter(store, provider, collections) {
    const filter = { name: undefined, owner: "ALL" };
    const name = await vscode.window.showInputBox({
        prompt: "Filter Collections by Name",
    });
    if (name !== undefined) {
        if (name !== "") {
            filter.name = name;
            store.filters.collection = filter;
        }
        else {
            store.filters.collection = undefined;
        }
        provider.refresh();
    }
}
async function apisFilter(store, provider, collection) {
    const filter = { name: undefined };
    const name = await vscode.window.showInputBox({
        prompt: "Filter APIs by Name",
    });
    if (name !== undefined) {
        if (name !== "") {
            filter.name = name;
            store.filters.api.set(collection.getCollectionId(), filter);
        }
        else {
            store.filters.api.delete(collection.getCollectionId());
        }
        provider.refresh();
    }
}
async function favoriteApisFilter(store, provider, collection) {
    const filter = { name: undefined };
    const name = await vscode.window.showInputBox({
        prompt: "Filter APIs by Name",
    });
    if (name !== undefined) {
        if (name !== "") {
            filter.name = name;
            store.filters.favorite.set(collection.getCollectionId(), filter);
        }
        else {
            store.filters.favorite.delete(collection.getCollectionId());
        }
        provider.refresh();
    }
}
//# sourceMappingURL=filter.js.map