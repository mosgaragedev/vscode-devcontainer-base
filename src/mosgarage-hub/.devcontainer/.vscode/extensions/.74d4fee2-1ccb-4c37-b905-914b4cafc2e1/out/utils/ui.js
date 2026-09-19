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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warnBefore = exports.showErrorMessageWithMoreInfo = exports.showErrorMessage = exports.showDoneableInfo = exports.showInfoMessageWithTimeout = void 0;
const vscode_1 = require("vscode");
const os_1 = __importDefault(require("os"));
const logger = __importStar(require("../services/logger"));
const globalState_1 = require("../services/globalState");
const configuration_1 = require("../services/configuration");
const consts_1 = require("../utils/consts");
function showInfoMessageWithTimeout(message, timeout = 3000) {
    const upTo = timeout / 10;
    vscode_1.window.withProgress({
        location: vscode_1.ProgressLocation.Notification,
        title: message,
        cancellable: true,
    }, (progress) => __awaiter(this, void 0, void 0, function* () {
        let counter = 0;
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                progress.report({ increment: counter / upTo });
                if (++counter === upTo) {
                    clearInterval(interval);
                    resolve();
                }
            }, 10);
        });
    }));
}
exports.showInfoMessageWithTimeout = showInfoMessageWithTimeout;
function showDoneableInfo(title, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        yield vscode_1.window.withProgress({
            location: vscode_1.ProgressLocation.Notification,
            title,
        }, () => __awaiter(this, void 0, void 0, function* () { return callback(); }));
    });
}
exports.showDoneableInfo = showDoneableInfo;
function showErrorMessage(message, error) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((yield vscode_1.window.showErrorMessage(message, 'Report')) === 'Report') {
            try {
                const body = `**Original message**: ${message}

**System Info**
Editor version: ${vscode_1.version}
Extension version: ${globalState_1.globalState.extensionVersion}
OS: ${os_1.default.platform()} ${os_1.default.release()}

**Stack**
${error.stack || error.message || error}
`;
                const url = `https://github.com/moshfeu/vscode-compare-folders/issues/new?title=[error] ${error.message || error}&body=${body}`;
                const uri = vscode_1.Uri.parse(url);
                vscode_1.env.openExternal(uri);
            }
            catch (error) {
                logger.log(error);
            }
        }
    });
}
exports.showErrorMessage = showErrorMessage;
function showErrorMessageWithMoreInfo(message, link) {
    return __awaiter(this, void 0, void 0, function* () {
        const moreInfo = 'More Info';
        const result = yield vscode_1.window.showErrorMessage(message, moreInfo);
        if (result === moreInfo) {
            vscode_1.env.openExternal(vscode_1.Uri.parse(link));
        }
    });
}
exports.showErrorMessageWithMoreInfo = showErrorMessageWithMoreInfo;
const warnBefore = (message) => __awaiter(void 0, void 0, void 0, function* () {
    if ((0, configuration_1.getConfiguration)('warnBeforeTake')) {
        return consts_1.YES_MESSAGE ===
            (yield vscode_1.window.showInformationMessage(message, {
                modal: true,
            }, consts_1.YES_MESSAGE));
    }
    return true;
});
exports.warnBefore = warnBefore;
//# sourceMappingURL=ui.js.map