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
exports.OasNode = exports.AuditNode = exports.ApiNode = void 0;
const vscode = __importStar(require("vscode"));
const base_1 = require("./base");
class ApiNode extends base_1.AbstractExplorerNode {
    constructor(parent, store, api) {
        super(parent, `${parent.id}-${api.desc.id}`, api.desc.name, vscode.TreeItemCollapsibleState.Collapsed);
        this.store = store;
        this.api = api;
        this.icon = "circuit-board";
        this.contextValue = "api";
    }
    async getChildren() {
        const res = [];
        const apiId = this.getApiId();
        const apiTechName = this.getApiTechnicalName();
        const readonly = apiId !== apiTechName;
        if (readonly) {
            this.store.readonlyApis.add(apiId);
        }
        res.push(new OasNode(this, this.store, this.api, readonly));
        res.push(new AuditNode(this, this.store, this.api));
        return res;
    }
    getApiId() {
        return this.api.desc.id;
    }
    getApiTechnicalName() {
        return this.api.desc.technicalName;
    }
    getCollectionTechnicalName() {
        return this.parent.getCollectionTechnicalName();
    }
}
exports.ApiNode = ApiNode;
class AuditNode extends base_1.AbstractExplorerNode {
    constructor(parent, store, api) {
        super(parent, `${parent.id}-audit}`, `Security Audit: ${score(api.assessment.grade)}`, vscode.TreeItemCollapsibleState.None);
        this.store = store;
        this.api = api;
        this.icon = api.assessment.isValid ? "verified" : "unverified";
        this.item.command = {
            command: "openapi.platform.openAuditReport",
            title: "",
            arguments: [api.desc.id],
        };
    }
}
exports.AuditNode = AuditNode;
class OasNode extends base_1.AbstractExplorerNode {
    constructor(parent, store, api, readonly) {
        super(parent, `${parent.id}-spec}`, "OpenAPI definition" + (readonly ? " (read only)" : ""), vscode.TreeItemCollapsibleState.None);
        this.store = store;
        this.api = api;
        this.icon = "code";
        this.item.command = {
            command: "openapi.platform.editApi",
            title: "",
            arguments: [api.desc.id],
        };
    }
}
exports.OasNode = OasNode;
function score(score) {
    const rounded = Math.abs(Math.round(score));
    if (score === 0) {
        return "0";
    }
    else if (rounded >= 1) {
        return rounded.toString();
    }
    return "less than 1";
}
//# sourceMappingURL=api.js.map