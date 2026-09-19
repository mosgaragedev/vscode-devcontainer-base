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
exports.registeredSnippetQuickFixes = void 0;
exports.registerCommands = registerCommands;
exports.snippetCommand = snippetCommand;
exports.getAllComponentPointers = getAllComponentPointers;
exports.getPointersByComponents = getPointersByComponents;
exports.cmpSets = cmpSets;
/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
// @ts-nocheck
const vscode = __importStar(require("vscode"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const snippets = __importStar(require("./generated/snippets.json"));
const types_1 = require("./types");
const json_utils_1 = require("./json-utils");
const quickfix_1 = require("./audit/quickfix");
const pointer_1 = require("./pointer");
const util_1 = require("./util");
const commands = {
    goToLine,
    copyJsonReference,
    createNewTwo,
    createNewThree,
    createNewThreeOne,
    createNewTwoYaml,
    createNewThreeYaml,
    createNewThreeOneYaml,
    addPath,
    addOperation,
    addSecurity,
    addHost,
    addBasePath,
    addInfo,
    addSecurityDefinitionBasic,
    addSecurityDefinitionApiKey,
    addSecurityDefinitionOauth2Access,
    addDefinitionObject,
    addParameterBody,
    addParameterPath,
    addParameterOther,
    addResponse,
    deleteOperation,
    deletePath,
    v3addInfo,
    v3addComponentsResponse,
    v3addComponentsParameter,
    v3addComponentsSchema,
    v3addServer,
    v3addSecuritySchemeBasic,
    v3addSecuritySchemeApiKey,
    v3addSecuritySchemeJWT,
    v3addSecuritySchemeOauth2Access,
    copyNodeJsonReference,
};
exports.registeredSnippetQuickFixes = {};
function registerCommands(cache) {
    for (const fix of snippets.fixes) {
        exports.registeredSnippetQuickFixes[fix.problem[0]] = fix;
    }
    return Object.keys(commands).map((name) => registerCommand(name, cache, commands[name]));
}
function registerCommand(name, cache, handler) {
    const wrapped = async function (...args) {
        try {
            await handler(cache, ...args);
        }
        catch (e) {
            vscode.window.showErrorMessage(`Failed to execute command: ${e.message}`);
        }
    };
    return vscode.commands.registerCommand(`openapi.${name}`, wrapped);
}
function goToLine(cache, uri, range) {
    const [editor] = uri === null
        ? [vscode.window.activeTextEditor]
        : vscode.window.visibleTextEditors.filter((editor) => editor.document.uri.toString() === uri);
    if (editor) {
        editor.selection = new vscode.Selection(range.start, range.start);
        editor.revealRange(editor.selection, vscode.TextEditorRevealType.AtTop);
    }
}
async function copyJsonReference(cache, range) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const root = cache.getParsedDocument(editor.document);
        if (root) {
            const [node, path] = (0, preserving_json_yaml_parser_1.findNodeAtOffset)(root, editor.document.offsetAt(editor.selection.active));
            const jsonPointer = (0, preserving_json_yaml_parser_1.joinJsonPointer)(path);
            vscode.env.clipboard.writeText(`#${jsonPointer}`);
            const disposable = vscode.window.setStatusBarMessage(`Copied Reference: #${jsonPointer}`);
            setTimeout(() => disposable.dispose(), 1000);
        }
    }
}
function copyNodeJsonReference(cache, node) {
    if (node) {
        const encoded = node.id;
        vscode.env.clipboard.writeText(`#${encoded}`);
        const disposable = vscode.window.setStatusBarMessage(`Copied Reference: #${encoded}`);
        setTimeout(() => disposable.dispose(), 1000);
    }
}
async function createNew(snippet, language) {
    const document = await vscode.workspace.openTextDocument({
        language,
    });
    await vscode.window.showTextDocument(document);
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        await editor.insertSnippet(new vscode.SnippetString(snippet), editor.document.positionAt(0));
    }
}
async function createNewTwo(cache) {
    await createNew(`{
    "swagger":"2.0",
    "info": {
      "title":"\${1:API Title\}",
      "version":"\${2:1.0}"
    },
    "host": "\${3:api.server.test}",
    "basePath": "/",
    "schemes": ["https"],
    "paths": {
    }
  }`, "json");
}
async function createNewThree(cache) {
    await createNew(`{
    "openapi":"3.0.3",
    "info": {
      "title":"\${1:API Title}",
      "version":"\${2:1.0}"
    },
    "servers": [
      {"url":"\${3:https://api.server.test/v1}"}
    ],
    "paths": {
    }
  }`, "json");
}
async function createNewThreeOne(cache) {
    await createNew(`{
    "openapi":"3.1.1",
    "info": {
      "title":"\${1:API Title}",
      "version":"\${2:1.0}"
    },
    "servers": [
      {"url":"\${3:https://api.server.test/v1}"}
    ],
    "paths": {
    }
  }`, "json");
}
async function createNewTwoYaml(cache) {
    await createNew(`swagger: '2.0'
info:
  title: \${1:API Title}
  version: \${2:'1.0'}
host: \${3:api.server.test}
basePath: /
schemes:
  - https
paths:
  /test:
    get:
      responses:
        '200':
          description: OK`, "yaml");
}
async function createNewThreeYaml(cache) {
    await createNew(`openapi: '3.0.3'
info:
  title: \${1:API Title}
  version: \${2:'1.0'}
servers:
  - url: \${3:https://api.server.test/v1}
paths:
  /test:
    get:
      responses:
        '200':
          description: OK
`, "yaml");
}
async function createNewThreeOneYaml(cache) {
    await createNew(`openapi: '3.1.1'
info:
  title: \${1:API Title}
  version: \${2:'1.0'}
servers:
  - url: \${3:https://api.server.test/v1}
paths:
  /test:
    get:
      responses:
        '200':
          description: OK
`, "yaml");
}
async function addBasePath(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["basePath"], cache);
}
async function addHost(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["host"], cache);
}
async function addInfo(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["info"], cache);
}
async function v3addInfo(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["info"], cache);
}
async function addPath(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["path"], cache);
}
async function addSecurityDefinitionBasic(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["securityBasic"], cache);
}
async function addSecurityDefinitionOauth2Access(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["securityOauth2Access"], cache);
}
async function addSecurityDefinitionApiKey(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["securityApiKey"], cache);
}
async function addSecurity(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["security"], cache);
}
async function addDefinitionObject(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["definitionObject"], cache);
}
async function addParameterPath(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["parameterPath"], cache);
}
async function addParameterBody(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["parameterBody"], cache);
}
async function addParameterOther(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["parameterOther"], cache);
}
async function addResponse(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["response"], cache);
}
async function v3addComponentsResponse(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["componentsResponse"], cache);
}
async function v3addComponentsParameter(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["componentsParameter"], cache);
}
async function v3addComponentsSchema(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["componentsSchema"], cache);
}
async function v3addSecuritySchemeBasic(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["componentsSecurityBasic"], cache);
}
async function v3addSecuritySchemeApiKey(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["componentsSecurityApiKey"], cache);
}
async function v3addSecuritySchemeJWT(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["componentsSecurityJwt"], cache);
}
async function v3addSecuritySchemeOauth2Access(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["componentsSecurityOauth2Access"], cache);
}
async function v3addServer(cache) {
    await snippetCommand(exports.registeredSnippetQuickFixes["server"], cache);
}
async function addOperation(cache, node) {
    const fix = exports.registeredSnippetQuickFixes["operation"];
    fix.pointer = node.id;
    await snippetCommand(fix, cache);
}
async function deleteOperation(cache, node) {
    deleteSnippetCommand(cache, node);
}
async function deletePath(cache, node) {
    deleteSnippetCommand(cache, node);
}
function noActiveOpenApiEditorGuard(cache) {
    const document = vscode.window.activeTextEditor?.document;
    if (!document || cache.getDocumentVersion(document) === types_1.OpenApiVersion.Unknown) {
        vscode.window.showErrorMessage(`Can't run the command, no active editor with OpenAPI file`);
        return true;
    }
    return false;
}
async function snippetCommand(fix, cache, useEdit) {
    const editor = vscode.window.activeTextEditor;
    if (noActiveOpenApiEditorGuard(cache) || !editor) {
        return;
    }
    const document = editor.document;
    const root = cache.getLastGoodParsedDocument(document);
    if (!root) {
        // FIXME display error message?
        return;
    }
    const bundle = await cache.getDocumentBundle(document);
    const version = cache.getDocumentVersion(document);
    const target = (0, json_utils_1.findJsonNodeValue)(root, fix.pointer);
    const context = {
        editor: editor,
        edit: null,
        issues: [],
        fix: (0, preserving_json_yaml_parser_1.simpleClone)(fix),
        bulk: false,
        auditContext: null,
        version: version,
        bundle: bundle,
        root: root,
        target: target,
        document: document,
    };
    if (useEdit === true) {
        context.bulk = true;
        context.skipConfirmation = true;
    }
    let finalFix = context.fix["fix"];
    let pointer = context.fix.pointer;
    let pointerPrefix = "";
    while ((0, preserving_json_yaml_parser_1.find)(root, pointer) === undefined) {
        const key = (0, pointer_1.getPointerLastSegment)(pointer);
        pointer = (0, pointer_1.getPointerParent)(pointer);
        const tmpFix = {};
        if (isArray(key)) {
            tmpFix[key] = [finalFix];
            pointerPrefix = "/" + key + "/0" + pointerPrefix;
        }
        else {
            tmpFix[key] = finalFix;
            pointerPrefix = "/" + key + pointerPrefix;
        }
        finalFix = tmpFix;
    }
    context.fix["fix"] = finalFix;
    context.target = (0, json_utils_1.findJsonNodeValue)(root, pointer);
    if (pointerPrefix.length > 0) {
        for (const parameter of context.fix.parameters) {
            parameter.path = pointerPrefix + parameter.path;
        }
    }
    switch (fix.type) {
        case types_1.FixType.Insert:
            (0, quickfix_1.fixInsert)(context);
    }
    if (useEdit) {
        await vscode.workspace.applyEdit(context.edit);
    }
    else {
        const snippetParameters = context.snippetParameters;
        if (snippetParameters) {
            await (0, util_1.processSnippetParameters)(editor, snippetParameters, context.dropBrackets);
            await editor.insertSnippet(snippetParameters.snippet, snippetParameters.location);
        }
    }
}
async function deleteSnippetCommand(cache, node) {
    const editor = vscode.window.activeTextEditor;
    if (noActiveOpenApiEditorGuard(cache) || !editor) {
        return;
    }
    const document = editor.document;
    const root = cache.getLastGoodParsedDocument(document);
    if (!root) {
        return;
    }
    const bundle = await cache.getDocumentBundle(document);
    if ("errors" in bundle) {
        return;
    }
    const version = cache.getDocumentVersion(document);
    const pointer = node.id;
    const target = (0, json_utils_1.findJsonNodeValue)(root, pointer);
    const context = {
        editor: editor,
        edit: new vscode.WorkspaceEdit(),
        issues: [],
        fix: {
            problem: [],
            type: types_1.FixType.Delete,
            title: "",
        },
        bulk: false,
        auditContext: null,
        version: version,
        bundle: bundle,
        root: root,
        target: target,
        document: document,
    };
    const deadRefs = (0, quickfix_1.getDeadRefs)(pointer, context);
    if (deadRefs.length > 0) {
        (0, quickfix_1.fixDelete)(context);
        const prompt = "Are you sure you want to delete unused schemas?";
        const confirmation = await vscode.window.showInformationMessage(prompt, "Yes", "No");
        if (confirmation && confirmation === "Yes") {
            let pointers = deadRefs.map((ref) => ref.replace("#/", "/"));
            const compsToRemove = getPointersByComponents(pointers, version);
            const allComps = getPointersByComponents(getAllComponentPointers(root, version), version);
            for (const [c, cPointers] of Object.entries(compsToRemove)) {
                if (c in allComps && cmpSets(allComps[c], cPointers)) {
                    pointers = pointers.filter((p) => !cPointers.has(p));
                    pointers.push(version === types_1.OpenApiVersion.V3 ? "/components/" + c : "/" + c);
                }
            }
            context.pointersToRemove = new Set(pointers);
            for (const pointer of pointers) {
                context.target = (0, json_utils_1.findJsonNodeValue)(root, pointer);
                (0, quickfix_1.fixDelete)(context);
            }
        }
    }
    else {
        (0, quickfix_1.fixDelete)(context);
    }
    (0, quickfix_1.fixDeleteApplyIfNeeded)(context);
    await vscode.workspace.applyEdit(context.edit);
}
function isArray(key) {
    return key === "security" || key === "servers";
}
function getAllComponentPointers(root, version) {
    const res = [];
    if (version === types_1.OpenApiVersion.V3) {
        const components = (0, json_utils_1.findJsonNodeValue)(root, "/components");
        if (components) {
            for (const component of components.getChildren()) {
                for (const item of component.getChildren()) {
                    res.push(item.pointer);
                }
            }
        }
    }
    else {
        const components = new Set([
            "responses",
            "parameters",
            "definitions",
            "securityDefinitions",
            "security",
        ]);
        for (const componentName of components) {
            const component = (0, json_utils_1.findJsonNodeValue)(root, "/" + componentName);
            if (component) {
                for (const item of component.getChildren()) {
                    res.push(item.pointer);
                }
            }
        }
    }
    return res;
}
function getPointersByComponents(pointers, version) {
    const res = {};
    const index = version === types_1.OpenApiVersion.V3 ? 2 : 1;
    for (const pointer of pointers) {
        const component = pointer.split("/")[index];
        if (!(component in res)) {
            res[component] = new Set();
        }
        res[component].add(pointer);
    }
    return res;
}
function cmpSets(set1, set2) {
    if (set1.size !== set2.size) {
        return false;
    }
    for (const item in set1) {
        if (!set2.has(item)) {
            return false;
        }
    }
    return true;
}
//# sourceMappingURL=commands.js.map