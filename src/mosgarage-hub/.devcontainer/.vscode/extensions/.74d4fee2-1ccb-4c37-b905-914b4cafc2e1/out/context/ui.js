"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uiContext = void 0;
const configuration_1 = require("../services/configuration");
const global_1 = require("./global");
class UIContext {
    init() {
        this.updateFromConfiguration();
    }
    updateFromConfiguration() {
        // don't update from configuration if diffViewMode is already set
        if (this._diffViewMode) {
            return;
        }
        this.diffViewMode = (0, configuration_1.getConfiguration)('defaultDiffViewMode');
    }
    set diffViewMode(mode) {
        (0, global_1.setContext)('foldersCompare.diffViewMode', mode);
        this._diffViewMode = mode;
    }
    get diffViewMode() {
        return this._diffViewMode || (0, configuration_1.getConfiguration)('defaultDiffViewMode');
    }
}
exports.uiContext = new UIContext();
//# sourceMappingURL=ui.js.map