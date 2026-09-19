"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const should = require("should");
const path = require("path");
const templates = require("../templates/templates");
const testUtils_1 = require("./testUtils");
describe('Templates: loading templates from disk', function () {
    beforeEach(() => {
        templates.reset();
    });
    it('Should throw error when attempting to use templates before loaded from file', async function () {
        await (0, testUtils_1.shouldThrowSpecificError)(() => templates.get('foobar'), 'Templates must be loaded from file before attempting to use.');
        await (0, testUtils_1.shouldThrowSpecificError)(() => templates.get('foobar'), 'Templates must be loaded from file before attempting to use.');
    });
    it('Should load all templates from files', async function () {
        await templates.loadTemplates(path.join(__dirname, '..', '..', 'resources', 'templates'));
        // check expected counts
        const numScriptObjectTypes = 12;
        should(templates.projectScriptTypes().length).equal(numScriptObjectTypes);
        should(Object.keys(templates.projectScriptTypes()).length).equal(numScriptObjectTypes);
        // check everything has a value
        should(templates.newSqlProjectTemplate).not.equal(undefined);
        for (const obj of templates.projectScriptTypes()) {
            should(obj.templateScript).not.equal(undefined);
        }
    });
});
//# sourceMappingURL=templates.test.js.map