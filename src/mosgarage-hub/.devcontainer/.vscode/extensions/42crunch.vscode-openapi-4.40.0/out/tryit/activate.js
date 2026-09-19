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
exports.activate = activate;
const vscode = __importStar(require("vscode"));
const view_1 = require("./view");
const lens_1 = require("./lens");
const debounce_1 = require("../util/debounce");
const util_1 = require("../outlines/util");
const selectors = {
    json: { language: "json" },
    jsonc: { language: "jsonc" },
    yaml: { language: "yaml" },
};
function activate(context, cache, configuration, envStore, prefs) {
    let disposables = [];
    const view = new view_1.TryItWebView(context.extensionPath, cache, envStore, prefs, configuration, context.secrets);
    const debounceDelay = { delay: 1000 };
    configuration.track("previewUpdateDelay", (previewDelay) => {
        debounceDelay.delay = previewDelay;
    });
    const debouncedUpdateTryIt = (0, debounce_1.debounce)(updateTryIt, debounceDelay);
    cache.onDidChange(async (document) => {
        if (view?.isActive() && view.getTarget()?.document.uri.toString() === document.uri.toString()) {
            const bundle = await cache.getDocumentBundle(document);
            if (bundle && !("errors" in bundle)) {
                const versions = getBundleVersions(bundle);
                if (isBundleVersionsDifferent(versions, view.getTarget().versions)) {
                    await debouncedUpdateTryIt(view, bundle, versions);
                }
            }
        }
    });
    const tryItCodeLensProvider = new lens_1.TryItCodelensProvider(cache);
    function activateLens(enabled) {
        disposables.forEach((disposable) => disposable.dispose());
        if (enabled) {
            disposables = Object.values(selectors).map((selector) => vscode.languages.registerCodeLensProvider(selector, tryItCodeLensProvider));
        }
        else {
            disposables = [];
        }
    }
    configuration.onDidChange(async (e) => {
        if (configuration.changed(e, "codeLens")) {
            activateLens(configuration.get("codeLens"));
        }
    });
    activateLens(configuration.get("codeLens"));
    vscode.commands.registerCommand("openapi.tryOperation", async (document, path, method) => {
        await startTryIt(document, cache, view, path, method);
    });
    vscode.commands.registerCommand("openapi.tryOperationWithExample", async (document, path, method, preferredMediaType, preferredBodyValue) => {
        await startTryIt(document, cache, view, path, method, preferredMediaType, preferredBodyValue);
    });
    vscode.commands.registerCommand("openapi.outlineTryOperation", async (node) => {
        if (!vscode.window.activeTextEditor) {
            vscode.window.showErrorMessage("No active editor");
            return;
        }
        const { path, method } = (0, util_1.getPathAndMethod)(node);
        await startTryIt(vscode.window.activeTextEditor.document, cache, view, path, method);
    });
    return new vscode.Disposable(() => disposables.forEach((disposable) => disposable.dispose()));
}
async function startTryIt(document, cache, view, path, method, preferredMediaType, preferredBodyValue) {
    const bundle = await cache.getDocumentBundle(document);
    if (!bundle || "errors" in bundle) {
        vscode.commands.executeCommand("workbench.action.problems.focus");
        vscode.window.showErrorMessage("Failed to try it, check OpenAPI file for errors.");
        return view;
    }
    return view.showTryIt(bundle, {
        document,
        versions: getBundleVersions(bundle),
        path,
        method,
        preferredMediaType,
        preferredBodyValue,
    });
}
async function updateTryIt(view, bundle, versions) {
    return view.updateTryIt(bundle, versions);
}
function isBundleVersionsDifferent(versions, otherVersions) {
    for (const [uri, version] of Object.entries(versions)) {
        if (otherVersions[uri] !== version) {
            return true;
        }
    }
    if (Object.keys(otherVersions).length !== Object.keys(versions).length) {
        return true;
    }
    return false;
}
function getBundleVersions(bundle) {
    const versions = {
        [bundle.document.uri.toString()]: bundle.document.version,
    };
    bundle.documents.forEach((document) => {
        versions[document.uri.toString()] = document.version;
    });
    return versions;
}
//# sourceMappingURL=activate.js.map