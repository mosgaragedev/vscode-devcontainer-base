"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformStore = exports.Filters = exports.Limits = void 0;
exports.getMandatoryTags = getMandatoryTags;
exports.getTagDataEntry = getTagDataEntry;
const vscode_1 = require("vscode");
const platform_1 = require("@xliic/common/platform");
const api_1 = require("../api");
const tags_1 = require("@xliic/common/tags");
const COLLECTION_PAGE_SIZE = 100;
const APIS_PAGE_SIZE = 100;
class Limits {
    constructor() {
        this.collections = COLLECTION_PAGE_SIZE;
        this.apis = new Map();
        this.favorite = new Map();
    }
    getCollections() {
        return this.collections;
    }
    increaseCollections() {
        this.collections = this.collections + COLLECTION_PAGE_SIZE;
    }
    getApis(collectionId) {
        return this.apis.get(collectionId) ?? APIS_PAGE_SIZE;
    }
    increaseApis(collectionId) {
        this.apis.set(collectionId, (this.apis.get(collectionId) ?? APIS_PAGE_SIZE) + APIS_PAGE_SIZE);
    }
    getFavorite(collectionId) {
        return this.favorite.get(collectionId) ?? APIS_PAGE_SIZE;
    }
    increaseFavorite(collectionId) {
        this.favorite.set(collectionId, (this.favorite.get(collectionId) ?? APIS_PAGE_SIZE) + APIS_PAGE_SIZE);
    }
    reset() {
        this.collections = COLLECTION_PAGE_SIZE;
        this.apis = new Map();
        this.favorite = new Map();
    }
}
exports.Limits = Limits;
class Filters {
    constructor() {
        this.collection = undefined;
        this.api = new Map();
        this.favorite = new Map();
    }
}
exports.Filters = Filters;
class PlatformStore {
    constructor(configuration, logger) {
        this.configuration = configuration;
        this.logger = logger;
        this.apiLastAssessment = new Map();
        this.connection = undefined;
        this.limits = new Limits();
        this.filters = new Filters();
        this.readonlyApis = new Set();
        this._onConnectionDidChange = new vscode_1.EventEmitter();
        this.connected = false;
    }
    get onConnectionDidChange() {
        return this._onConnectionDidChange.event;
    }
    async setCredentials(credentials) {
        this.connection = credentials;
        this.readonlyApis.clear();
        await this.refresh();
        this._onConnectionDidChange.fire({
            credentials: this.hasCredentials(),
            connected: this.isConnected(),
        });
    }
    hasCredentials() {
        return (this.connection !== undefined && !!this.connection.platformUrl && !!this.connection.apiToken);
    }
    isConnected() {
        return this.connected;
    }
    async testConnection(credentials, logger) {
        return (0, api_1.testConnection)(credentials, logger);
    }
    getConnection() {
        if (this.connection === undefined) {
            throw new Error(`Platform connection has not been configured`);
        }
        return this.connection;
    }
    async getCollectionNamingConvention() {
        return (0, api_1.getCollectionNamingConvention)(this.getConnection(), this.logger);
    }
    async getApiNamingConvention() {
        return (0, api_1.getApiNamingConvention)(this.getConnection(), this.logger);
    }
    async getCollections(filter, limit) {
        const response = await (0, api_1.listCollections)(filter, this.getConnection(), this.logger);
        const filtered = response.list.filter((collection) => {
            if (filter) {
                return filter.name
                    ? collection.desc.name.toLowerCase().includes(filter.name.toLowerCase())
                    : true;
            }
            return true;
        });
        const hasMore = filtered.length > limit;
        return {
            hasMore,
            collections: filtered.slice(0, limit),
        };
    }
    async searchCollections(name) {
        return (0, api_1.searchCollections)(name, this.getConnection(), this.logger);
    }
    async getAllCollections() {
        const response = await (0, api_1.listCollections)({ name: undefined, owner: "ALL" }, this.getConnection(), this.logger);
        return response.list;
    }
    async createCollection(name) {
        const collection = await (0, api_1.createCollection)(name, this.getConnection(), this.logger);
        return collection;
    }
    async collectionRename(collectionId, name) {
        await (0, api_1.collectionUpdate)(collectionId, name, this.getConnection(), this.logger);
    }
    async apiRename(apiId, name) {
        await (0, api_1.updateApi)(apiId, { name }, this.getConnection(), this.logger);
    }
    async createApi(collectionId, name, json) {
        const tagIds = [];
        const mandatoryTags = getMandatoryTags(this.configuration);
        if (mandatoryTags.length > 0) {
            const platformTags = await (0, api_1.getTags)(this.getConnection(), this.logger);
            tagIds.push(...getMandatoryTagsIds(mandatoryTags, platformTags));
        }
        const api = await (0, api_1.createApi)(collectionId, name, tagIds, Buffer.from(json), this.getConnection(), this.logger);
        return api;
    }
    async createTempApi(json, tagDataEntry) {
        const collectionId = await this.findOrCreateTempCollection();
        const tagIds = [];
        const mandatoryTags = getMandatoryTags(this.configuration);
        if (mandatoryTags.length > 0) {
            const platformTags = await (0, api_1.getTags)(this.getConnection(), this.logger);
            tagIds.push(...getMandatoryTagsIds(mandatoryTags, platformTags));
        }
        if (tagDataEntry) {
            if (Array.isArray(tagDataEntry)) {
                const platformTags = await (0, api_1.getTags)(this.getConnection(), this.logger);
                tagIds.push(...getActiveTagsIds(tagDataEntry, platformTags));
            }
            else {
                tagIds.push(...(await this.getTagsIdsFromApi(tagDataEntry.collectionId, tagDataEntry.apiId)));
            }
        }
        // if the api naming convention is configured, use its example as the api name
        // this way we don't have to come up with a name that matches its pattern
        const convention = await this.getApiNamingConvention();
        const apiName = convention.pattern !== "" ? convention.example : `tmp-${Date.now()}`;
        const api = await (0, api_1.createApi)(collectionId, apiName, Array.from(new Set(tagIds).values()), Buffer.from(json), this.getConnection(), this.logger);
        this.logger.info(`Created temporary API: "${apiName}" ${api.desc.id}`);
        return { apiId: api.desc.id, collectionId };
    }
    async clearTempApi(tmp) {
        // delete the api
        this.logger.info(`Clearing temporary API: "${tmp.apiId}" from collection "${tmp.collectionId}"`);
        await (0, api_1.deleteApi)(tmp.apiId, this.getConnection(), this.logger);
        // check if any of the old apis have to be deleted
        const current = new Date().getTime();
        const response = await (0, api_1.listApis)(tmp.collectionId, this.getConnection(), this.logger);
        const convention = await this.getApiNamingConvention();
        this.logger.debug(`Checking for old temporary APIs in collection "${tmp.collectionId}"`);
        let deletedCount = 0;
        for (const api of response.list) {
            this.logger.debug(`Checking API: "${api.desc.name}" (${api.desc.id})`);
            const name = api.desc.name;
            if (name.startsWith("tmp-")) {
                const timestamp = Number(name.split("-")[1]);
                if (current - timestamp > 600000) {
                    this.logger.debug(`Deleting old temporary API: "${name}" (${api.desc.id})`);
                    await (0, api_1.deleteApi)(api.desc.id, this.getConnection(), this.logger);
                    deletedCount++;
                }
            }
            else if (convention.pattern !== "" && name === convention.example) {
                // if the api naming convention is configured, we don't have timestamps in the name
                this.logger.debug(`Deleting old API with no timestamp: "${name}" (${api.desc.id})`);
                await (0, api_1.deleteApi)(api.desc.id, this.getConnection(), this.logger);
                deletedCount++;
            }
        }
        if (response.list.length === deletedCount) {
            this.logger.info(`All temporary APIs in collection "${tmp.collectionId}" have been deleted, removing collection`);
            await (0, api_1.deleteCollection)(tmp.collectionId, this.getConnection(), this.logger);
        }
        else {
            this.logger.info(`Temporary collection has been cleared, but not all APIs were deleted. Remaining APIs: ${response.list.length - deletedCount}`);
        }
    }
    async updateApi(apiId, content) {
        const api = await (0, api_1.readApi)(apiId, this.getConnection(), this.logger, false);
        const last = api?.assessment?.last ? new Date(api.assessment.last) : new Date(0);
        this.apiLastAssessment.set(apiId, last);
        await (0, api_1.updateApi)(apiId, { specfile: content }, this.getConnection(), this.logger);
    }
    async deleteCollection(collectionId) {
        await (0, api_1.deleteCollection)(collectionId, this.getConnection(), this.logger);
    }
    async deleteApi(apiId) {
        await (0, api_1.deleteApi)(apiId, this.getConnection(), this.logger);
    }
    async getApis(collectionId, filter, limit) {
        const response = await (0, api_1.listApis)(collectionId, this.getConnection(), this.logger);
        const filtered = response.list.filter((api) => {
            if (filter) {
                return filter.name ? api.desc.name.toLowerCase().includes(filter.name.toLowerCase()) : true;
            }
            return true;
        });
        const hasMore = filtered.length > limit;
        return {
            hasMore,
            apis: filtered.slice(0, limit),
        };
    }
    async getApi(apiId) {
        const api = await (0, api_1.readApi)(apiId, this.getConnection(), this.logger, true);
        return api;
    }
    async getCollection(collectionId) {
        const collection = await (0, api_1.readCollection)(collectionId, this.getConnection(), this.logger);
        return collection;
    }
    async getCollectionUsers(collectionId) {
        const collection = await (0, api_1.readCollectionUsers)(collectionId, this.getConnection(), this.logger);
        return collection;
    }
    async getAuditReport(apiId) {
        const ASSESSMENT_MAX_WAIT = 60000;
        const ASSESSMENT_RETRY = 1000;
        const start = Date.now();
        let now = Date.now();
        const last = this.apiLastAssessment.get(apiId) ?? new Date(0);
        while (now - start < ASSESSMENT_MAX_WAIT) {
            const api = await (0, api_1.readApi)(apiId, this.getConnection(), this.logger, false);
            const current = new Date(api.assessment.last);
            const ready = api.assessment.isProcessed && current.getTime() > last.getTime();
            if (ready) {
                const report = await (0, api_1.readAuditReport)(apiId, this.getConnection(), this.logger);
                return report;
            }
            await delay(ASSESSMENT_RETRY);
            now = Date.now();
        }
        throw new Error(`Timed out while waiting for the assessment report for API ID: ${apiId}`);
    }
    async getDataDictionaries() {
        const dictionaries = await (0, api_1.getDataDictionaries)(this.getConnection(), this.logger);
        dictionaries.push({
            id: "standard",
            name: "standard",
            description: "Default standard formats",
        });
        const result = [];
        for (const dictionary of dictionaries) {
            const formats = await (0, api_1.getDataDictionaryFormats)(dictionary.id, this.getConnection(), this.logger);
            result.push({
                id: dictionary.id,
                name: dictionary.name,
                description: dictionary.description,
                formats,
            });
        }
        return result;
    }
    async getDataDictionaryFormats() {
        if (!this.formats) {
            const dictionaries = await (0, api_1.getDataDictionaries)(this.getConnection(), this.logger);
            dictionaries.push({
                id: "standard",
                name: "standard",
                description: "Default standard formats",
            });
            const result = [];
            for (const dictionary of dictionaries) {
                const formats = await (0, api_1.getDataDictionaryFormats)(dictionary.id, this.getConnection(), this.logger);
                for (const format of Object.values(formats)) {
                    // entries from a standard dictionary do not have a o: prefix
                    if (dictionary.id === "standard") {
                        result.push({
                            id: `o:${format.name}`,
                            name: format.name,
                            description: format.description,
                            format: format,
                        });
                    }
                    else {
                        result.push({
                            id: `o:${dictionary.name}:${format.name}`,
                            name: `o:${dictionary.name}:${format.name}`,
                            description: format.description,
                            format: format,
                        });
                    }
                }
            }
            this.formats = result;
        }
        return this.formats;
    }
    async getTags() {
        const categories = await (0, api_1.getCategories)(this.getConnection(), this.logger);
        const tags = await (0, api_1.getTags)(this.getConnection(), this.logger);
        for (const tag of tags) {
            tag.onlyAdminCanTag = categories.some((category) => category.id === tag.categoryId && category.onlyAdminCanTag);
        }
        return tags;
    }
    async getTagsIdsFromApi(collectionId, apiId) {
        const resp = await (0, api_1.listApis)(collectionId, this.getConnection(), this.logger);
        const myApis = resp.list.filter((api) => api.desc.id === apiId);
        if (myApis.length === 0) {
            throw new Error(`The api "${apiId}" is not found. Please change the file api link.`);
        }
        const tags = myApis[0]?.tags;
        const tagIds = [];
        if (tags && tags.length > 0) {
            const allTags = await this.getTags();
            const adminTagIds = new Set(allTags.filter((tag) => tag.onlyAdminCanTag).map((tag) => tag.tagId));
            tags.forEach((tag) => {
                if (!adminTagIds.has(tag.tagId)) {
                    tagIds.push(tag.tagId);
                }
            });
        }
        return tagIds;
    }
    async getTagsForDocument(document, memento) {
        const mandatoryTags = getMandatoryTags(this.configuration);
        const tagDataEntry = getTagDataEntry(memento, document.uri.fsPath);
        if (tagDataEntry) {
            if (!Array.isArray(tagDataEntry)) {
                if (this.isConnected()) {
                    const platformApiTags = await this.getTagsFromApi(tagDataEntry.collectionId, tagDataEntry.apiId);
                    return Array.from(new Set([...mandatoryTags, ...platformApiTags]));
                }
                else {
                    return [];
                }
            }
            else {
                const tags = tagDataEntry.map((tag) => `${tag.categoryName}:${tag.tagName}`);
                return Array.from(new Set([...mandatoryTags, ...tags]));
            }
        }
        return mandatoryTags;
    }
    async getTagsFromApi(collectionId, apiId) {
        const resp = await (0, api_1.listApis)(collectionId, this.getConnection(), this.logger);
        const myApis = resp.list.filter((api) => api.desc.id === apiId);
        if (myApis.length === 0) {
            throw new Error(`The api "${apiId}" is not found. Please change the file api link.`);
        }
        const apiTags = myApis[0]?.tags;
        const tags = [];
        if (apiTags && apiTags.length > 0) {
            const allTags = await this.getTags();
            const adminTagIds = new Set(allTags.filter((tag) => tag.onlyAdminCanTag).map((tag) => tag.tagId));
            apiTags.forEach((tag) => {
                if (!adminTagIds.has(tag.tagId)) {
                    tags.push(`${tag.categoryName}:${tag.tagName}`);
                }
            });
        }
        return tags;
    }
    async refresh() {
        this.formats = undefined;
        if (this.hasCredentials()) {
            const { success } = await (0, api_1.testConnection)(this.getConnection(), this.logger);
            this.connected = success;
        }
        else {
            this.connected = false;
        }
    }
    async createDefaultScanConfig(apiId) {
        const configId = await (0, api_1.createDefaultScanConfig)(apiId, this.getConnection(), this.logger);
        return configId;
    }
    async readScanConfig(configId) {
        const config = await (0, api_1.readScanConfig)(configId, this.getConnection(), this.logger);
        return config;
    }
    async createScanConfig(apiId, name, config) {
        return (0, api_1.createScanConfig)(apiId, name, config, this.getConnection(), this.logger);
    }
    async createScanConfigNew(apiId, name, config) {
        return (0, api_1.createScanConfigNew)(apiId, name, config, this.getConnection(), this.logger);
    }
    async getScanConfigs(apiId) {
        const MAX_WAIT = 30000;
        const RETRY = 1000;
        const start = Date.now();
        const deadline = start + MAX_WAIT;
        while (Date.now() < deadline) {
            const configs = await (0, api_1.listScanConfigs)(apiId, this.getConnection(), this.logger);
            if (configs.length > 0) {
                return configs;
            }
            await delay(RETRY);
        }
        throw new Error(`Timed out while waiting for the scan config for API ID: ${apiId}`);
    }
    async listScanReports(apiId) {
        return (0, api_1.listScanReports)(apiId, this.getConnection(), this.logger);
    }
    async readScanReport(reportId) {
        return (0, api_1.readScanReport)(reportId, this.getConnection(), this.logger);
    }
    async readScanReportNew(reportId) {
        return (0, api_1.readScanReportNew)(reportId, this.getConnection(), this.logger);
    }
    async readTechnicalCollection(technicalName) {
        return (0, api_1.readTechnicalCollection)(technicalName, this.getConnection(), this.logger);
    }
    async createTechnicalCollection(technicalName, name) {
        return (0, api_1.createTechnicalCollection)(technicalName, name, this.getConnection(), this.logger);
    }
    async readAuditCompliance(taskId) {
        return (0, api_1.readAuditCompliance)(taskId, this.getConnection(), this.logger);
    }
    async readAuditReportSqgTodo(taskId) {
        return (0, api_1.readAuditReportSqgTodo)(taskId, this.getConnection(), this.logger);
    }
    async findOrCreateTempCollection() {
        this.logger.info("Finding or creating temporary collection");
        const namingConvention = await this.getCollectionNamingConvention();
        const collectionName = this.configuration.get("platformTemporaryCollectionName");
        if (namingConvention.pattern !== "" && !collectionName.match(namingConvention.pattern)) {
            throw new Error(`The temporary collection name does not match the expected pattern defined in your organization. Please change the temporary collection name in your settings.`);
        }
        if (!collectionName.match(platform_1.DefaultCollectionNamingPattern)) {
            throw new Error(`The temporary collection name does not match the expected pattern. Please change the temporary collection name in your settings.`);
        }
        const collections = await this.searchCollections(collectionName);
        // FIXME make sure that collection is owned by the user, for now take first accessible collection
        const writable = collections.list.filter((cl) => cl.read && cl.write && cl.writeApis && cl.deleteApis);
        if (writable.length > 0) {
            this.logger.info(`Using existing temporary collection: ${writable[0].id}`);
            return writable[0].id;
        }
        else {
            const collection = await this.createCollection(collectionName);
            this.logger.info(`Created new temporary collection: "${collectionName}" ${collection.desc.id}`);
            return collection.desc.id;
        }
    }
}
exports.PlatformStore = PlatformStore;
function getMandatoryTags(configuration) {
    const tags = [];
    const platformMandatoryTags = configuration.get("platformMandatoryTags");
    if (platformMandatoryTags !== "") {
        if (platformMandatoryTags.match(platform_1.TagRegex) !== null) {
            for (const tag of platformMandatoryTags.split(/[\s,]+/)) {
                if (tag !== "") {
                    tags.push(tag);
                }
            }
        }
        else {
            throw new Error(`The mandatory tags "${platformMandatoryTags}" do not match the expected pattern. Please change the mandatory tags in your settings.`);
        }
    }
    return tags;
}
function getMandatoryTagsIds(tags, platformTags) {
    const tagIds = [];
    for (const tag of tags) {
        const found = platformTags.filter((platformTag) => tag === `${platformTag.categoryName}:${platformTag.tagName}`);
        if (found.length > 0) {
            tagIds.push(found[0].tagId);
        }
        else {
            throw new Error(`The mandatory tag "${tag}" is not found. Please change the mandatory tags in your settings.`);
        }
    }
    return tagIds;
}
function getActiveTagsIds(tagEntries, platformTags) {
    const deadTags = [];
    const activeTagIds = new Set(platformTags.map((tag) => tag.tagId));
    for (const tagEntry of tagEntries) {
        if (!activeTagIds.has(tagEntry.tagId)) {
            deadTags.push(`${tagEntry.categoryName}: ${tagEntry.tagName}`);
        }
    }
    if (deadTags.length > 0) {
        throw new Error(`The following tags are not found: ${deadTags.join(", ")}. Please change the file tags.`);
    }
    return tagEntries.map((tagEntry) => tagEntry.tagId);
}
function getTagDataEntry(memento, filePath) {
    if (memento) {
        const tagData = memento.get(tags_1.TAGS_DATA_KEY, {});
        return tagData[filePath];
    }
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=platform-store.js.map