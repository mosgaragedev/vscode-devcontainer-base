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
exports.FilteredFavoriteApiNode = exports.FavoriteCollectionNode = exports.FavoriteCollectionsNode = void 0;
const vscode = __importStar(require("vscode"));
const api_1 = require("./api");
const base_1 = require("./base");
const load_more_1 = require("./load-more");
class FavoriteCollectionsNode extends base_1.AbstractExplorerNode {
    constructor(parent, store, favoritesStore) {
        super(parent, `${parent.id}-favorite`, "My Favorite Collections", vscode.TreeItemCollapsibleState.Expanded);
        this.store = store;
        this.favoritesStore = favoritesStore;
        this.contextValue = "favorite";
    }
    async getChildren() {
        const favorites = this.favoritesStore.getFavoriteCollectionIds();
        const collections = await this.store.getAllCollections();
        const children = collections
            .filter((collection) => favorites.includes(collection.desc.id))
            .map((collection) => new FavoriteCollectionNode(this, this.store, collection));
        return children;
    }
}
exports.FavoriteCollectionsNode = FavoriteCollectionsNode;
class FavoriteCollectionNode extends base_1.AbstractExplorerNode {
    constructor(parent, store, collection) {
        super(parent, `${parent.id}-${collection.desc.id}`, collection.desc.name, collection.summary.apis === 0
            ? vscode.TreeItemCollapsibleState.None
            : vscode.TreeItemCollapsibleState.Collapsed);
        this.store = store;
        this.collection = collection;
        this.icon = "file-directory";
        this.contextValue = "favoriteCollection";
    }
    async getChildren() {
        const apis = await this.store.getApis(this.getCollectionId(), this.store.filters.favorite.get(this.getCollectionId()), this.store.limits.getFavorite(this.getCollectionId()));
        const children = apis.apis.map((api) => new api_1.ApiNode(this, this.store, api));
        const hasMore = apis.hasMore ? [new load_more_1.LoadMoreFavoriteApisNode(this)] : [];
        const hasFilter = this.store.filters.favorite.has(this.getCollectionId())
            ? [new FilteredFavoriteApiNode(this, this.store, apis.apis.length)]
            : [];
        return [...hasFilter, ...children, ...hasMore];
    }
    getCollectionId() {
        return this.collection.desc.id;
    }
}
exports.FavoriteCollectionNode = FavoriteCollectionNode;
class FilteredFavoriteApiNode extends base_1.AbstractExplorerNode {
    constructor(parent, store, found) {
        super(parent, `${parent.id}-filter`, `Found ${found}`, vscode.TreeItemCollapsibleState.None);
        this.parent = parent;
        this.store = store;
        this.icon = "filter";
        this.contextValue = "favoriteApiFilter";
    }
    getCollectionId() {
        return this.parent.getCollectionId();
    }
}
exports.FilteredFavoriteApiNode = FilteredFavoriteApiNode;
//# sourceMappingURL=favorite.js.map