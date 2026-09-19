"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const typedRestClient = require("typed-rest-client/RestClient");
class DockerAPIV2Helper {
    constructor(baseUrl, user, password) {
        this.baseUrl = baseUrl;
        this.user = user;
        this.password = password;
        this.restClient = new typedRestClient.RestClient('vscode-pvt-registry-explorer', this.baseUrl.toString());
        this.authHeader = 'Basic ' + Buffer.from(`${this.user}:${this.password}`).toString('base64');
    }
    getCatalogs() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield this.restClient.get('/v2/_catalog', { additionalHeaders: { 'Authorization': this.authHeader } });
                if (resp.statusCode !== 200) {
                    vscode.window.showErrorMessage(`${this.baseUrl} returned ${resp.statusCode}.`);
                }
                if (resp.result) {
                    return resp.result.repositories;
                }
                else {
                    return [];
                }
            }
            catch (error) {
                this.showRequestError(error);
            }
            return [];
        });
    }
    getTags(repository) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield this.restClient.get(`/v2/${repository}/tags/list`, { additionalHeaders: { 'Authorization': this.authHeader } });
                if (resp.statusCode !== 200) {
                    vscode.window.showErrorMessage(`${this.baseUrl} returned ${resp.statusCode}.`);
                }
                if (resp.result) {
                    return resp.result;
                }
                else {
                    return null;
                }
            }
            catch (error) {
                this.showRequestError(error);
            }
            return null;
        });
    }
    getManifestV2(repository, reference) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield this.restClient.get(`/v2/${repository}/manifests/${reference}`, { additionalHeaders: { 'Authorization': this.authHeader }, acceptHeader: 'application/vnd.docker.distribution.manifest.v2+json' });
                if (resp.statusCode !== 200) {
                    vscode.window.showErrorMessage(`${this.baseUrl} returned ${resp.statusCode}.`);
                }
                if (resp.result) {
                    return resp.result;
                }
                else {
                    return null;
                }
            }
            catch (error) {
                this.showRequestError(error);
            }
            return null;
        });
    }
    deleteManifestV2(repository, reference) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resp = yield this.restClient.del(`/v2/${repository}/manifests/${reference}`, { additionalHeaders: { 'Authorization': this.authHeader } });
                if (resp.statusCode !== 202) {
                    vscode.window.showErrorMessage(`${this.baseUrl} returned ${resp.statusCode}.`);
                }
                else {
                    return true;
                }
            }
            catch (error) {
                this.showRequestError(error);
            }
            return false;
        });
    }
    showRequestError(error) {
        vscode.window.showErrorMessage(`Error occured while sending request to ${this.baseUrl}.\r\n` + error);
    }
}
exports.DockerAPIV2Helper = DockerAPIV2Helper;
//# sourceMappingURL=dockerUtils.js.map