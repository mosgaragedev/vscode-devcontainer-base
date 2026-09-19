"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavoritesStore = void 0;
class FavoritesStore {
    constructor(context, store) {
        this.context = context;
        this.store = store;
    }
    key() {
        return `openapi-42crunch.favorite-${this.store.getConnection().platformUrl}`;
    }
    getFavoriteCollectionIds() {
        if (this.store.isConnected()) {
            const favorite = this.context.globalState.get(this.key());
            if (!favorite) {
                return [];
            }
            return favorite;
        }
        return [];
    }
    addFavoriteCollection(id) {
        const favorite = this.getFavoriteCollectionIds();
        if (!favorite.includes(id)) {
            favorite.push(id);
        }
        this.context.globalState.update(this.key(), favorite);
    }
    removeFavoriteCollection(id) {
        const favorite = this.getFavoriteCollectionIds().filter((existng) => existng !== id);
        this.context.globalState.update(this.key(), favorite);
    }
}
exports.FavoritesStore = FavoritesStore;
//# sourceMappingURL=favorites-store.js.map