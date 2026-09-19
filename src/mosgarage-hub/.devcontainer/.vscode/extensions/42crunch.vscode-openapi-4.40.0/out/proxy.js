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
exports.createProxyAgentsAndCerts = createProxyAgentsAndCerts;
exports.getProxyEnv = getProxyEnv;
const url_1 = require("url");
const vscode = __importStar(require("vscode"));
const proxyAgentModule = loadProxyAgent();
const pacProxyAgentModule = loadPacProxyAgent();
function loadProxyAgent() {
    const moduleName = "@vscode/proxy-agent";
    const appRoot = vscode.env.appRoot;
    try {
        return require(`${appRoot}/node_modules.asar/${moduleName}`);
    }
    catch (err) {
        // Not in ASAR.
    }
    try {
        return require(`${appRoot}/node_modules/${moduleName}`);
    }
    catch (err) {
        // Not available.
    }
    return undefined;
}
function loadPacProxyAgent() {
    const moduleName = "@vscode/proxy-agent";
    const appRoot = vscode.env.appRoot;
    try {
        return require(`${appRoot}/node_modules.asar/${moduleName}/out/agent.js`);
    }
    catch (err) {
        // Not in ASAR.
    }
    try {
        return require(`${appRoot}/node_modules/${moduleName}/out/agent.js`);
    }
    catch (err) {
        // Not available.
    }
    return undefined;
}
async function getProxyURL(targetUrl) {
    if (proxyAgentModule && proxyAgentModule.resolveProxyURL) {
        return await proxyAgentModule.resolveProxyURL(targetUrl);
    }
}
async function createProxyAgentsAndCerts(proxy) {
    if (proxy &&
        proxy.trim() !== "" &&
        pacProxyAgentModule &&
        pacProxyAgentModule.createPacProxyAgent &&
        proxyAgentModule.loadSystemCertificates) {
        const resolver = () => {
            const parsed = url_1.URL.parse(proxy);
            if (parsed !== null) {
                if (parsed.protocol === "https:") {
                    return `HTTPS ${parsed.hostname}:${parsed.port}`;
                }
                else {
                    return `HTTP ${parsed.hostname}:${parsed.port}`;
                }
            }
        };
        const certs = await proxyAgentModule.loadSystemCertificates({ log: vsLogSink });
        const httpsAgent = pacProxyAgentModule.createPacProxyAgent(resolver, 
        //      { secureEndpoint: true },
        async (opts) => {
            opts.ca = certs;
        });
        const httpAgent = pacProxyAgentModule.createPacProxyAgent(resolver);
        return {
            agents: {
                http: httpAgent,
                https: httpsAgent,
            },
            certs,
        };
    }
}
async function getProxyEnv(backendUrl, apiUrl, config, logger) {
    const env = {};
    const proxy = await getProxyURL(backendUrl);
    if (proxy) {
        env["HTTPS_PROXY"] = proxy;
        env["HTTP_PROXY"] = proxy;
        logger.debug(`Set HTTPS_PROXY and HTTP_PROXY environment variables to: ${proxy}`);
    }
    if (apiUrl !== undefined) {
        const scanProxy = config.scanProxy.trim();
        if (scanProxy !== "") {
            env["HTTP_PROXY_API"] = scanProxy;
            env["HTTPS_PROXY_API"] = scanProxy;
            logger.debug(`Set HTTPS_PROXY_API and HTTP_PROXY_API environment variables using 'API Scan proxy' setting to: ${scanProxy}`);
        }
        else {
            const apiProxy = await getProxyURL(apiUrl);
            if (apiProxy) {
                env["HTTP_PROXY_API"] = apiProxy;
                env["HTTPS_PROXY_API"] = apiProxy;
                logger.debug(`Set HTTPS_PROXY_API and HTTP_PROXY_API environment variables to: ${apiProxy}`);
            }
            else {
                const parsedApiUrl = url_1.URL.parse(apiUrl);
                if (parsedApiUrl !== null && parsedApiUrl.hostname) {
                    env["NO_PROXY"] = parsedApiUrl.hostname;
                    logger.debug(`Setting NO_PROXY for API host: ${parsedApiUrl.hostname}`);
                }
            }
        }
    }
    return env;
}
const vsLogSink = {
    trace: () => { },
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
};
//# sourceMappingURL=proxy.js.map