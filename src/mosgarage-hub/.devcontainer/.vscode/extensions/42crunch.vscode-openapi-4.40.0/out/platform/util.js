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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmed = confirmed;
exports.isPlatformUri = isPlatformUri;
exports.makePlatformUri = makePlatformUri;
exports.getApiId = getApiId;
exports.makeIcon = makeIcon;
exports.createApiNamingConventionInputBoxOptions = createApiNamingConventionInputBoxOptions;
exports.createCollectionNamingConventionInputBoxOptions = createCollectionNamingConventionInputBoxOptions;
exports.formatException = formatException;
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const platform_1 = require("@xliic/common/platform");
const types_1 = require("./types");
async function confirmed(prompt) {
    const confirmation = await vscode.window.showInformationMessage(prompt, "Yes", "Cancel");
    return confirmation && confirmation === "Yes";
}
function isPlatformUri(uri) {
    return uri.scheme === types_1.platformUriScheme;
}
function makePlatformUri(apiId) {
    return vscode.Uri.parse(`${types_1.platformUriScheme}://42crunch.com/apis/${apiId}.json`);
}
function getApiId(uri) {
    if (isPlatformUri(uri)) {
        const apiId = path_1.default.basename(uri.fsPath, ".json");
        return apiId;
    }
}
function makeIcon(extensionUri, icon) {
    if (typeof icon === "string") {
        return new vscode.ThemeIcon(icon);
    }
    return {
        light: vscode.Uri.parse(extensionUri.toString() + `/resources/light/${icon.light}.svg`),
        dark: vscode.Uri.parse(extensionUri.toString() + `/resources/dark/${icon.dark}.svg`),
    };
}
function createNamingConventionInputBoxOptions(convention, defaultPattern) {
    const { pattern, description, example } = convention;
    const prompt = example !== "" ? `Example: ${example}` : undefined;
    return {
        prompt,
        validateInput: (input) => {
            if (pattern !== "" && !input.match(pattern)) {
                return `The input does not match the expected pattern "${description}" defined in your organization. Example of the expected value: "${example}"`;
            }
            if (!input.match(defaultPattern)) {
                return `The input does not match the expected pattern "${defaultPattern}"`;
            }
        },
    };
}
function createApiNamingConventionInputBoxOptions(convention) {
    return createNamingConventionInputBoxOptions(convention, platform_1.DefaultApiNamingPattern);
}
function createCollectionNamingConventionInputBoxOptions(convention) {
    return createNamingConventionInputBoxOptions(convention, platform_1.DefaultCollectionNamingPattern);
}
function formatException(info, ex) {
    const message = ex?.message;
    const transactionId = ex?.response?.headers?.["x-42c-transactionid"]
        ? `Transaction ID: ${ex.response.headers["x-42c-transactionid"]}`
        : undefined;
    const body = ex?.response?.body ? JSON.stringify(ex.response.body) : undefined;
    return [info, message, transactionId, body].filter((part) => part !== undefined).join(" ");
}
//# sourceMappingURL=util.js.map