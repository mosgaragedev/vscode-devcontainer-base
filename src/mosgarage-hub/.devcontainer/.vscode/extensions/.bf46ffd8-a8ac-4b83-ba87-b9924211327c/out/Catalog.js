"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Catalog = void 0;
const request = require("request-promise-native");
class Catalog {
    constructor(endpoint) {
        this.endpoint = endpoint;
    }
    getCatalog() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.catalog || request({
                url: this.endpoint + "booster-catalog",
                json: true
            }).then((catalog) => this.catalog = catalog);
        });
    }
    zip(projectName, mission, runtime, runtimeVersion, groupId, artifactId, projectVersion) {
        return request(this.endpoint + 'launcher/zip', {
            qs: {
                mission,
                runtime,
                runtimeVersion,
                projectName,
                groupId,
                artifactId,
                projectVersion,
                ide: 'vscode'
            },
            encoding: null
        });
    }
}
exports.Catalog = Catalog;
//# sourceMappingURL=Catalog.js.map