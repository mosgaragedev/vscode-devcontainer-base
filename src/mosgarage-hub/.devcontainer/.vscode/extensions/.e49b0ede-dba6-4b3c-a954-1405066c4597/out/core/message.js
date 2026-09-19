"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Message {
    constructor(type, data = null) {
        this.type = null;
        this.data = null;
        this.type = type;
        this.data = data;
        return;
    }
    ;
    static FromObject(input) {
        let type = 'unknown';
        let data = null;
        if (typeof input.type === 'string')
            type = input.type;
        if (typeof input.data === 'object')
            data = input.data;
        return new Message(type, data);
    }
    ;
}
;
exports.default = Message;
//# sourceMappingURL=message.js.map