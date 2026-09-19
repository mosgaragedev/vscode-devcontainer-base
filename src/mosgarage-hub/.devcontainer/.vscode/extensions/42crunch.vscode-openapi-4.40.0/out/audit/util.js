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
exports.getLocationByPointer = getLocationByPointer;
exports.saveAuditReportToTempDirectory = saveAuditReportToTempDirectory;
exports.clearAuditReportTempDirectories = clearAuditReportTempDirectories;
const vscode = __importStar(require("vscode"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const fs_1 = require("../util/fs");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
function getLocationByPointer(document, root, pointer) {
    // FIXME markerNode can only be returned for the main document
    // perhaps we need to pass Audit here and make this function
    // to return documentUri of current/main document
    // depending on pointer == ""?
    let location;
    if (pointer == "") {
        // if pointer == "" return location for well known node
        // which is depending on OAS version is either "/swagger" or "/openapi
        if (root["openapi"]) {
            location = (0, preserving_json_yaml_parser_1.findLocationForJsonPointer)(root, "/openapi");
        }
        else {
            location = (0, preserving_json_yaml_parser_1.findLocationForJsonPointer)(root, "/swagger");
        }
    }
    else {
        location = findLocationForJsonPointerResolvingRefs(root, pointer)[0];
    }
    if (location) {
        const start = location.key ? location.key.start : location.value.start;
        const position = document.positionAt(start);
        const line = document.lineAt(position.line);
        const range = new vscode.Range(new vscode.Position(position.line, line.firstNonWhitespaceCharacterIndex), new vscode.Position(position.line, line.range.end.character));
        return [position.line, range];
    }
    else {
        throw new Error(`Unable to locate node: ${pointer}`);
    }
}
function findLocationForJsonPointerResolvingRefs(root, jsonPointer) {
    const path = (0, preserving_json_yaml_parser_1.parseJsonPointer)(jsonPointer);
    if (path.length === 0) {
        // special case "" pointing to the root
        const range = (0, preserving_json_yaml_parser_1.getRootRange)(root);
        return [{ value: range }, root];
    }
    let current = root;
    let i = 0;
    while (i < path.length - 1 && current) {
        if (current[path[i]] !== undefined) {
            current = current[path[i]];
            i++;
        }
        else if (current.hasOwnProperty("$ref")) {
            current = findLocationForJsonPointerResolvingRefs(root, current["$ref"])[1];
        }
        else {
            return [undefined, undefined];
        }
    }
    if (current != undefined && current[path[i]] === undefined && current.hasOwnProperty("$ref")) {
        current = findLocationForJsonPointerResolvingRefs(root, current["$ref"])[1];
    }
    if (current !== undefined) {
        return [(0, preserving_json_yaml_parser_1.getLocation)(current, path[i]), current[path[i]]];
    }
    return [undefined, undefined];
}
async function saveAuditReportToTempDirectory(data) {
    const tempAuditDirectory = (0, fs_1.createTempDirectory)("audit-report");
    await (0, promises_1.writeFile)(`${tempAuditDirectory}/report.json`, JSON.stringify(data, null, 2));
    return tempAuditDirectory;
}
async function clearAuditReportTempDirectories(auditContext) {
    for (const dir of Object.values(auditContext.auditTempDirectories)) {
        const openapiFilename = (0, node_path_1.join)(dir, "openapi.json");
        if (await (0, fs_1.exists)(openapiFilename)) {
            await (0, promises_1.unlink)(openapiFilename);
        }
        const reportFilename = (0, node_path_1.join)(dir, "report.json");
        if (await (0, fs_1.exists)(reportFilename)) {
            await (0, promises_1.unlink)(reportFilename);
        }
        const todoFilename = (0, node_path_1.join)(dir, "todo.json");
        if (await (0, fs_1.exists)(todoFilename)) {
            await (0, promises_1.unlink)(todoFilename);
        }
        const sqgFilename = (0, node_path_1.join)(dir, "sqg.json");
        if (await (0, fs_1.exists)(sqgFilename)) {
            await (0, promises_1.unlink)(sqgFilename);
        }
        await (0, promises_1.rmdir)(dir);
    }
}
//# sourceMappingURL=util.js.map