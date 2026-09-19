"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIncludeAndExcludePaths = void 0;
const ui_1 = require("../utils/ui");
const configuration_1 = require("./configuration");
const logger_1 = require("./logger");
function getFilesFilterByType(type) {
    const filesFilter = (0, configuration_1.getConfiguration)(type);
    return filesFilter !== null && filesFilter !== void 0 ? filesFilter : [];
}
;
function getIncludeAndExcludePaths() {
    try {
        const excludeFiles = getFilesFilterByType('excludeFilter');
        const includeFiles = getFilesFilterByType('includeFilter');
        return {
            excludeFilter: excludeFiles.join(','),
            includeFilter: includeFiles.join(','),
        };
    }
    catch (error) {
        (0, ui_1.showErrorMessage)('Error while parsing include/exclude files', error);
        (0, logger_1.log)(error);
        return {
            excludeFilter: '',
            includeFilter: '',
        };
    }
}
exports.getIncludeAndExcludePaths = getIncludeAndExcludePaths;
;
//# sourceMappingURL=includeExcludeFilesGetter.js.map