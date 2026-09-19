"use strict";
/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPathAndMethod = getPathAndMethod;
function getPathAndMethod(node) {
    if (node.contextValue === "operation") {
        const operation = node;
        return {
            path: operation.parent.path,
            method: operation.method,
        };
    }
    else if (node.contextValue == "tag-child") {
        const tagChild = node;
        return {
            path: tagChild.tagOp.name.path,
            method: tagChild.tagOp.name.method,
        };
    }
    else if (node.contextValue == "operation-id") {
        const operationId = node;
        return {
            path: operationId.path,
            method: operationId.method,
        };
    }
    throw new Error(`Unable to get path and method from the node: ${node.contextValue}`);
}
//# sourceMappingURL=util.js.map