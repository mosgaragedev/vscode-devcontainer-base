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
exports.FilteredApiNode = exports.CollectionNode = exports.FilteredCollectionNode = exports.CollectionsNode = void 0;
const vscode = __importStar(require("vscode"));
const api_1 = require("./api");
const base_1 = require("./base");
const load_more_1 = require("./load-more");
class CollectionsNode extends base_1.AbstractExplorerNode {
    constructor(parent, store) {
        super(parent, `${parent.id}-collections`, "API Collections", vscode.TreeItemCollapsibleState.Expanded);
        this.store = store;
        this.contextValue = "collections";
    }
    async getChildren() {
        const view = await this.store.getCollections(this.store.filters.collection, this.store.limits.getCollections());
        const children = view.collections.map((collection) => new CollectionNode(this.store, this, collection));
        const hasFilter = this.store.filters.collection
            ? [new FilteredCollectionNode(this, this.store, view.collections.length)]
            : [];
        const more = view.hasMore ? [new load_more_1.LoadMoreCollectionsNode(this)] : [];
        return [...hasFilter, ...children, ...more];
    }
}
exports.CollectionsNode = CollectionsNode;
class FilteredCollectionNode extends base_1.AbstractExplorerNode {
    constructor(parent, store, found) {
        super(parent, `${parent.id}-filter`, `Found ${found}`, vscode.TreeItemCollapsibleState.None);
        this.parent = parent;
        this.store = store;
        this.icon = "filter";
        this.contextValue = "collectionFilter";
    }
}
exports.FilteredCollectionNode = FilteredCollectionNode;
class CollectionNode extends base_1.AbstractExplorerNode {
    constructor(store, parent, collection) {
        super(parent, `${parent.id}-${collection.desc.id}`, getCollectionTitle(store, collection.desc), collection.summary.apis === 0
            ? vscode.TreeItemCollapsibleState.None
            : vscode.TreeItemCollapsibleState.Collapsed);
        this.store = store;
        this.collection = collection;
        const writable = this.collection.summary.writeApis;
        this.icon = writable ? "file-directory" : { light: "folder-locked", dark: "folder-locked" };
        this.contextValue = "collection";
    }
    async getChildren() {
        const apis = await this.store.getApis(this.getCollectionId(), this.store.filters.api.get(this.getCollectionId()), this.store.limits.getApis(this.getCollectionId()));
        const children = apis.apis.map((api) => new api_1.ApiNode(this, this.store, api));
        const hasMore = apis.hasMore ? [new load_more_1.LoadMoreApisNode(this)] : [];
        const hasFilter = this.store.filters.api.has(this.getCollectionId())
            ? [new FilteredApiNode(this, this.store, apis.apis.length)]
            : [];
        return [...hasFilter, ...children, ...hasMore];
    }
    getCollectionId() {
        return this.collection.desc.id;
    }
    getCollectionTechnicalName() {
        return this.collection.desc.technicalName;
    }
}
exports.CollectionNode = CollectionNode;
class FilteredApiNode extends base_1.AbstractExplorerNode {
    constructor(parent, store, found) {
        super(parent, `${parent.id}-filter`, `Found ${found}`, vscode.TreeItemCollapsibleState.None);
        this.parent = parent;
        this.store = store;
        this.icon = "filter";
        this.contextValue = "apiFilter";
    }
    getCollectionId() {
        return this.parent.getCollectionId();
    }
}
exports.FilteredApiNode = FilteredApiNode;
function getCollectionTitle(store, desc) {
    return desc.name;
}
//# sourceMappingURL=collection.js.map