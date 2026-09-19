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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApproveHostnameAction = exports.ExternalRefDocumentProvider = exports.INTERNAL_SCHEMES = void 0;
exports.requiresApproval = requiresApproval;
exports.toInternalUri = toInternalUri;
exports.fromInternalUri = fromInternalUri;
exports.registerAddApprovedHost = registerAddApprovedHost;
const vscode = __importStar(require("vscode"));
const got_1 = __importDefault(require("got"));
const configuration_1 = require("./configuration");
const config_1 = require("./util/config");
exports.INTERNAL_SCHEMES = {
    http: "openapi-internal-http",
    https: "openapi-internal-https",
};
const CONTENT_TYPES = {
    "application/json": "json",
    "application/x-yaml": "yaml",
    "text/yaml": "yaml",
};
const EXTENSIONS = {
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
};
function requiresApproval(internalUri) {
    return Object.values(exports.INTERNAL_SCHEMES).includes(internalUri.scheme?.toLowerCase());
}
function toInternalUri(uri) {
    const scheme = exports.INTERNAL_SCHEMES[uri.scheme];
    if (scheme) {
        return uri.with({ scheme });
    }
    return uri;
}
function fromInternalUri(uri) {
    for (const [external, internal] of Object.entries(exports.INTERNAL_SCHEMES)) {
        if (uri.scheme === internal) {
            return uri.with({ scheme: external });
        }
    }
    return uri;
}
function getLanguageId(uri, contentType) {
    const fromContentType = contentType && CONTENT_TYPES[contentType.toLowerCase()];
    if (fromContentType) {
        return fromContentType;
    }
    for (const [extension, language] of Object.entries(EXTENSIONS)) {
        if (uri.toLowerCase().endsWith(extension)) {
            return language;
        }
    }
    return undefined;
}
class ExternalRefDocumentProvider {
    constructor(secrets) {
        this.cache = {};
        this.secrets = secrets;
    }
    getLanguageId(uri) {
        const actualUri = fromInternalUri(uri);
        return this.cache[actualUri.toString()];
    }
    isHostApproved(authority) {
        const sanitizedAuthority = authority.trim().toLowerCase();
        if (!sanitizedAuthority) {
            return false;
        }
        return (0, config_1.getApprovedHostnames)(configuration_1.configuration).find(hostname => hostname.toLowerCase() === sanitizedAuthority) !== undefined;
    }
    async getHostConfiguration(authority) {
        const sanitizedAuthority = authority.trim().toLowerCase();
        if (!sanitizedAuthority) {
            return undefined;
        }
        if (this.isHostApproved(sanitizedAuthority)) {
            return await (0, config_1.getApprovedHostConfiguration)(this.secrets, sanitizedAuthority);
        }
        return undefined;
    }
    async provideTextDocumentContent(uri, token) {
        if (!this.isHostApproved(uri.authority)) {
            throw new Error(`Hostname "${uri.authority}" is not in the list of approved hosts`);
        }
        const actualUri = fromInternalUri(uri);
        const requestOptions = {};
        requestOptions.headers = {};
        const hostConfig = await this.getHostConfiguration(uri.authority);
        if (hostConfig?.token) {
            requestOptions.headers[hostConfig.header || "Authorization"] = `${hostConfig.prefix || "Bearer"} ${hostConfig.token}`;
        }
        const { body, headers } = await (0, got_1.default)(actualUri.toString(), requestOptions);
        const actualUriWithoutQueryAndFragment = actualUri.with({ query: "", fragment: "" });
        const languageId = getLanguageId(actualUriWithoutQueryAndFragment.toString(), headers["content-type"]);
        if (languageId) {
            this.cache[actualUri.toString()] = languageId;
        }
        try {
            if (languageId === "json") {
                return JSON.stringify(JSON.parse(body), null, 2);
            }
        }
        catch (ex) {
            // ignore
        }
        return body;
    }
}
exports.ExternalRefDocumentProvider = ExternalRefDocumentProvider;
class ApproveHostnameAction {
    provideCodeActions(document, range, context, token) {
        const result = [];
        for (const diagnostic of context.diagnostics) {
            if (diagnostic.code === "rejected" && "rejectedHost" in diagnostic) {
                const hostname = diagnostic["rejectedHost"];
                const title = `Add "${hostname}" to the list of approved hostnames`;
                const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
                action.command = {
                    arguments: [diagnostic["rejectedHost"]],
                    command: "openapi.addApprovedHost",
                    title,
                };
                action.diagnostics = [diagnostic];
                action.isPreferred = true;
                result.push(action);
            }
        }
        return result;
    }
}
exports.ApproveHostnameAction = ApproveHostnameAction;
ApproveHostnameAction.providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];
function registerAddApprovedHost(context) {
    return vscode.commands.registerCommand("openapi.addApprovedHost", (hostname) => {
        const approved = (0, config_1.getApprovedHostnames)(configuration_1.configuration);
        if (!approved.includes(hostname.toLocaleLowerCase()))
            configuration_1.configuration.update("approvedHostnames", [...approved, hostname.toLocaleLowerCase()], vscode.ConfigurationTarget.Global);
    });
}
//# sourceMappingURL=external-refs.js.map