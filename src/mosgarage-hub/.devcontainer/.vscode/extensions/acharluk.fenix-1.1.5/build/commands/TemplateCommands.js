"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const FenixConfig_1 = require("../core/FenixConfig");
const QuickCreateTreeItem_1 = require("../providers/QuickCreateTreeItem");
const Fenix_1 = require("../core/Fenix");
exports.default = {
    'fenix.template.run': (e) => {
        Fenix_1.default.get().handleWebviewEvent({
            command: 'create',
            id: e.template.id,
        });
    },
    'fenix.template.fav': (e) => {
        if (e.id) {
            FenixConfig_1.default.get().togglePinned(e.id);
        }
        else if (e instanceof QuickCreateTreeItem_1.default && e.template) {
            FenixConfig_1.default.get().togglePinned(e.template.id);
        }
    },
    'fenix.template.share': (e) => {
        vscode.env.openExternal(vscode.Uri.parse(`https://twitter.com/intent/tweet?text=Check out this Fenix template! ${e.label}&url=https://github.com/ACharLuk/Fenix`));
    },
};
//# sourceMappingURL=TemplateCommands.js.map