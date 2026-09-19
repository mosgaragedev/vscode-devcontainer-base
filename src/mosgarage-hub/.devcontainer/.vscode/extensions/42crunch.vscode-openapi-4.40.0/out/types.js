"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixType = exports.OpenApiVersion = exports.extensionQualifiedId = exports.configId = void 0;
exports.configId = "openapi";
exports.extensionQualifiedId = "42Crunch.vscode-openapi";
var OpenApiVersion;
(function (OpenApiVersion) {
    OpenApiVersion[OpenApiVersion["Unknown"] = 0] = "Unknown";
    OpenApiVersion[OpenApiVersion["V2"] = 1] = "V2";
    OpenApiVersion[OpenApiVersion["V3"] = 2] = "V3";
    OpenApiVersion[OpenApiVersion["V3_1"] = 3] = "V3_1";
})(OpenApiVersion || (exports.OpenApiVersion = OpenApiVersion = {}));
var FixType;
(function (FixType) {
    FixType["Insert"] = "insert";
    FixType["Replace"] = "replace";
    FixType["Delete"] = "delete";
    FixType["RegexReplace"] = "regex-replace";
    FixType["RenameKey"] = "renameKey";
})(FixType || (exports.FixType = FixType = {}));
//# sourceMappingURL=types.js.map