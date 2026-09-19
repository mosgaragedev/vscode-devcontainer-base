"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Nathan Rajlich, Félicien François, Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
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
exports.testCertificates = exports.LogLevel = void 0;
exports.createProxyResolver = createProxyResolver;
exports.createHttpPatch = createHttpPatch;
exports.createNetPatch = createNetPatch;
exports.createTlsPatch = createTlsPatch;
exports.createFetchPatch = createFetchPatch;
exports.patchUndici = patchUndici;
exports.getOrLoadAdditionalCertificates = getOrLoadAdditionalCertificates;
exports.loadSystemCertificates = loadSystemCertificates;
exports.resetCaches = resetCaches;
exports.toLogString = toLogString;
const net = __importStar(require("net"));
const tls = __importStar(require("tls"));
const nodeurl = __importStar(require("url"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const cp = __importStar(require("child_process"));
const crypto = __importStar(require("crypto"));
const undici = __importStar(require("undici"));
const agent_1 = require("./agent");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Trace"] = 0] = "Trace";
    LogLevel[LogLevel["Debug"] = 1] = "Debug";
    LogLevel[LogLevel["Info"] = 2] = "Info";
    LogLevel[LogLevel["Warning"] = 3] = "Warning";
    LogLevel[LogLevel["Error"] = 4] = "Error";
    LogLevel[LogLevel["Critical"] = 5] = "Critical";
    LogLevel[LogLevel["Off"] = 6] = "Off";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
const maxCacheEntries = 5000; // Cache can grow twice that much due to 'oldCache'.
function createProxyResolver(params) {
    const { getProxyURL, log, proxyResolveTelemetry: proxyResolverTelemetry, env } = params;
    let envProxy = proxyFromConfigURL(env.https_proxy || env.HTTPS_PROXY || env.http_proxy || env.HTTP_PROXY); // Not standardized.
    let envNoProxy = noProxyFromEnv(env.no_proxy || env.NO_PROXY); // Not standardized.
    let cacheRolls = 0;
    let oldCache = new Map();
    let cache = new Map();
    let lastNetworkInterfacesCheck = 0;
    let lastNetworkInterfacesSnapshot;
    function checkAndFlushCacheIfNetworkChanged() {
        const intervalMs = params.getNetworkInterfaceCheckInterval?.() ?? -1;
        if (intervalMs < 0) {
            return;
        }
        const now = Date.now();
        if (now - lastNetworkInterfacesCheck >= intervalMs) {
            lastNetworkInterfacesCheck = now;
            const currentSnapshot = JSON.stringify(os.networkInterfaces());
            if (lastNetworkInterfacesSnapshot) {
                if (lastNetworkInterfacesSnapshot !== currentSnapshot) {
                    log.debug("ProxyResolver#getCachedProxy network interfaces changed, flushing cache");
                    cache.clear();
                    oldCache.clear();
                }
                else {
                    log.debug("ProxyResolver#getCachedProxy network interfaces unchanged");
                }
            }
            lastNetworkInterfacesSnapshot = currentSnapshot;
        }
    }
    function getCacheKey(url) {
        // Expecting proxies to usually be the same per scheme://host:port. Assuming that for performance.
        return nodeurl.format({
            ...url,
            ...{ pathname: undefined, search: undefined, hash: undefined },
        });
    }
    function getCachedProxy(key) {
        checkAndFlushCacheIfNetworkChanged();
        let proxy = cache.get(key);
        if (proxy) {
            return proxy;
        }
        proxy = oldCache.get(key);
        if (proxy) {
            oldCache.delete(key);
            cacheProxy(key, proxy);
        }
        return proxy;
    }
    function cacheProxy(key, proxy) {
        cache.set(key, proxy);
        if (cache.size >= maxCacheEntries) {
            oldCache = cache;
            cache = new Map();
            cacheRolls++;
            log.debug("ProxyResolver#cacheProxy cacheRolls", cacheRolls);
        }
    }
    let timeout;
    let count = 0;
    let duration = 0;
    let errorCount = 0;
    let cacheCount = 0;
    let envCount = 0;
    let settingsCount = 0;
    let localhostCount = 0;
    let envNoProxyCount = 0;
    let configNoProxyCount = 0;
    let results = [];
    function logEvent() {
        timeout = undefined;
        proxyResolverTelemetry({
            count,
            duration,
            errorCount,
            cacheCount,
            cacheSize: cache.size,
            cacheRolls,
            envCount,
            settingsCount,
            localhostCount,
            envNoProxyCount,
            configNoProxyCount,
            results,
        });
        count =
            duration =
                errorCount =
                    cacheCount =
                        envCount =
                            settingsCount =
                                localhostCount =
                                    envNoProxyCount =
                                        configNoProxyCount =
                                            0;
        results = [];
    }
    function resolveProxyWithRequest(flags, req, opts, url, callback) {
        if (!timeout) {
            timeout = setTimeout(logEvent, 10 * 60 * 1000);
        }
        const stackText = ""; // getLogLevel() === LogLevel.Trace ? '\n' + new Error('Error for stack trace').stack : '';
        addCertificatesToOptionsV1(params, flags.addCertificatesV1, opts, () => {
            if (!flags.useProxySettings) {
                callback("DIRECT");
                return;
            }
            useProxySettings(url, req, stackText, callback);
        });
    }
    function useProxySettings(url, req, stackText, callback) {
        const parsedUrl = nodeurl.parse(url); // Coming from Node's URL, sticking with that.
        const hostname = parsedUrl.hostname;
        if (hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname === "::1" ||
            hostname === "::ffff:127.0.0.1") {
            localhostCount++;
            callback("DIRECT");
            log.debug("ProxyResolver#resolveProxy localhost", url, "DIRECT", stackText);
            return;
        }
        const secureEndpoint = parsedUrl.protocol === "https:";
        const defaultPort = secureEndpoint ? 443 : 80;
        // if there are any config entries present then env variables are ignored
        let noProxyConfig = params.getNoProxyConfig ? params.getNoProxyConfig() : [];
        if (noProxyConfig.length) {
            let configNoProxy = noProxyFromConfig(noProxyConfig); // Not standardized.
            if (typeof hostname === "string" &&
                configNoProxy(hostname, String(parsedUrl.port || defaultPort))) {
                configNoProxyCount++;
                callback("DIRECT");
                log.debug("ProxyResolver#resolveProxy configNoProxy", url, "DIRECT", stackText);
                return;
            }
        }
        else {
            if (typeof hostname === "string" &&
                envNoProxy(hostname, String(parsedUrl.port || defaultPort))) {
                envNoProxyCount++;
                callback("DIRECT");
                log.debug("ProxyResolver#resolveProxy envNoProxy", url, "DIRECT", stackText);
                return;
            }
        }
        let settingsProxy = proxyFromConfigURL(getProxyURL());
        if (settingsProxy) {
            settingsCount++;
            callback(settingsProxy);
            log.debug("ProxyResolver#resolveProxy settings", url, settingsProxy, stackText);
            return;
        }
        if (envProxy) {
            envCount++;
            callback(envProxy);
            log.debug("ProxyResolver#resolveProxy env", url, envProxy, stackText);
            return;
        }
        if (!params.isUseHostProxyEnabled()) {
            callback("DIRECT");
            log.debug("ProxyResolver#resolveProxy unconfigured", url, "DIRECT", stackText);
            return;
        }
        const key = getCacheKey(parsedUrl);
        const proxy = getCachedProxy(key);
        if (proxy) {
            cacheCount++;
            if (req) {
                collectResult(results, proxy, secureEndpoint ? "HTTPS" : "HTTP", req);
            }
            callback(proxy);
            log.debug("ProxyResolver#resolveProxy cached", url, proxy, stackText);
            return;
        }
        const start = Date.now();
        params
            .resolveProxy(url) // Use full URL to ensure it is an actually used one.
            .then((proxy) => {
            if (proxy) {
                cacheProxy(key, proxy);
                if (req) {
                    collectResult(results, proxy, secureEndpoint ? "HTTPS" : "HTTP", req);
                }
            }
            callback(proxy);
            log.debug("ProxyResolver#resolveProxy", url, proxy, stackText);
        })
            .then(() => {
            count++;
            duration = Date.now() - start + duration;
        }, (err) => {
            errorCount++;
            const fallback = cache.values().next().value; // fall back to any proxy (https://github.com/microsoft/vscode/issues/122825)
            callback(fallback);
            log.error("ProxyResolver#resolveProxy", fallback, toErrorMessage(err), stackText);
        });
    }
    return {
        resolveProxyWithRequest,
        resolveProxyURL: (url) => new Promise((resolve, reject) => {
            useProxySettings(url, undefined, "", (result) => {
                try {
                    resolve((0, agent_1.getProxyURLFromResolverResult)(result).url);
                }
                catch (err) {
                    reject(err);
                }
            });
        }),
    };
}
function collectResult(results, resolveProxy, connection, req) {
    const proxy = resolveProxy ? String(resolveProxy).trim().split(/\s+/, 1)[0] : "EMPTY";
    req.on("response", (res) => {
        const code = `HTTP_${res.statusCode}`;
        const result = findOrCreateResult(results, proxy, connection, code);
        result.count++;
    });
    req.on("error", (err) => {
        const code = (err && typeof err.code === "string" && err.code) || "UNKNOWN_ERROR";
        const result = findOrCreateResult(results, proxy, connection, code);
        result.count++;
    });
}
function findOrCreateResult(results, proxy, connection, code) {
    for (const result of results) {
        if (result.proxy === proxy && result.connection === connection && result.code === code) {
            return result;
        }
    }
    const result = { proxy, connection, code, count: 0 };
    results.push(result);
    return result;
}
function proxyFromConfigURL(configURL) {
    if (!configURL) {
        return undefined;
    }
    const url = (configURL || "").trim();
    const i = url.indexOf("://");
    if (i === -1) {
        return undefined;
    }
    const scheme = url.substr(0, i).toLowerCase();
    const proxy = url.substr(i + 3);
    if (scheme === "http") {
        return "PROXY " + proxy;
    }
    else if (scheme === "https") {
        return "HTTPS " + proxy;
    }
    else if (scheme === "socks" || scheme === "socks5" || scheme === "socks5h") {
        return "SOCKS " + proxy;
    }
    else if (scheme === "socks4" || scheme === "socks4a") {
        return "SOCKS4 " + proxy;
    }
    return undefined;
}
function shouldBypassProxy(value) {
    if (value.includes("*")) {
        return () => true;
    }
    const filters = value
        .map((s) => s.trim().split(":", 2))
        .map(([name, port]) => ({ name, port }))
        .filter((filter) => !!filter.name)
        .map(({ name, port }) => {
        const domain = name[0] === "." ? name : `.${name}`;
        return { domain, port };
    });
    if (!filters.length) {
        return () => false;
    }
    return (hostname, port) => filters.some(({ domain, port: filterPort }) => {
        return `.${hostname.toLowerCase()}`.endsWith(domain) && (!filterPort || port === filterPort);
    });
}
function noProxyFromEnv(envValue) {
    const value = (envValue || "").trim().toLowerCase().split(",");
    return shouldBypassProxy(value);
}
function noProxyFromConfig(noProxy) {
    const value = noProxy.map((item) => item.trim().toLowerCase());
    return shouldBypassProxy(value);
}
function createHttpPatch(params, originals, resolveProxy) {
    return {
        get: patch(originals.get),
        request: patch(originals.request),
    };
    function patch(original) {
        function patched(url, options, callback) {
            if (typeof url !== "string" && !(url && url.searchParams)) {
                callback = options;
                options = url;
                url = null;
            }
            if (typeof options === "function") {
                callback = options;
                options = null;
            }
            options = options || {};
            if (options.socketPath) {
                return original.apply(null, arguments);
            }
            const originalAgent = options.agent;
            if (originalAgent === true) {
                throw new Error("Unexpected agent option: true");
            }
            const isHttps = originals.globalAgent.protocol === "https:";
            const optionsPatched = originalAgent instanceof agent_1.PacProxyAgent;
            const config = params.getProxySupport();
            const useProxySettings = !optionsPatched &&
                (config === "override" ||
                    config === "fallback" ||
                    (config === "on" && originalAgent === undefined));
            // If Agent.options.ca is set to undefined, it overwrites RequestOptions.ca.
            const originalOptionsCa = isHttps ? options.ca : undefined;
            const originalAgentCa = isHttps &&
                originalAgent instanceof originals.Agent &&
                originalAgent.options &&
                "ca" in originalAgent.options &&
                originalAgent.options.ca;
            const originalCa = originalAgentCa !== false ? originalAgentCa : originalOptionsCa;
            const addCertificatesV1 = !optionsPatched && params.addCertificatesV1() && isHttps && !originalCa;
            if (useProxySettings || addCertificatesV1) {
                if (url) {
                    const parsed = typeof url === "string" ? new nodeurl.URL(url) : url;
                    const urlOptions = {
                        protocol: parsed.protocol,
                        hostname: parsed.hostname.lastIndexOf("[", 0) === 0
                            ? parsed.hostname.slice(1, -1)
                            : parsed.hostname,
                        port: parsed.port,
                        path: `${parsed.pathname}${parsed.search}`,
                    };
                    if (parsed.username || parsed.password) {
                        options.auth = `${parsed.username}:${parsed.password}`;
                    }
                    options = { ...urlOptions, ...options };
                }
                else {
                    options = { ...options };
                }
                const resolveP = (req, opts, url) => new Promise((resolve) => resolveProxy({ useProxySettings, addCertificatesV1 }, req, opts, url, resolve));
                const host = options.hostname || options.host;
                const isLocalhost = !host || host === "localhost" || host === "127.0.0.1"; // Avoiding https://github.com/microsoft/vscode/issues/120354
                const agent = (0, agent_1.createPacProxyAgent)(resolveP, {
                    originalAgent: !useProxySettings || isLocalhost || config === "fallback" ? originalAgent : undefined,
                    lookupProxyAuthorization: params.lookupProxyAuthorization,
                    // keepAlive: ((originalAgent || originals.globalAgent) as { keepAlive?: boolean }).keepAlive, // Skipping due to https://github.com/microsoft/vscode/issues/228872.
                    _vscodeTestReplaceCaCerts: options
                        ._vscodeTestReplaceCaCerts,
                }, (opts) => new Promise((resolve) => addCertificatesToOptionsV1(params, params.addCertificatesV1(), opts, resolve)));
                agent.protocol = isHttps ? "https:" : "http:";
                options.agent = agent;
                if (isHttps) {
                    options.ca = originalCa;
                }
                return original(options, callback);
            }
            return original.apply(null, arguments);
        }
        return patched;
    }
}
function createNetPatch(params, originals) {
    return {
        connect: patchNetConnect(params, originals.connect),
    };
}
function patchNetConnect(params, original) {
    function connect(...args) {
        if (params.getLogLevel() === LogLevel.Trace) {
            params.log.trace("ProxyResolver#net.connect", toLogString(args));
        }
        if (!params.addCertificatesV2()) {
            return original.apply(null, arguments);
        }
        const socket = new net.Socket();
        socket.connecting = true;
        getOrLoadAdditionalCertificates(params)
            .then(() => {
            const options = args.find((arg) => arg && typeof arg === "object");
            if (options?.timeout) {
                socket.setTimeout(options.timeout);
            }
            socket.connect.apply(socket, arguments);
        })
            .catch((err) => {
            params.log.error("ProxyResolver#net.connect", toErrorMessage(err));
        });
        return socket;
    }
    return connect;
}
function createTlsPatch(params, originals) {
    return {
        connect: patchTlsConnect(params, originals.connect),
        createSecureContext: patchCreateSecureContext(originals.createSecureContext),
    };
}
function patchTlsConnect(params, original) {
    function connect(...args) {
        if (params.getLogLevel() === LogLevel.Trace) {
            params.log.trace("ProxyResolver#tls.connect", toLogString(args));
        }
        let options = args.find((arg) => arg && typeof arg === "object");
        if (!params.addCertificatesV2() || options?.ca) {
            return original.apply(null, arguments);
        }
        let secureConnectListener = args.find((arg) => typeof arg === "function");
        if (!options) {
            options = {};
            const listenerIndex = args.findIndex((arg) => typeof arg === "function");
            if (listenerIndex !== -1) {
                args[listenerIndex - 1] = options;
            }
            else {
                args[2] = options;
            }
        }
        else {
            options = {
                ...options,
            };
        }
        const port = typeof args[0] === "number"
            ? args[0]
            : typeof args[0] === "string" && !isNaN(Number(args[0]))
                ? Number(args[0]) // E.g., http2 module passes port as string.
                : options.port;
        const host = typeof args[1] === "string" ? args[1] : options.host;
        let tlsSocket;
        if (options.socket) {
            if (!options.secureContext) {
                options.secureContext = tls.createSecureContext(options);
            }
            if (!_certificates) {
                params.log.trace("ProxyResolver#tls.connect waiting for existing socket connect");
                options.socket.once("connect", () => {
                    params.log.trace("ProxyResolver#tls.connect got existing socket connect - adding certs");
                    for (const cert of _certificates || []) {
                        options.secureContext.context.addCACert(cert);
                    }
                });
            }
            else {
                params.log.trace("ProxyResolver#tls.connect existing socket already connected - adding certs");
                for (const cert of _certificates) {
                    options.secureContext.context.addCACert(cert);
                }
            }
        }
        else {
            if (!options.secureContext) {
                options.secureContext = tls.createSecureContext(options);
            }
            params.log.trace("ProxyResolver#tls.connect creating unconnected socket");
            const socket = (options.socket = new net.Socket());
            socket.connecting = true;
            getOrLoadAdditionalCertificates(params)
                .then((caCertificates) => {
                params.log.trace("ProxyResolver#tls.connect adding certs before connecting socket");
                for (const cert of caCertificates) {
                    options.secureContext.context.addCACert(cert);
                }
                if (options?.timeout) {
                    socket.setTimeout(options.timeout);
                    socket.once("timeout", () => {
                        tlsSocket.emit("timeout");
                    });
                }
                socket.connect({
                    port: port,
                    host,
                    ...options,
                });
            })
                .catch((err) => {
                params.log.error("ProxyResolver#tls.connect", toErrorMessage(err));
            });
        }
        if (typeof args[1] === "string") {
            tlsSocket = original(port, host, options, secureConnectListener);
        }
        else if (typeof args[0] === "number" ||
            (typeof args[0] === "string" && !isNaN(Number(args[0])))) {
            tlsSocket = original(port, options, secureConnectListener);
        }
        else {
            tlsSocket = original(options, secureConnectListener);
        }
        return tlsSocket;
    }
    return connect;
}
function patchCreateSecureContext(original) {
    return function (details) {
        const context = original.apply(null, arguments);
        const certs = details?._vscodeAdditionalCaCerts;
        if (certs) {
            for (const cert of certs) {
                context.context.addCACert(cert);
            }
        }
        return context;
    };
}
function createFetchPatch(params, originalFetch, resolveProxyURL) {
    return async function patchedFetch(input, init) {
        if (!params.isAdditionalFetchSupportEnabled()) {
            return originalFetch(input, init);
        }
        const agentOptions = getAgentOptions(init);
        if (agentOptions.socketPath) {
            return originalFetch(input, init);
        }
        const proxySupport = params.getProxySupport();
        const doResolveProxy = proxySupport === "override" ||
            proxySupport === "fallback" ||
            (proxySupport === "on" && init?.dispatcher === undefined);
        const addCerts = params.addCertificatesV1() || params.addCertificatesV2(); // There is no v2 for `fetch`, checking both settings.
        if (!doResolveProxy && !addCerts) {
            return originalFetch(input, init);
        }
        const urlString = typeof input === "string" ? input : "cache" in input ? input.url : input.toString();
        const proxyURL = doResolveProxy ? await resolveProxyURL(urlString) : undefined;
        if (!proxyURL && !addCerts) {
            return originalFetch(input, init);
        }
        const systemCA = addCerts
            ? [...tls.rootCertificates, ...(await getOrLoadAdditionalCertificates(params))]
            : undefined;
        const { allowH2 } = agentOptions;
        const requestCA = agentOptions.requestCA || systemCA;
        const proxyCA = agentOptions.proxyCA || systemCA;
        if (!proxyURL) {
            const modifiedInit = {
                ...init,
                dispatcher: getAgent(agentOptions.dispatcher, allowH2, requestCA, addCerts),
            };
            return originalFetch(input, modifiedInit);
        }
        const state = {};
        const modifiedInit = {
            ...init,
            dispatcher: await getProxyAgent(params, agentOptions.dispatcher, proxyURL, allowH2, requestCA, proxyCA, addCerts, state),
        };
        return originalFetch(input, modifiedInit);
    };
}
let previousAddCertsAgent = undefined;
let defaultAgent = undefined;
let agentCache = new WeakMap();
function getAgent(originalDispatcher, allowH2, requestCA, currentAddCerts) {
    if (previousAddCertsAgent !== currentAddCerts) {
        previousAddCertsAgent = currentAddCerts;
        defaultAgent = undefined;
        agentCache = new WeakMap();
    }
    if (!originalDispatcher) {
        if (!defaultAgent) {
            defaultAgent = createAgent(allowH2, requestCA);
        }
        return defaultAgent;
    }
    if (!agentCache.has(originalDispatcher)) {
        agentCache.set(originalDispatcher, createAgent(allowH2, requestCA));
    }
    return agentCache.get(originalDispatcher);
}
function createAgent(allowH2, requestCA) {
    return new undici.Agent({
        allowH2,
        connect: { ca: requestCA },
    });
}
let previousAddCertsProxyAgent = undefined;
let defaultProxyAgent = undefined;
let proxyAgentCache = new WeakMap();
async function getProxyAgent(params, originalDispatcher, proxyURL, allowH2, requestCA, proxyCA, currentAddCerts, state) {
    if (previousAddCertsProxyAgent !== currentAddCerts) {
        previousAddCertsProxyAgent = currentAddCerts;
        defaultProxyAgent = undefined;
        proxyAgentCache = new WeakMap();
    }
    if (!originalDispatcher) {
        if (!defaultProxyAgent) {
            defaultProxyAgent = await createProxyAgent(params, proxyURL, allowH2, requestCA, proxyCA, state);
        }
        return defaultProxyAgent;
    }
    let dispatcherCache = proxyAgentCache.get(originalDispatcher);
    if (!dispatcherCache) {
        dispatcherCache = new Map();
        proxyAgentCache.set(originalDispatcher, dispatcherCache);
    }
    if (!dispatcherCache.has(proxyURL)) {
        dispatcherCache.set(proxyURL, await createProxyAgent(params, proxyURL, allowH2, requestCA, proxyCA, state));
    }
    return dispatcherCache.get(proxyURL);
}
async function createProxyAgent(params, proxyURL, allowH2, requestCA, proxyCA, state) {
    const proxyAuthorization = await params.lookupProxyAuthorization?.(proxyURL, undefined, state);
    return new undici.ProxyAgent({
        uri: proxyURL,
        allowH2,
        headers: proxyAuthorization ? { "Proxy-Authorization": proxyAuthorization } : undefined,
        requestTls: requestCA ? { allowH2, ca: requestCA } : { allowH2 },
        proxyTls: proxyCA ? { allowH2, ca: proxyCA } : { allowH2 },
        clientFactory: (origin, opts) => new undici.Pool(origin, opts).compose((dispatch) => {
            class ProxyAuthHandler extends undici.DecoratorHandler {
                constructor(dispatch, options, handler) {
                    super(handler);
                    this.dispatch = dispatch;
                    this.options = options;
                    this.handler = handler;
                }
                onResponseError(controller, err) {
                    if (!(err instanceof ProxyAuthError)) {
                        return this.handler.onResponseError?.(controller, err);
                    }
                    (async () => {
                        try {
                            const proxyAuthorization = await params.lookupProxyAuthorization?.(proxyURL, err.proxyAuthenticate, state);
                            if (proxyAuthorization) {
                                if (!this.options.headers) {
                                    this.options.headers = ["Proxy-Authorization", proxyAuthorization];
                                }
                                else if (Array.isArray(this.options.headers)) {
                                    const i = this.options.headers.findIndex((value, index) => index % 2 === 0 && value.toLowerCase() === "proxy-authorization");
                                    if (i === -1) {
                                        this.options.headers.push("Proxy-Authorization", proxyAuthorization);
                                    }
                                    else {
                                        this.options.headers[i + 1] = proxyAuthorization;
                                    }
                                }
                                else if (typeof this.options.headers[Symbol.iterator] === "function") {
                                    const headers = [
                                        ...this.options.headers,
                                    ];
                                    const i = headers.findIndex((value) => value[0].toLowerCase() === "proxy-authorization");
                                    if (i === -1) {
                                        headers.push(["Proxy-Authorization", proxyAuthorization]);
                                    }
                                    else {
                                        headers[i][1] = proxyAuthorization;
                                    }
                                    this.options.headers = headers;
                                }
                                else {
                                    this.options.headers["Proxy-Authorization"] = proxyAuthorization;
                                }
                                this.dispatch(this.options, this);
                            }
                            else {
                                this.handler.onResponseError?.(controller, new undici.errors.RequestAbortedError(`Proxy response (407) ?.== 200 when HTTP Tunneling`)); // Mimick undici's behavior
                            }
                        }
                        catch (err) {
                            this.handler.onResponseError?.(controller, err);
                        }
                    })();
                }
                onRequestUpgrade(controller, statusCode, headers, socket) {
                    if (statusCode === 407 && headers) {
                        let proxyAuthenticate;
                        for (const header in headers) {
                            if (header.toLowerCase() === "proxy-authenticate") {
                                proxyAuthenticate = headers[header];
                                break;
                            }
                        }
                        if (proxyAuthenticate) {
                            controller.abort(new ProxyAuthError(proxyAuthenticate));
                            return;
                        }
                    }
                    this.handler.onRequestUpgrade?.(controller, statusCode, headers, socket);
                }
            }
            return function proxyAuthDispatch(options, handler) {
                return dispatch(options, new ProxyAuthHandler(dispatch, options, handler));
            };
        }),
    });
}
class ProxyAuthError extends Error {
    constructor(proxyAuthenticate) {
        super("Proxy authentication required");
        this.proxyAuthenticate = proxyAuthenticate;
    }
}
const agentOptions = Symbol("agentOptions");
const proxyAgentOptions = Symbol("proxyAgentOptions");
function patchUndici(originalUndici) {
    const originalAgent = originalUndici.Agent;
    const patchedAgent = function PatchedAgent(opts) {
        const agent = new originalAgent(opts);
        agent[agentOptions] = {
            ...opts,
            ...(opts?.connect && typeof opts?.connect === "object"
                ? { connect: { ...opts.connect } }
                : undefined),
        };
        return agent;
    };
    patchedAgent.prototype = originalAgent.prototype;
    originalUndici.Agent = patchedAgent;
    const originalProxyAgent = originalUndici.ProxyAgent;
    const patchedProxyAgent = function PatchedProxyAgent(opts) {
        const proxyAgent = new originalProxyAgent(opts);
        proxyAgent[proxyAgentOptions] =
            typeof opts === "string"
                ? opts
                : {
                    ...opts,
                    ...(opts?.connect && typeof opts?.connect === "object"
                        ? { connect: { ...opts.connect } }
                        : undefined),
                };
        return proxyAgent;
    };
    patchedProxyAgent.prototype = originalProxyAgent.prototype;
    originalUndici.ProxyAgent = patchedProxyAgent;
}
function getAgentOptions(requestInit) {
    let allowH2;
    let requestCA;
    let proxyCA;
    let socketPath;
    const dispatcher = requestInit?.dispatcher;
    let originalAgentOptions = dispatcher && dispatcher[agentOptions];
    if (dispatcher && !originalAgentOptions) {
        // Handles bundled extension code where undici does not get patched.
        const optionsSymbol = Object.getOwnPropertySymbols(dispatcher).find((s) => s.description === "options");
        if (optionsSymbol) {
            originalAgentOptions = dispatcher[optionsSymbol];
        }
    }
    if (originalAgentOptions && typeof originalAgentOptions === "object") {
        allowH2 = originalAgentOptions.allowH2;
        if (originalAgentOptions.connect && typeof originalAgentOptions.connect === "object") {
            requestCA =
                ("ca" in originalAgentOptions.connect && originalAgentOptions.connect.ca) || undefined;
            socketPath = originalAgentOptions.connect.socketPath || undefined;
        }
    }
    let originalProxyAgentOptions = dispatcher && dispatcher[proxyAgentOptions];
    if (dispatcher && !originalProxyAgentOptions) {
        // Handles bundled extension code where undici does not get patched.
        const proxyAgentSymbol = Object.getOwnPropertySymbols(dispatcher).find((s) => s.description === "proxy agent");
        if (proxyAgentSymbol) {
            const proxyAgent = dispatcher[proxyAgentSymbol];
            if (proxyAgent && typeof proxyAgent === "object") {
                const optionsSymbol = Object.getOwnPropertySymbols(proxyAgent).find((s) => s.description === "options");
                if (optionsSymbol) {
                    originalProxyAgentOptions = proxyAgent[optionsSymbol];
                }
            }
        }
    }
    if (originalProxyAgentOptions && typeof originalProxyAgentOptions === "object") {
        allowH2 = originalProxyAgentOptions.allowH2;
        requestCA =
            (originalProxyAgentOptions.requestTls &&
                "ca" in originalProxyAgentOptions.requestTls &&
                originalProxyAgentOptions.requestTls.ca) ||
                undefined;
        proxyCA =
            (originalProxyAgentOptions.proxyTls &&
                "ca" in originalProxyAgentOptions.proxyTls &&
                originalProxyAgentOptions.proxyTls.ca) ||
                undefined;
    }
    return { dispatcher, allowH2, requestCA, proxyCA, socketPath };
}
function addCertificatesToOptionsV1(params, addCertificatesV1, opts, callback) {
    if (addCertificatesV1) {
        getOrLoadAdditionalCertificates(params)
            .then((caCertificates) => {
            if (opts._vscodeTestReplaceCaCerts) {
                opts.ca = caCertificates;
            }
            else {
                opts._vscodeAdditionalCaCerts = caCertificates;
            }
            callback();
        })
            .catch((err) => {
            params.log.error("ProxyResolver#addCertificatesV1", toErrorMessage(err));
        });
    }
    else {
        callback();
    }
}
let _certificatesPromise;
let _certificates;
async function getOrLoadAdditionalCertificates(params) {
    if (!_certificatesPromise) {
        _certificatesPromise = (async () => {
            return (_certificates = await params.loadAdditionalCertificates());
        })();
    }
    return _certificatesPromise;
}
let _systemCertificatesPromise;
async function loadSystemCertificates(params) {
    if (!_systemCertificatesPromise) {
        _systemCertificatesPromise = (async () => {
            try {
                const certs = await readSystemCertificates();
                params.log.debug("ProxyResolver#loadSystemCertificates count", certs.length);
                const now = Date.now();
                const filtered = certs.filter((cert) => {
                    try {
                        const parsedCert = new crypto.X509Certificate(cert);
                        const parsedDate = Date.parse(parsedCert.validTo);
                        return isNaN(parsedDate) || parsedDate > now;
                    }
                    catch (err) {
                        params.log.debug("ProxyResolver#loadSystemCertificates parse error", toErrorMessage(err));
                        return false;
                    }
                });
                params.log.debug("ProxyResolver#loadSystemCertificates count filtered", filtered.length);
                return filtered;
            }
            catch (err) {
                params.log.error("ProxyResolver#loadSystemCertificates error", toErrorMessage(err));
                return [];
            }
        })();
    }
    return _systemCertificatesPromise;
}
function resetCaches() {
    _certificatesPromise = undefined;
    _certificates = undefined;
    _systemCertificatesPromise = undefined;
}
async function readSystemCertificates() {
    if (process.platform === "win32") {
        return readWindowsCaCertificates();
    }
    if (process.platform === "darwin") {
        return readMacCaCertificates();
    }
    if (process.platform === "linux") {
        return readLinuxCaCertificates();
    }
    return [];
}
async function readWindowsCaCertificates() {
    // @ts-ignore Windows only
    const winCA = await Promise.resolve().then(() => __importStar(require("@vscode/windows-ca-certs")));
    let ders = [];
    const store = new winCA.Crypt32();
    try {
        let der;
        while ((der = store.next())) {
            ders.push(der);
        }
    }
    finally {
        store.done();
    }
    const certs = new Set(ders.map(derToPem));
    return Array.from(certs);
}
async function readMacCaCertificates() {
    const stdout = await new Promise((resolve, reject) => {
        const child = cp.spawn("/usr/bin/security", ["find-certificate", "-a", "-p"]);
        const stdout = [];
        child.stdout.setEncoding("utf8");
        child.stdout.on("data", (str) => stdout.push(str));
        child.on("error", reject);
        child.on("exit", (code) => (code ? reject(code) : resolve(stdout.join(""))));
    });
    const certs = new Set(stdout.split(/(?=-----BEGIN CERTIFICATE-----)/g).filter((pem) => !!pem.length));
    return Array.from(certs);
}
const linuxCaCertificatePaths = [
    "/etc/ssl/certs/ca-certificates.crt", // Debian / Ubuntu / Alpine / Fedora
    "/etc/ssl/certs/ca-bundle.crt", // Fedora
    "/etc/ssl/ca-bundle.pem", // OpenSUSE
    "/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem", // Fedora 43+
];
async function readLinuxCaCertificates() {
    for (const certPath of linuxCaCertificatePaths) {
        try {
            const content = await fs.promises.readFile(certPath, { encoding: "utf8" });
            const certs = new Set(content.split(/(?=-----BEGIN CERTIFICATE-----)/g).filter((pem) => !!pem.length));
            return Array.from(certs);
        }
        catch (err) {
            if (err?.code !== "ENOENT") {
                throw err;
            }
        }
    }
    return [];
}
function derToPem(blob) {
    const lines = ["-----BEGIN CERTIFICATE-----"];
    const der = blob.toString("base64");
    for (let i = 0; i < der.length; i += 64) {
        lines.push(der.substr(i, 64));
    }
    lines.push("-----END CERTIFICATE-----", "");
    return lines.join(os.EOL);
}
function toErrorMessage(err) {
    return (err && (err.stack || err.message)) || String(err);
}
function toLogString(args) {
    return `[${args
        .map((arg) => JSON.stringify(arg, (key, value) => {
        const t = typeof value;
        if (t === "object") {
            if (key) {
                if ((key === "ca" || key === "_vscodeAdditionalCaCerts") && Array.isArray(value)) {
                    return `[${value.length} certs]`;
                }
                if (key === "ca" && (typeof value === "string" || Buffer.isBuffer(value))) {
                    return `[${(value.toString().match(/-----BEGIN CERTIFICATE-----/g) || []).length} certs]`;
                }
                return !value || value.toString ? String(value) : Object.prototype.toString.call(value);
            }
            else {
                return value;
            }
        }
        if (t === "function") {
            return `[Function: ${value.name}]`;
        }
        if (t === "bigint") {
            return String(value);
        }
        if (t === "string" && value.length > 25) {
            const len = `[${value.length} chars]`;
            return `${value.substr(0, 25 - len.length)}${len}`;
        }
        return value;
    }))
        .join(", ")}]`;
}
/**
 * Certificates for testing. These are not automatically used, but can be added in
 * ProxyAgentParams#loadAdditionalCertificates(). This just provides a shared array
 * between production code and tests.
 */
exports.testCertificates = [];
//# sourceMappingURL=proxy-index.js.map