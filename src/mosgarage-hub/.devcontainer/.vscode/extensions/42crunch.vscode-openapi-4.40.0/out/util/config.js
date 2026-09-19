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
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.deriveServices = deriveServices;
exports.processApprovedHosts = processApprovedHosts;
exports.removeSecretsForApprovedHosts = removeSecretsForApprovedHosts;
exports.getApprovedHostnames = getApprovedHostnames;
exports.getApprovedHostnamesTrimmedLowercase = getApprovedHostnamesTrimmedLowercase;
exports.getApprovedHostConfiguration = getApprovedHostConfiguration;
exports.getHostConfigurationSecretKeyBase = getHostConfigurationSecretKeyBase;
exports.getHostConfigurationSecretKeyFor = getHostConfigurationSecretKeyFor;
const vscode = __importStar(require("vscode"));
const cli_ast_1 = require("../platform/cli-ast");
async function loadConfig(configuration, secrets) {
    const platformAuthType = configuration.get("platformAuthType");
    const platformUrl = configuration.get("platformUrl")?.trim();
    const anondToken = configuration.get("securityAuditToken");
    const apiToken = (await secrets.get("platformApiToken")) ?? "";
    const insecureSslHostnames = configuration.get("tryit.insecureSslHostnames");
    const platformServices = configuration.get("platformServices");
    const scandManager = configuration.get("platformScandManager");
    const docker = configuration.get("docker");
    const cliDirectoryOverride = configuration.get("cliDirectoryOverride");
    const auditRuntime = configuration.get("platformAuditRuntime");
    const scanRuntime = configuration.get("platformConformanceScanRuntime");
    const scanImage = configuration.get("platformConformanceScanImage");
    const scanProxy = configuration.get("platformConformanceScanProxy");
    const scandManagerHeader = await secrets.get("platformScandManagerHeader");
    const repository = configuration.get("platformRepository");
    const platformTemporaryCollectionName = configuration.get("platformTemporaryCollectionName");
    const platformMandatoryTags = configuration.get("platformMandatoryTags");
    // derived auth type is api-token only if anondToken is not set and apiToken is set, otherwise it is anond-token
    const derivedAuthType = !anondToken && !!apiToken ? "api-token" : "anond-token";
    const approvedHosts = await getApprovedHostsConfiguration(configuration, secrets);
    const internalFeatures = configuration.get("internalFeatures");
    const internalUseDevEndpoints = configuration.get("internalUseDevEndpoints");
    return {
        platformUrl,
        platformAuthType: platformAuthType == "" ? derivedAuthType : platformAuthType,
        platformApiToken: apiToken,
        anondToken,
        insecureSslHostnames,
        platformServices: {
            source: platformServices === "" ? "auto" : "manual",
            manual: platformServices,
            auto: deriveServices(platformUrl),
        },
        scandManager: {
            ...scandManager,
            header: scandManagerHeader !== undefined ? JSON.parse(scandManagerHeader) : { name: "", value: "" },
        },
        auditRuntime,
        scanRuntime,
        scanImage,
        scanProxy,
        docker,
        platform: process.platform,
        cli: (0, cli_ast_1.getCliInfo)(cliDirectoryOverride),
        cliDirectoryOverride,
        repository,
        platformTemporaryCollectionName,
        platformMandatoryTags,
        approvedHosts,
        internalFeatures,
        internalUseDevEndpoints,
    };
}
async function saveConfig(config, configuration, secrets) {
    await configuration.update("platformUrl", config.platformUrl, vscode.ConfigurationTarget.Global);
    await configuration.update("platformAuthType", config.platformAuthType, vscode.ConfigurationTarget.Global);
    await configuration.update("securityAuditToken", config.anondToken, vscode.ConfigurationTarget.Global);
    if (config.platformServices.source === "auto") {
        await configuration.update("platformServices", "", vscode.ConfigurationTarget.Global);
    }
    else {
        await configuration.update("platformServices", config.platformServices.manual, vscode.ConfigurationTarget.Global);
    }
    await configuration.update("platformScandManager", config.scandManager, vscode.ConfigurationTarget.Global);
    await configuration.update("docker", config.docker, vscode.ConfigurationTarget.Global);
    await configuration.update("platformAuditRuntime", config.auditRuntime, vscode.ConfigurationTarget.Global);
    await configuration.update("platformConformanceScanRuntime", config.scanRuntime, vscode.ConfigurationTarget.Global);
    await configuration.update("platformConformanceScanImage", config.scanImage, vscode.ConfigurationTarget.Global);
    await configuration.update("platformRepository", config.repository, vscode.ConfigurationTarget.Global);
    await configuration.update("cliDirectoryOverride", config.cliDirectoryOverride, vscode.ConfigurationTarget.Global);
    await configuration.update("platformTemporaryCollectionName", config.platformTemporaryCollectionName, vscode.ConfigurationTarget.Global);
    await configuration.update("platformMandatoryTags", config.platformMandatoryTags, vscode.ConfigurationTarget.Global);
    await configuration.update("internalFeatures", config.internalFeatures, vscode.ConfigurationTarget.Global);
    await configuration.update("internalUseDevEndpoints", config.internalUseDevEndpoints, vscode.ConfigurationTarget.Global);
    await configuration.update("platformConformanceScanProxy", config.scanProxy, vscode.ConfigurationTarget.Global);
    // secrets
    await secrets.store("platformApiToken", config.platformApiToken);
    if (config.scandManager.auth == "header") {
        await secrets.store("platformScandManagerHeader", JSON.stringify(config.scandManager.header));
    }
    await processApprovedHosts(configuration, secrets, config.approvedHosts);
}
function deriveServices(platformUrl) {
    const platformHost = vscode.Uri.parse(platformUrl).authority;
    if (platformHost.toLowerCase().startsWith("platform")) {
        return platformHost.replace(/^platform/i, "services") + ":8001";
    }
    return "services." + platformHost + ":8001";
}
async function processApprovedHosts(configuration, secrets, approvedHosts) {
    const updateApprovedHostnames = approvedHosts.map((hostConfig) => hostConfig.host.trim());
    const lcaseUpdateApprovedHostnames = updateApprovedHostnames.map((hostname) => hostname.toLowerCase());
    const currentApprovedHostnames = getApprovedHostnames(configuration);
    const removedHostnames = currentApprovedHostnames.filter((currentHost) => !lcaseUpdateApprovedHostnames.includes(currentHost.trim().toLowerCase()));
    // remove secrets for deleted hostnames
    await removeSecretsForApprovedHosts(secrets, removedHostnames);
    // save new secrets
    await Promise.all(approvedHosts.flatMap((hostConfigUpdate) => [
        secrets.store(getHostConfigurationSecretKeyFor(hostConfigUpdate.host, "header"), hostConfigUpdate.header || ""),
        secrets.store(getHostConfigurationSecretKeyFor(hostConfigUpdate.host, "prefix"), hostConfigUpdate.prefix || ""),
        secrets.store(getHostConfigurationSecretKeyFor(hostConfigUpdate.host, "token"), hostConfigUpdate.token || ""),
    ]));
    // update hostnames configuration
    await configuration.update("approvedHostnames", updateApprovedHostnames, vscode.ConfigurationTarget.Global);
}
async function removeSecretsForApprovedHosts(secrets, removed) {
    return Promise.all(removed.flatMap((removedHost) => {
        const lcHost = removedHost.trim().toLowerCase();
        return [
            secrets.delete(getHostConfigurationSecretKeyFor(lcHost, "header")),
            secrets.delete(getHostConfigurationSecretKeyFor(lcHost, "prefix")),
            secrets.delete(getHostConfigurationSecretKeyFor(lcHost, "token")),
        ];
    }));
}
function getApprovedHostnames(configuration) {
    return configuration.get("approvedHostnames", []);
}
function getApprovedHostnamesTrimmedLowercase(configuration) {
    return getApprovedHostnames(configuration).map((name) => name.trim().toLowerCase());
}
async function getApprovedHostConfiguration(secrets, host) {
    const sanitizedHost = host.trim().toLowerCase();
    if (!sanitizedHost) {
        return undefined;
    }
    const [header, prefix, token] = (await Promise.all([
        secrets.get(getHostConfigurationSecretKeyFor(sanitizedHost, "header")),
        secrets.get(getHostConfigurationSecretKeyFor(sanitizedHost, "prefix")),
        secrets.get(getHostConfigurationSecretKeyFor(sanitizedHost, "token")),
    ])).map((conf) => conf || "");
    return { host: host.trim(), header, prefix, token };
}
async function getApprovedHostsConfiguration(configuration, secrets) {
    const approvedHostnames = getApprovedHostnames(configuration);
    return (await Promise.all(approvedHostnames.map((host) => getApprovedHostConfiguration(secrets, host)))).filter((hostConfig) => hostConfig !== undefined);
}
function getHostConfigurationSecretKeyBase() {
    return "openapi-external-refs-host";
}
function getHostConfigurationSecretKeyFor(host, group) {
    return `${getHostConfigurationSecretKeyBase()}-${group}-${host}`;
}
//# sourceMappingURL=config.js.map