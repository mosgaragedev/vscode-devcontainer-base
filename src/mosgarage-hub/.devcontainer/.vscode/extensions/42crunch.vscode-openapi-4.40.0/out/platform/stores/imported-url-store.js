"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportedUrlStore = void 0;
const KEY = "openapi-42crunch.imported-urls";
const MAX_SIZE = 100;
class ImportedUrlStore {
    constructor(context) {
        this.context = context;
    }
    getUrl(apiId) {
        const imported = this.context.globalState.get(KEY);
        if (imported) {
            const found = imported.filter((entry) => entry.apiId === apiId);
            if (found.length > 0) {
                return found[0].url;
            }
        }
    }
    async setUrl(apiId, url) {
        const imported = this.context.globalState.get(KEY) ?? [];
        const cleaned = imported.filter((entry) => entry.apiId !== apiId);
        cleaned.push({ apiId, url: url.toString() });
        if (cleaned.length > MAX_SIZE) {
            cleaned.shift();
        }
        await this.context.globalState.update(KEY, cleaned);
    }
}
exports.ImportedUrlStore = ImportedUrlStore;
//# sourceMappingURL=imported-url-store.js.map