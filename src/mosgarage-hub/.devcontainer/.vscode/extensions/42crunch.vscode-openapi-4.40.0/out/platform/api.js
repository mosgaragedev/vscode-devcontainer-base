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
exports.listCollections = listCollections;
exports.searchCollections = searchCollections;
exports.listApis = listApis;
exports.readApi = readApi;
exports.readCollection = readCollection;
exports.readCollectionUsers = readCollectionUsers;
exports.readAuditReport = readAuditReport;
exports.deleteApi = deleteApi;
exports.createApi = createApi;
exports.updateApi = updateApi;
exports.collectionUpdate = collectionUpdate;
exports.createCollection = createCollection;
exports.deleteCollection = deleteCollection;
exports.getApiNamingConvention = getApiNamingConvention;
exports.getCollectionNamingConvention = getCollectionNamingConvention;
exports.getDataDictionaries = getDataDictionaries;
exports.getDataDictionaryFormats = getDataDictionaryFormats;
exports.getTags = getTags;
exports.getCategories = getCategories;
exports.createDefaultScanConfig = createDefaultScanConfig;
exports.listScanConfigs = listScanConfigs;
exports.readScanConfig = readScanConfig;
exports.createScanConfig = createScanConfig;
exports.createScanConfigNew = createScanConfigNew;
exports.listScanReports = listScanReports;
exports.readScanReport = readScanReport;
exports.readScanReportNew = readScanReportNew;
exports.readTechnicalCollection = readTechnicalCollection;
exports.createTechnicalCollection = createTechnicalCollection;
exports.testConnection = testConnection;
exports.readAuditCompliance = readAuditCompliance;
exports.readAuditReportSqgTodo = readAuditReportSqgTodo;
const got_1 = __importStar(require("got"));
function gotOptions(method, options, logger) {
    const logRequest = (response, retryWithMergedOptions) => {
        logger.debug(`${method} ${response.url} ${response.statusCode}`);
        return response;
    };
    return {
        method,
        prefixUrl: options.platformUrl,
        responseType: "json",
        headers: {
            Accept: "application/json",
            "X-API-KEY": options.apiToken,
            "X-42C-IDE": "true",
        },
        hooks: {
            afterResponse: [logRequest],
        },
        retry: {
            errorCodes: [
                "ENOMEM",
                "ETIMEDOUT",
                "ECONNRESET",
                "EADDRINUSE",
                "ECONNREFUSED",
                "EPIPE",
                "ENOTFOUND",
                "ENETUNREACH",
                "EAI_AGAIN",
            ],
        },
    };
}
async function listCollections(filter, options, logger) {
    try {
        const listOption = filter?.owner ?? "ALL";
        const { body } = await (0, got_1.default)(`api/v2/collections?listOption=${listOption}&perPage=0`, gotOptions("GET", options, logger));
        return body;
    }
    catch (ex) {
        throw new Error("Unable to list collections, please check your 42Crunch credentials: " + ex.message);
    }
}
async function searchCollections(collectionName, options, logger) {
    const params = { collectionName };
    const { body } = await (0, got_1.default)(`api/v1/search/collections`, {
        ...gotOptions("GET", options, logger),
        searchParams: params,
    });
    return body;
}
async function listApis(collectionId, options, logger) {
    const { body } = await (0, got_1.default)(`api/v2/collections/${collectionId}/apis?withTags=true&perPage=0`, gotOptions("GET", options, logger));
    return body;
}
async function readApi(apiId, options, logger, specfile) {
    const params = specfile ? { specfile: "true" } : {};
    const { body } = await (0, got_1.default)(`api/v1/apis/${apiId}`, {
        ...gotOptions("GET", options, logger),
        searchParams: params,
    });
    return body;
}
async function readCollection(collectionId, options, logger) {
    const { body } = (await (0, got_1.default)(`api/v1/collections/${collectionId}?readOwner=true`, gotOptions("GET", options, logger)));
    return body;
}
async function readCollectionUsers(collectionId, options, logger) {
    const { body } = (await (0, got_1.default)(`api/v1/collections/${collectionId}/users`, gotOptions("GET", options, logger)));
    return body;
}
async function readAuditReport(apiId, options, logger) {
    const { body } = (await (0, got_1.default)(`api/v1/apis/${apiId}/assessmentreport`, gotOptions("GET", options, logger)));
    const text = Buffer.from(body.data, "base64").toString("utf-8");
    const data = JSON.parse(text);
    return { tid: body.tid, data };
}
async function deleteApi(apiId, options, logger) {
    await (0, got_1.default)(`api/v1/apis/${apiId}`, gotOptions("DELETE", options, logger));
}
async function createApi(collectionId, name, tags, contents, options, logger) {
    const { body } = await (0, got_1.default)("api/v2/apis", {
        ...gotOptions("POST", options, logger),
        json: {
            cid: collectionId,
            tags,
            name,
            specfile: contents.toString("base64"),
        },
    });
    return body;
}
async function updateApi(apiId, update, options, logger) {
    const json = {};
    if (update.specfile) {
        json.specfile = update.specfile.toString("base64");
    }
    if (update.name) {
        json.name = update.name;
    }
    const { body } = await (0, got_1.default)(`api/v1/apis/${apiId}`, {
        ...gotOptions("PUT", options, logger),
        json,
    });
    return body;
}
async function collectionUpdate(collectionId, name, options, logger) {
    const { body } = await (0, got_1.default)(`api/v1/collections/${collectionId}`, {
        ...gotOptions("PUT", options, logger),
        json: { name },
    });
    return body;
}
async function createCollection(name, options, logger) {
    const { body } = await (0, got_1.default)("api/v1/collections", {
        ...gotOptions("POST", options, logger),
        json: {
            name: name,
        },
    });
    return body;
}
async function deleteCollection(collectionId, options, logger) {
    await (0, got_1.default)(`api/v1/collections/${collectionId}`, gotOptions("DELETE", options, logger));
}
async function getApiNamingConvention(options, logger) {
    const { body } = await (0, got_1.default)(`api/v1/organizations/me/settings/apiNamingConvention`, gotOptions("GET", options, logger));
    return body;
}
async function getCollectionNamingConvention(options, logger) {
    const { body } = await (0, got_1.default)("api/v1/organizations/me/settings/collectionNamingConvention", gotOptions("GET", options, logger));
    return body;
}
async function getDataDictionaries(options, logger) {
    const { body: { list }, } = await (0, got_1.default)("api/v2/dataDictionaries", gotOptions("GET", options, logger));
    return (list == null ? [] : list);
}
async function getDataDictionaryFormats(dictionaryId, options, logger) {
    const { body: { formats }, } = await (0, got_1.default)(`api/v2/dataDictionaries/${dictionaryId}/formats`, gotOptions("GET", options, logger));
    if (formats === null) {
        return {};
    }
    const stringProps = ["maxLength", "minLength"];
    const integerProps = ["minimum", "maximum", "default", "example"];
    for (const value of Object.values(formats)) {
        const type = value["type"];
        let props = [];
        if (type === "integer") {
            props = integerProps;
        }
        else if (type === "string") {
            props = stringProps;
        }
        // drop empty default values
        if (value["default"] === "") {
            delete value["default"];
        }
        for (const prop of props) {
            if (value.hasOwnProperty(prop)) {
                value[prop] = parseInt(value[prop], 10);
            }
        }
    }
    return formats;
}
async function getTags(options, logger) {
    const { body } = await (0, got_1.default)(`api/v2/tags`, gotOptions("GET", options, logger));
    return body.list;
}
async function getCategories(options, logger) {
    const { body } = await (0, got_1.default)(`api/v2/categories`, gotOptions("GET", options, logger));
    return body.list;
}
async function createDefaultScanConfig(apiId, options, logger) {
    const { body } = await (0, got_1.default)(`api/v2/apis/${apiId}/scanConfigurations/default`, {
        ...gotOptions("POST", options, logger),
        json: {
            name: "default",
        },
    });
    return body.id;
}
async function listScanConfigs(apiId, options, logger) {
    const { body } = await (0, got_1.default)(`api/v2/apis/${apiId}/scanConfigurations`, {
        ...gotOptions("GET", options, logger),
    });
    return body.list;
}
async function readScanConfig(configId, options, logger) {
    const { body } = await (0, got_1.default)(`api/v2/scanConfigurations/${configId}`, {
        ...gotOptions("GET", options, logger),
    });
    return body;
}
async function createScanConfig(apiId, name, config, options, logger) {
    const scanConfiguration = Buffer.from(JSON.stringify(config)).toString("base64");
    const { body } = await (0, got_1.default)(`api/v2/apis/${apiId}/scanConfigurations`, {
        ...gotOptions("POST", options, logger),
        json: {
            name,
            scanConfiguration,
        },
    });
    return body.id;
}
async function createScanConfigNew(apiId, name, config, options, logger) {
    const scanConfiguration = Buffer.from(config).toString("base64");
    const { body } = await (0, got_1.default)(`api/v2/apis/${apiId}/scanConfigurations`, {
        ...gotOptions("POST", options, logger),
        json: {
            name,
            file: scanConfiguration,
        },
    });
    return body.id;
}
async function listScanReports(apiId, options, logger) {
    const { body } = await (0, got_1.default)(`api/v2/apis/${apiId}/scanReports`, {
        ...gotOptions("GET", options, logger),
    });
    return body.list;
}
async function readScanReport(reportId, options, logger) {
    const { body } = await (0, got_1.default)(`api/v2/scanReports/${reportId}`, {
        ...gotOptions("GET", options, logger),
    });
    return body.data;
}
async function readScanReportNew(reportId, options, logger) {
    const { body } = await (0, got_1.default)(`api/v2/scanReports/${reportId}`, {
        ...gotOptions("GET", options, logger),
    });
    return body.file;
}
async function readTechnicalCollection(technicalName, options, logger) {
    try {
        const response = await (0, got_1.default)(`api/v1/collections/technicalName`, {
            ...gotOptions("POST", options, logger),
            json: { technicalName },
        });
        const body = response.body;
        return body.id;
    }
    catch (err) {
        if (err instanceof got_1.HTTPError && err?.response?.statusCode === 404) {
            return null;
        }
        throw err;
    }
}
async function createTechnicalCollection(technicalName, name, options, logger) {
    const { body } = await (0, got_1.default)("api/v1/collections", {
        ...gotOptions("POST", options, logger),
        json: {
            technicalName: technicalName,
            name: name,
            source: "default",
        },
    });
    return body.desc.id;
}
async function testConnection(options, logger) {
    logger.info("Starting connection test to: " + options.platformUrl);
    try {
        await (0, got_1.default)("api/v2/collections?page=1&perPage=1", {
            ...gotOptions("GET", options, logger),
            timeout: {
                request: 5000,
            },
        });
        logger.info("Connection test successful.");
        return { success: true };
    }
    catch (ex) {
        logger.error("Connection test failed: " + ex);
        return { success: false, message: `${ex}` };
    }
}
async function readAuditCompliance(taskId, options, logger) {
    const { body } = (await (0, got_1.default)(`api/v2/sqgs/audit/reportComplianceStatus/${taskId}?readSqg=true&readReport=false`, {
        ...gotOptions("GET", options, logger),
    }));
    return body;
}
async function readAuditReportSqgTodo(taskId, options, logger) {
    const { body } = (await (0, got_1.default)(`api/v2/sqgs/audit/todo/${taskId}`, gotOptions("GET", options, logger)));
    const text = Buffer.from(body.data, "base64").toString("utf-8");
    const data = JSON.parse(text);
    return { tid: body.tid, data };
}
//# sourceMappingURL=api.js.map