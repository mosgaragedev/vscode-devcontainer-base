"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const should = require("should");
const azdata = require("azdata");
const vscode = require("vscode");
const sinon = require("sinon");
const TypeMoq = require("typemoq");
const baselines = require("./baselines/baselines");
const testUtils = require("./testUtils");
const constants = require("../common/constants");
const testContext_1 = require("./testContext");
const publishProfile_1 = require("../models/publishProfile/publishProfile");
let testContext;
describe('Publish profile tests', function () {
    before(async function () {
        await baselines.loadBaselines();
    });
    beforeEach(function () {
        testContext = (0, testContext_1.createContext)();
    });
    afterEach(function () {
        sinon.restore();
    });
    after(async function () {
        await testUtils.deleteGeneratedTestFolder();
    });
    it('Should read database name, integrated security connection string, and SQLCMD variables from publish profile', async function () {
        await baselines.loadBaselines();
        const profilePath = await testUtils.createTestFile(this.test, baselines.publishProfileIntegratedSecurityBaseline, 'publishProfile.publish.xml');
        const connectionResult = {
            connected: true,
            connectionId: 'connId',
            errorMessage: '',
            errorCode: 0
        };
        testContext.dacFxService.setup(x => x.getOptionsFromProfile(TypeMoq.It.isAny())).returns(async () => {
            return Promise.resolve(testContext_1.mockDacFxOptionsResult);
        });
        sinon.stub(azdata.connection, 'connect').resolves(connectionResult);
        const result = await (0, publishProfile_1.load)(vscode.Uri.file(profilePath), testContext.dacFxService.object);
        should(result.databaseName).equal('targetDb');
        should(result.sqlCmdVariables.size).equal(1);
        should(result.sqlCmdVariables.get('ProdDatabaseName')).equal('MyProdDatabase');
        should(result.connectionId).equal('connId');
        should(result.connection).equal('testserver (default)');
        should(result.options).equal(testContext_1.mockDacFxOptionsResult.deploymentOptions);
    });
    it('Should read database name, SQL login connection string, and SQLCMD variables from publish profile', async function () {
        await baselines.loadBaselines();
        const profilePath = await testUtils.createTestFile(this.test, baselines.publishProfileSqlLoginBaseline, 'publishProfile.publish.xml');
        const connectionResult = {
            providerName: 'MSSQL',
            connectionId: 'connId',
            options: {
                'server': 'testserver',
                'user': 'testUser'
            }
        };
        testContext.dacFxService.setup(x => x.getOptionsFromProfile(TypeMoq.It.isAny())).returns(async () => {
            return Promise.resolve(testContext_1.mockDacFxOptionsResult);
        });
        sinon.stub(azdata.connection, 'openConnectionDialog').resolves(connectionResult);
        const result = await (0, publishProfile_1.load)(vscode.Uri.file(profilePath), testContext.dacFxService.object);
        should(result.databaseName).equal('targetDb');
        should(result.sqlCmdVariables.size).equal(1);
        should(result.sqlCmdVariables.get('ProdDatabaseName')).equal('MyProdDatabase');
        should(result.connectionId).equal('connId');
        should(result.connection).equal('testserver (testUser)');
        should(result.options).equal(testContext_1.mockDacFxOptionsResult.deploymentOptions);
    });
    it('Should read SQLCMD variables correctly from publish profile even if DefaultValue is used', async function () {
        await baselines.loadBaselines();
        const profilePath = await testUtils.createTestFile(this.test, baselines.publishProfileDefaultValueBaseline, 'publishProfile.publish.xml');
        testContext.dacFxService.setup(x => x.getOptionsFromProfile(TypeMoq.It.isAny())).returns(async () => {
            return Promise.resolve(testContext_1.mockDacFxOptionsResult);
        });
        const result = await (0, publishProfile_1.load)(vscode.Uri.file(profilePath), testContext.dacFxService.object);
        should(result.sqlCmdVariables.size).equal(1);
        // the profile has both Value and DefaultValue, but Value should be the one used
        should(result.sqlCmdVariables.get('ProdDatabaseName')).equal('MyProdDatabase');
    });
    it('Should throw error when connecting does not work', async function () {
        await baselines.loadBaselines();
        const profilePath = await testUtils.createTestFile(this.test, baselines.publishProfileIntegratedSecurityBaseline, 'publishProfile.publish.xml');
        sinon.stub(azdata.connection, 'connect').throws(new Error('Could not connect'));
        await testUtils.shouldThrowSpecificError(async () => await (0, publishProfile_1.readPublishProfile)(vscode.Uri.file(profilePath)), constants.unableToCreatePublishConnection('Could not connect'));
    });
});
//# sourceMappingURL=publishProfile.test.js.map