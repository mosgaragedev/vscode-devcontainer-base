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
exports.TagsWebView = void 0;
const vscode = __importStar(require("vscode"));
const web_view_1 = require("../../web-view");
const http_handler_1 = require("../../http-handler");
const tags_1 = require("@xliic/common/tags");
const config_1 = require("../../../util/config");
class TagsWebView extends web_view_1.WebView {
    constructor(extensionPath, memento, configuration, secrets, platform, logger) {
        super(extensionPath, "tags", "Tag Selection", vscode.ViewColumn.One);
        this.memento = memento;
        this.configuration = configuration;
        this.secrets = secrets;
        this.platform = platform;
        this.logger = logger;
        this.hostHandlers = {
            sendHttpRequest: async (payload) => {
                try {
                    const response = await (0, http_handler_1.executeHttpRequestRaw)(payload.request, payload.config);
                    this.sendRequest({
                        command: "showHttpResponse",
                        payload: { id: payload.id, response },
                    });
                }
                catch (e) {
                    this.sendRequest({
                        command: "showHttpError",
                        payload: { id: payload.id, error: e },
                    });
                }
            },
            saveTags: async (data) => {
                const tagData = this.memento.get(tags_1.TAGS_DATA_KEY, {});
                for (const [key, value] of Object.entries(data)) {
                    if (value) {
                        tagData[key] = value;
                    }
                    else {
                        delete tagData[key];
                    }
                }
                await this.memento.update(tags_1.TAGS_DATA_KEY, tagData);
            },
        };
        vscode.window.onDidChangeActiveColorTheme((e) => {
            if (this.isActive()) {
                this.sendColorTheme(e);
            }
        });
    }
    async onStart() {
        await this.sendColorTheme(vscode.window.activeColorTheme);
        const config = await (0, config_1.loadConfig)(this.configuration, this.secrets);
        this.sendRequest({
            command: "loadConfig",
            payload: config,
        });
        const tagData = this.memento.get(tags_1.TAGS_DATA_KEY, {});
        const targetFileName = this.uri?.fsPath;
        if (targetFileName) {
            if (!tagData[targetFileName]) {
                tagData[targetFileName] = [];
            }
            this.sendRequest({
                command: "loadTags",
                payload: { targetFileName, data: tagData },
            });
        }
    }
    async showTagsWebView(uri) {
        this.uri = uri;
        await this.show();
    }
}
exports.TagsWebView = TagsWebView;
//# sourceMappingURL=view.js.map