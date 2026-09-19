"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const constants = require("./common/constants");
const utils_1 = require("./common/utils");
const mainController_1 = require("./controllers/mainController");
const telemetry_1 = require("./common/telemetry");
const sqlDatabaseProjectTaskProvider_1 = require("./tasks/sqlDatabaseProjectTaskProvider");
let controllers = [];
function activate(context) {
    void vscode.commands.executeCommand('setContext', 'azdataAvailable', !!(0, utils_1.getAzdataApi)());
    // Start the main controller
    const mainController = new mainController_1.default(context);
    controllers.push(mainController);
    context.subscriptions.push(mainController);
    context.subscriptions.push(telemetry_1.TelemetryReporter);
    // Register the Sql project task provider
    const taskProvider = vscode.tasks.registerTaskProvider(constants.sqlProjTaskType, new sqlDatabaseProjectTaskProvider_1.SqlDatabaseProjectTaskProvider());
    context.subscriptions.push(taskProvider);
    return mainController.activate();
}
function deactivate() {
    for (let controller of controllers) {
        controller.deactivate();
    }
}
//# sourceMappingURL=extension.js.map