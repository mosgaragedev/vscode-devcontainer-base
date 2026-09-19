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
exports.runScanWithScandManager = runScanWithScandManager;
exports.replaceEnvOld = replaceEnvOld;
const managerApi = __importStar(require("../../api-scand-manager"));
async function runScanWithScandManager(envStore, scanEnv, config, logger, token) {
    logger.info(`Running API Conformance Scan using scand-manager`);
    const env = {};
    for (const [name, value] of Object.entries(scanEnv)) {
        env[name] = replaceEnvOld(value, await envStore.all());
    }
    let job = undefined;
    const services = config.platformServices.source === "auto"
        ? config.platformServices.auto
        : config.platformServices.manual;
    try {
        job = await managerApi.createJob(token, services, config.scanImage, env, config.scandManager, logger);
    }
    catch (ex) {
        return {
            message: `Failed to create scand-manager job: ${ex}`,
        };
    }
    logger.info(`Created scand-manager job: "${job.name}"`);
    if (job.status === "failed") {
        // TODO introduce settings whether delete failed jobs or not
        return {
            message: `Failed to create scand-manager job "${job.name}", received unexpected status: ${job.status}`,
        };
    }
    const error = await waitForScandJob(job.name, config.scandManager, logger);
    if (error) {
        return error;
    }
    // job has completed, remove it
    await managerApi.deleteJobStatus(job.name, config.scandManager, logger);
    return undefined;
}
async function waitForScandJob(name, manager, logger) {
    const maxDelay = manager.timeout * 1000;
    let currentDelay = 0;
    while (currentDelay < maxDelay) {
        const status = await managerApi.readJobStatus(name, manager, logger);
        // Status unknown may mean the job is not finished, keep waiting
        if (status.status === "succeeded") {
            return undefined;
        }
        else if (status.status === "failed") {
            const log = await managerApi.readJobLog(name, manager, logger);
            return { message: `Scand-manager job "${name}" has failed`, details: log };
        }
        logger.info(`Waiting for job: "${name}", status: "${status.status}"`);
        await delay(1000);
        currentDelay = currentDelay + 1000;
    }
    return { message: `Timed out waiting for scand-manager job "${name}" to finish` };
}
async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function replaceEnvOld(value, env) {
    const ENV_VAR_REGEX = /{{([\w\-$]+)}}/;
    const SECRETS_PREFIX = "secrets.";
    return value.replace(ENV_VAR_REGEX, (match, name) => {
        if (name.startsWith(SECRETS_PREFIX)) {
            const key = name.substring(SECRETS_PREFIX.length, name.length);
            return env.secrets.hasOwnProperty(key) ? env.secrets[key] : match;
        }
        return env.default.hasOwnProperty(name) ? env.default[name] : match;
    });
}
//# sourceMappingURL=scand-manager.js.map