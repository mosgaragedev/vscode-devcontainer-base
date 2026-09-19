"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mutex = void 0;
class Mutex {
    constructor() { }
    isLocked() {
        return !!this._promise;
    }
    async lock() {
        const acquire = () => {
            let unlock;
            this._promise = new Promise(resolve => {
                unlock = () => {
                    resolve();
                    this._promise = undefined;
                };
            });
            return unlock;
        };
        if (!this._promise) {
            return acquire();
        }
        let currentPromise = this._promise;
        while (true) {
            await currentPromise;
            if (!this._promise) {
                return acquire();
            }
            currentPromise = this._promise;
        }
    }
}
exports.Mutex = Mutex;
//# sourceMappingURL=mutex.js.map