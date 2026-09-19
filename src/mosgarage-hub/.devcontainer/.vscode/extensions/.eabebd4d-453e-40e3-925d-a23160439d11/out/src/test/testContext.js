"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockDatabaseEndpointInfo = exports.mockProjectEndpointInfo = exports.mockConnectionInfo = exports.mockURIList = exports.mockConnectionProfile = exports.MockDacFxService = exports.mockDacFxOptionsResult = exports.mockSavePublishResult = exports.mockDacFxResult = void 0;
exports.getDeploymentOptions = getDeploymentOptions;
exports.createContext = createContext;
const vscode = require("vscode");
const azdata = require("azdata");
const path = require("path");
const TypeMoq = require("typemoq");
exports.mockDacFxResult = {
    operationId: '',
    success: true,
    errorMessage: '',
    report: ''
};
exports.mockSavePublishResult = {
    success: true,
    errorMessage: ''
};
/* Get the deployment options sample model */
function getDeploymentOptions() {
    const sampleDesc = 'Sample Description text';
    const sampleName = 'Sample Display Name';
    const defaultOptions = {
        excludeObjectTypes: { value: [], description: sampleDesc, displayName: sampleName },
        booleanOptionsDictionary: {
            'SampleProperty1': { value: false, description: sampleDesc, displayName: sampleName },
            'SampleProperty2': { value: false, description: sampleDesc, displayName: sampleName }
        },
        objectTypesDictionary: {
            'SampleProperty1': sampleName,
            'SampleProperty2': sampleName
        }
    };
    return defaultOptions;
}
exports.mockDacFxOptionsResult = {
    success: true,
    errorMessage: '',
    deploymentOptions: getDeploymentOptions()
};
class MockDacFxService {
    exportBacpac(_databaseName, _packageFilePath, _ownerUri, _taskExecutionMode) { return Promise.resolve(exports.mockDacFxResult); }
    importBacpac(_packageFilePath, _databaseName, _ownerUri, _taskExecutionMode) { return Promise.resolve(exports.mockDacFxResult); }
    extractDacpac(_databaseName, _packageFilePath, _applicationName, _applicationVersion, _ownerUri, _taskExecutionMode) { return Promise.resolve(exports.mockDacFxResult); }
    createProjectFromDatabase(_databaseName, _targetFilePath, _applicationName, _applicationVersion, _ownerUri, _extractTarget, _taskExecutionMode, _includePermissions) { return Promise.resolve(exports.mockDacFxResult); }
    deployDacpac(_packageFilePath, _targetDatabaseName, _upgradeExisting, _ownerUri, _taskExecutionMode, _sqlCommandVariableValues, _deploymentOptions) { return Promise.resolve(exports.mockDacFxResult); }
    generateDeployScript(_packageFilePath, _targetDatabaseName, _ownerUri, _taskExecutionMode, _sqlCommandVariableValues, _deploymentOptions) { return Promise.resolve(exports.mockDacFxResult); }
    generateDeployPlan(_packageFilePath, _targetDatabaseName, _ownerUri, _taskExecutionMode) { return Promise.resolve(exports.mockDacFxResult); }
    getOptionsFromProfile(_profilePath) { return Promise.resolve(exports.mockDacFxOptionsResult); }
    validateStreamingJob(_packageFilePath, _createStreamingJobTsql) { return Promise.resolve(exports.mockDacFxResult); }
    parseTSqlScript(_filePath, _databaseSchemaProvider) { return Promise.resolve({ containsCreateTableStatement: true }); }
    savePublishProfile(_profilePath, _databaseName, _connectionString, _sqlCommandVariableValues, _deploymentOptions) { return Promise.resolve(exports.mockSavePublishResult); }
}
exports.MockDacFxService = MockDacFxService;
function createContext() {
    let extensionPath = path.join(__dirname, '..', '..');
    return {
        context: {
            subscriptions: [],
            workspaceState: {
                get: () => { return undefined; },
                update: () => { return Promise.resolve(); },
                keys: () => []
            },
            globalState: {
                setKeysForSync: () => { },
                get: () => { return Promise.resolve(); },
                update: () => { return Promise.resolve(); },
                keys: () => []
            },
            extensionPath: extensionPath,
            asAbsolutePath: () => { return ''; },
            storagePath: '',
            globalStoragePath: '',
            logPath: '',
            extensionUri: vscode.Uri.parse(''),
            environmentVariableCollection: undefined,
            extensionMode: undefined,
            globalStorageUri: vscode.Uri.parse('test://'),
            logUri: vscode.Uri.parse('test://'),
            storageUri: vscode.Uri.parse('test://'),
            secrets: undefined,
            extension: undefined,
            languageModelAccessInformation: undefined,
        },
        dacFxService: TypeMoq.Mock.ofType(MockDacFxService),
        outputChannel: {
            name: '',
            append: () => { },
            appendLine: () => { },
            clear: () => { },
            show: () => { },
            hide: () => { },
            dispose: () => { },
            replace: () => { }
        }
    };
}
// Mock test data
exports.mockConnectionProfile = {
    connectionName: 'My Connection',
    serverName: 'My Server',
    databaseName: 'My Database',
    userName: 'My User',
    password: 'My Pwd',
    authenticationType: azdata.connection.AuthenticationType.SqlLogin,
    savePassword: false,
    groupFullName: 'My groupName',
    groupId: 'My GroupId',
    providerName: 'My Server',
    saveProfile: true,
    id: 'My Id',
    options: {
        server: 'My Server',
        database: 'My Database',
        user: 'My User',
        password: 'My Pwd',
        authenticationType: azdata.connection.AuthenticationType.SqlLogin,
        connectionName: 'My Connection Name'
    }
};
exports.mockURIList = [
    vscode.Uri.file('/test/folder/abc.sqlproj'),
    vscode.Uri.file('/test/folder/folder1/abc1.sqlproj'),
    vscode.Uri.file('/test/folder/folder2/abc2.sqlproj')
];
exports.mockConnectionInfo = {
    id: undefined,
    userName: 'My User',
    password: 'My Pwd',
    serverName: 'My Server',
    databaseName: 'My Database',
    connectionName: 'My Connection',
    providerName: undefined,
    groupId: 'My GroupId',
    groupFullName: 'My groupName',
    authenticationType: azdata.connection.AuthenticationType.SqlLogin,
    savePassword: false,
    saveProfile: true,
    options: {
        server: 'My Server',
        database: 'My Database',
        user: 'My User',
        password: 'My Pwd',
        authenticationType: 'SqlLogin',
        connectionName: 'My Connection Name'
    }
};
exports.mockProjectEndpointInfo = {
    endpointType: 2 /* mssql.SchemaCompareEndpointType.Project */,
    projectFilePath: '',
    extractTarget: 5 /* mssql.ExtractTarget.schemaObjectType */,
    targetScripts: [],
    dataSchemaProvider: '150',
    connectionDetails: exports.mockConnectionInfo,
    databaseName: '',
    serverDisplayName: '',
    serverName: '',
    ownerUri: '',
    packageFilePath: ''
};
exports.mockDatabaseEndpointInfo = {
    endpointType: 0 /* mssql.SchemaCompareEndpointType.Database */,
    databaseName: 'My Database',
    serverDisplayName: 'My Connection Name',
    serverName: 'My Server',
    connectionDetails: exports.mockConnectionInfo,
    ownerUri: 'MockUri',
    projectFilePath: '',
    extractTarget: 5 /* mssql.ExtractTarget.schemaObjectType */,
    targetScripts: [],
    dataSchemaProvider: '',
    packageFilePath: '',
    connectionName: 'My Connection Name'
};
//# sourceMappingURL=testContext.js.map