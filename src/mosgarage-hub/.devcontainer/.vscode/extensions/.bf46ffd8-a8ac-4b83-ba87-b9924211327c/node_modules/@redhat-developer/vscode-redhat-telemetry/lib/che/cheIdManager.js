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
exports.CheIdManager = void 0;
const vscode_1 = require("vscode");
const uuid_1 = require("../utils/uuid");
let userId;
class CheIdManager {
    getRedHatUUID() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userId) {
                userId = yield this.loadRedHatUUID();
            }
            return userId;
        });
    }
    loadRedHatUUID() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Reading user id from @eclipse-che.ext-plugin');
                const che = vscode_1.extensions.getExtension('@eclipse-che.ext-plugin');
                if (che) {
                    console.log('Found Che API');
                    // grab user
                    const user = yield ((_a = che.exports.user) === null || _a === void 0 ? void 0 : _a.getCurrentUser());
                    if (user.id) {
                        console.log(`Found Che user id ${user.id}`);
                        return user.id;
                    }
                    console.log('No Che user id');
                }
                else {
                    console.log('No @eclipse-che.ext-plugin');
                }
            }
            catch (error) {
                console.log('Failed to get user id from Che', error);
            }
            //fall back to generating a random UUID
            console.log('fall back to generating a random UUID');
            return uuid_1.UUID.getRedHatUUID();
        });
    }
}
exports.CheIdManager = CheIdManager;
//# sourceMappingURL=cheIdManager.js.map