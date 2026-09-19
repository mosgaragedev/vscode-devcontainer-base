"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const util_1 = require("./core/util");
const dashboard_1 = require("./core/dashboard");
const sidebar_1 = require("./core/sidebar");
function activate(context) {
    util_1.default.println('Activating Dashboard');
    new sidebar_1.default(new dashboard_1.default(context));
    util_1.default.println('Dashboard Activated');
    return;
}
exports.activate = activate;
;
function deactivate() {
    return;
}
exports.deactivate = deactivate;
;
//# sourceMappingURL=main.js.map