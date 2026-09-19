"use strict";
/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformValues = transformValues;
async function* transformValues(generator, transform) {
    for (;;) {
        const { value, done } = await generator.next();
        if (done) {
            return value;
        }
        else {
            yield transform(value);
        }
    }
}
//# sourceMappingURL=utils-gen.js.map