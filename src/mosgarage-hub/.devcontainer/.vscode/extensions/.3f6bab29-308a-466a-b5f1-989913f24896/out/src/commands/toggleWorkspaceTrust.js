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
const common_1 = require("./common");
const config_1 = require("../plantuml/config");
class CommandToggleWorkspaceTrust extends common_1.Command {
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            yield config_1.config.toggleWorkspaceIsTrusted();
        });
    }
    constructor() {
        super("plantuml.toggleWorkspaceTrusted");
    }
}
exports.CommandToggleWorkspaceTrust = CommandToggleWorkspaceTrust;
//# sourceMappingURL=toggleWorkspaceTrust.js.map