"use strict";
/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJob = createJob;
exports.readJobStatus = readJobStatus;
exports.readJobLog = readJobLog;
exports.deleteJobStatus = deleteJobStatus;
exports.testConnection = testConnection;
const got_1 = __importDefault(require("got"));
async function createJob(token, platformService, scandImage, env, connection, logger) {
    const { body } = await (0, got_1.default)("api/job", {
        ...gotOptions("POST", connection, logger),
        json: {
            token,
            platformService,
            scandImage,
            env,
        },
    });
    return body;
}
async function readJobStatus(name, connection, logger) {
    const { body } = await (0, got_1.default)(`api/job/${name}`, gotOptions("GET", connection, logger));
    return body;
}
async function readJobLog(name, connection, logger) {
    try {
        const { body } = await (0, got_1.default)(`api/logs/${name}`, gotOptionsText("GET", connection, logger));
        return body;
    }
    catch (e) {
        return "" + e;
    }
}
async function deleteJobStatus(name, connection, logger) {
    const { body } = await (0, got_1.default)(`api/job/${name}`, gotOptions("DELETE", connection, logger));
    return body;
}
async function testConnection(connection, logger) {
    try {
        await (0, got_1.default)("api/job", {
            ...gotOptions("GET", connection, logger),
            timeout: {
                request: 5000,
            },
        });
        return { success: true };
    }
    catch (ex) {
        return { success: false, message: `${ex}` };
    }
}
function gotOptions(method, connection, logger) {
    const headers = makeHeaders(connection.header, true);
    return {
        method,
        prefixUrl: connection.url,
        responseType: "json",
        timeout: {
            request: 10000,
        },
        hooks: getHooks(method, logger),
        headers,
    };
}
function gotOptionsText(method, connection, logger) {
    const headers = makeHeaders(connection.header, false);
    return {
        method,
        prefixUrl: connection.url,
        responseType: "text",
        hooks: getHooks(method, logger),
        headers,
    };
}
function getHooks(method, logger) {
    const logRequest = (response, retryWithMergedOptions) => {
        logger.debug(`${method} ${response.url} ${response.statusCode}`);
        return response;
    };
    return {
        afterResponse: [logRequest],
    };
}
function makeHeaders(header, isJsonResponseType) {
    const headers = {};
    if (header && header.name && header.value) {
        headers[header.name] = header.value;
    }
    if (isJsonResponseType) {
        headers["Accept"] = "application/json";
    }
    return headers;
}
//# sourceMappingURL=api-scand-manager.js.map