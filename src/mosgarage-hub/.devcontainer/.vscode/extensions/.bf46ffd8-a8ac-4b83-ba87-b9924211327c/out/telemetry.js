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
exports.sanitize = exports.sendTelemetry = exports.startTelemetry = exports.createTrackingEvent = void 0;
/*******************************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 * Distributed under license by Red Hat, Inc. All rights reserved.
 * This program is made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution,
 * and is available at http://www.eclipse.org/legal/epl-v20.html
 *
 * Contributors:
 * Red Hat, Inc. - initial API and implementation
 ******************************************************************************/
const vscode_redhat_telemetry_1 = require("@redhat-developer/vscode-redhat-telemetry");
const os = require("os");
const ipRegex = require("ip-regex");
const emailRegex = require("email-regex");
let telemetryService;
function createTrackingEvent(name, properties = {}) {
    return {
        type: 'track',
        name,
        properties
    };
}
exports.createTrackingEvent = createTrackingEvent;
function startTelemetry(context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const redHatService = yield (0, vscode_redhat_telemetry_1.getRedHatService)(context);
            telemetryService = yield redHatService.getTelemetryService();
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.log(`${error}`);
        }
        return telemetryService === null || telemetryService === void 0 ? void 0 : telemetryService.sendStartupEvent();
    });
}
exports.startTelemetry = startTelemetry;
function sendTelemetry(actionName, properties) {
    return __awaiter(this, void 0, void 0, function* () {
        return telemetryService === null || telemetryService === void 0 ? void 0 : telemetryService.send(createTrackingEvent(actionName, properties));
    });
}
exports.sendTelemetry = sendTelemetry;
function sanitize(message) {
    message = message.replace(os.homedir(), "$HOME");
    message = message.replace(os.tmpdir(), "$TMPDIR");
    message = message.replace(os.userInfo().username, "$USER");
    message = message.replace(ipRegex(), "$IPADDRESS");
    message = message.replace(emailRegex(), "$EMAIL");
    return message;
}
exports.sanitize = sanitize;
//# sourceMappingURL=telemetry.js.map