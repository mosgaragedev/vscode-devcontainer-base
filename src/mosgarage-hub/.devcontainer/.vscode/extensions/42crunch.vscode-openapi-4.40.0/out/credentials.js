"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasCredentials = hasCredentials;
exports.ensureHasCredentials = ensureHasCredentials;
exports.getAnondCredentials = getAnondCredentials;
exports.getPlatformCredentials = getPlatformCredentials;
exports.configureCredentials = configureCredentials;
const config_1 = require("./util/config");
async function hasCredentials(configuration, secrets) {
    const platformAuthType = configuration.get("platformAuthType");
    const anondToken = getAnondCredentials(configuration);
    const apiToken = await secrets.get("platformApiToken");
    // if platformAuthType is set, use it else try to derive from the available tokens
    if (platformAuthType === "anond-token" && anondToken) {
        return "anond-token";
    }
    else if (platformAuthType === "api-token" && apiToken) {
        return "api-token";
    }
    else if (anondToken) {
        return "anond-token";
    }
    else if (apiToken) {
        return "api-token";
    }
    return undefined;
}
async function ensureHasCredentials(signUpWebView, configuration, secrets) {
    const credentials = await hasCredentials(configuration, secrets);
    if (credentials === undefined) {
        // try asking for credentials if not found
        const configured = await configureCredentials(signUpWebView);
        if (configured === undefined) {
            // or don't do audit if no credentials been supplied
            return false;
        }
        else {
            return true;
        }
    }
    return true;
}
function getAnondCredentials(configuration) {
    return configuration.get("securityAuditToken");
}
async function getPlatformCredentials(configuration, secrets) {
    const platformUrl = configuration.get("platformUrl");
    const services = configuration.get("platformServices");
    const apiToken = await secrets.get("platformApiToken");
    if (platformUrl && apiToken) {
        // favour services specified in the configuration, else try
        // to derive services from the platformUrl
        if (services) {
            return {
                platformUrl,
                services,
                apiToken,
            };
        }
        return {
            platformUrl,
            services: (0, config_1.deriveServices)(platformUrl),
            apiToken,
        };
    }
}
async function configureCredentials(signUpWebView) {
    return new Promise((resolve, _reject) => {
        signUpWebView.showSignUp(resolve);
    });
}
//# sourceMappingURL=credentials.js.map