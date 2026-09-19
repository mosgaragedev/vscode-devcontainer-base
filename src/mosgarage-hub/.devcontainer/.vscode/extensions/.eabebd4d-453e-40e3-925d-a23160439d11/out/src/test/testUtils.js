"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldThrowSpecificError = shouldThrowSpecificError;
exports.createTestSqlProject = createTestSqlProject;
exports.getTestProjectPath = getTestProjectPath;
exports.createTestSqlProjFile = createTestSqlProjFile;
exports.createTestProject = createTestProject;
exports.createTestDataSources = createTestDataSources;
exports.generateTestFolderPath = generateTestFolderPath;
exports.generateBaseFolderName = generateBaseFolderName;
exports.createTestFile = createTestFile;
exports.createDummyFileStructure = createDummyFileStructure;
exports.createDummyFileStructureWithPrePostDeployScripts = createDummyFileStructureWithPrePostDeployScripts;
exports.createListOfFiles = createListOfFiles;
exports.createOtherDummyFiles = createOtherDummyFiles;
exports.deleteGeneratedTestFolder = deleteGeneratedTestFolder;
const path = require("path");
const os = require("os");
const constants = require("../common/constants");
const templates = require("../templates/templates");
const fs_1 = require("fs");
const should = require("should");
const assert_1 = require("assert");
const project_1 = require("../models/project");
const vscode_1 = require("vscode");
const utils_1 = require("../common/utils");
async function shouldThrowSpecificError(block, expectedMessage, details) {
    let succeeded = false;
    try {
        await block();
        succeeded = true;
    }
    catch (err) {
        should(err.message).equal(expectedMessage);
    }
    if (succeeded) {
        throw new assert_1.AssertionError({ message: `Operation succeeded, but expected failure with exception: "${expectedMessage}".${details ? '  ' + details : ''}` });
    }
}
async function createTestSqlProject(test) {
    const projPath = await getTestProjectPath(test);
    await (await (0, utils_1.getSqlProjectsService)()).createProject(projPath, 0 /* mssql.ProjectType.SdkStyle */);
    return await project_1.Project.openProject(projPath);
}
async function getTestProjectPath(test) {
    return path.join(await generateTestFolderPath(test), 'TestProject', 'TestProject.sqlproj');
}
async function createTestSqlProjFile(test, contents, folderPath) {
    folderPath = folderPath ?? path.join(await generateTestFolderPath(test), 'TestProject');
    const macroDict = new Map([['PROJECT_DSP', constants.defaultDSP]]);
    contents = templates.macroExpansion(contents, macroDict);
    return await createTestFile(test, contents, 'TestProject.sqlproj', folderPath);
}
async function createTestProject(test, contents, folderPath) {
    return await project_1.Project.openProject(await createTestSqlProjFile(test, contents, folderPath));
}
async function createTestDataSources(test, contents, folderPath) {
    return await createTestFile(test, contents, constants.dataSourcesFileName, folderPath);
}
async function generateTestFolderPath(test) {
    const testName = test?.title === undefined ? '' : `${normalizeTestName(test?.title)}_`;
    const folderPath = path.join(generateBaseFolderName(), `Test_${testName}${new Date().getTime()}_${Math.floor((Math.random() * 1000))}`);
    await fs_1.promises.mkdir(folderPath, { recursive: true });
    return folderPath;
}
function normalizeTestName(rawTestName) {
    return rawTestName.replace(/[^\w]+/g, '').substring(0, 40); // remove all non-alphanumeric characters, then trim to a reasonable length
}
function generateBaseFolderName() {
    const folderPath = path.join(os.tmpdir(), 'ADS_Tests');
    return folderPath;
}
async function createTestFile(test, contents, fileName, folderPath) {
    folderPath = folderPath ?? await generateTestFolderPath(test);
    const filePath = path.join(folderPath, fileName);
    await fs_1.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs_1.promises.writeFile(filePath, contents);
    return filePath;
}
/**
 * TestFolder directory structure
 * 		- file1.sql
 * 		- folder1
 * 			-file1.sql
 * 			-file2.sql
 * 			-file3.sql
 * 			-file4.sql
 * 			-file5.sql
 *	 	- folder2
 * 			-file1.sql
 * 			-file2.sql
 * 			-file3.sql
 * 			-file4.sql
 * 			-file5.sql
 * 		- file2.txt
 *
 * @param test
 * @param createList Boolean specifying to create a list of the files and folders been created
 * @param list List of files and folders that are been created
 * @param testFolderPath
 */
async function createDummyFileStructure(test, createList, list, testFolderPath) {
    testFolderPath = testFolderPath ?? await generateTestFolderPath(test);
    let filePath = path.join(testFolderPath, 'file1.sql');
    await fs_1.promises.writeFile(filePath, '');
    if (createList) {
        list?.push(vscode_1.Uri.file(filePath));
    }
    for (let dirCount = 1; dirCount <= 2; dirCount++) {
        let dirName = path.join(testFolderPath, `folder${dirCount}`);
        await fs_1.promises.mkdir(dirName, { recursive: true });
        for (let fileCount = 1; fileCount <= 5; fileCount++) {
            let fileName = path.join(dirName, `file${fileCount}.sql`);
            await fs_1.promises.writeFile(fileName, '');
            if (createList) {
                list?.push(vscode_1.Uri.file(fileName));
            }
        }
    }
    filePath = path.join(testFolderPath, 'file2.txt');
    await fs_1.promises.writeFile(filePath, '');
    if (createList) {
        list?.push(vscode_1.Uri.file(filePath));
    }
    return testFolderPath;
}
/**
 * TestFolder directory structure
 * 		- file1.sql
 * 		- folder1
 * 			-file1.sql
 * 			-file2.sql
 * 			-file3.sql
 * 			-file4.sql
 * 			-file5.sql
 * 			-Script.PostDeployment2.sql
 * 			- nestedFolder
 * 				-otherFile1.sql
 * 				-otherFile2.sql
 *	 	- folder2
 * 			-file1.sql
 * 			-file2.sql
 * 			-file3.sql
 * 			-file4.sql
 * 			-file5.sql
 * 		- file2.txt
 * 		- Script.PreDeployment1.sql
 * 		- Script.PreDeployment2.sql
 * 		- Script.PostDeployment1.sql
 *
 * @param test
 * @param createList Boolean specifying to create a list of the files and folders been created
 * @param list List of files and folders that are been created
 * @param testFolderPath
 */
async function createDummyFileStructureWithPrePostDeployScripts(test, createList, list, testFolderPath) {
    testFolderPath = await createDummyFileStructure(test, createList, list, testFolderPath);
    // add pre-deploy scripts
    const predeployscript1 = path.join(testFolderPath, 'Script.PreDeployment1.sql');
    await fs_1.promises.writeFile(predeployscript1, '');
    const predeployscript2 = path.join(testFolderPath, 'Script.PreDeployment2.sql');
    await fs_1.promises.writeFile(predeployscript2, '');
    if (createList) {
        list?.push(vscode_1.Uri.file(predeployscript1));
        list?.push(vscode_1.Uri.file(predeployscript2));
    }
    // add post-deploy scripts
    const postdeployscript1 = path.join(testFolderPath, 'Script.PostDeployment1.sql');
    await fs_1.promises.writeFile(postdeployscript1, '');
    const postdeployscript2 = path.join(testFolderPath, 'folder1', 'Script.PostDeployment2.sql');
    await fs_1.promises.writeFile(postdeployscript2, '');
    // add nested files
    await fs_1.promises.mkdir(path.join(testFolderPath, 'folder1', 'nestedFolder'));
    const otherfile1 = path.join(testFolderPath, 'folder1', 'nestedFolder', 'otherFile1.sql');
    await fs_1.promises.writeFile(otherfile1, '');
    const otherfile2 = path.join(testFolderPath, 'folder1', 'nestedFolder', 'otherFile2.sql');
    await fs_1.promises.writeFile(otherfile2, '');
    if (createList) {
        list?.push(vscode_1.Uri.file(postdeployscript1));
        list?.push(vscode_1.Uri.file(postdeployscript2));
    }
    return testFolderPath;
}
async function createListOfFiles(test, filePath) {
    let fileFolderList = [];
    await createDummyFileStructure(test, true, fileFolderList, filePath);
    return fileFolderList;
}
/**
 * TestFolder directory structure
 * 		- file1.sql
 * 		- folder1
 * 			- file1.sql
 * 			- file2.sql
 * 			- test1.sql
 * 			- test2.sql
 * 			- testLongerName.sql
 *	 	- folder2
 * 			- file1.sql
 * 			- file2.sql
 * 			- Script.PreDeployment1.sql
 * 			- Script.PostDeployment1.sql
 * 			- Script.PostDeployment2.sql
 *
 */
async function createOtherDummyFiles(testFolderPath) {
    const filesList = [];
    let filePath = path.join(testFolderPath, 'file1.sql');
    await fs_1.promises.writeFile(filePath, '');
    filesList.push(vscode_1.Uri.file(filePath));
    for (let dirCount = 1; dirCount <= 2; dirCount++) {
        let dirName = path.join(testFolderPath, `folder${dirCount}`);
        await fs_1.promises.mkdir(dirName, { recursive: true });
        for (let fileCount = 1; fileCount <= 2; fileCount++) {
            let fileName = path.join(dirName, `file${fileCount}.sql`);
            await fs_1.promises.writeFile(fileName, '');
            filesList.push(vscode_1.Uri.file(fileName));
        }
    }
    const test1 = path.join(testFolderPath, 'folder1', 'test1.sql');
    await fs_1.promises.writeFile(test1, '');
    filesList.push(vscode_1.Uri.file(test1));
    const test2 = path.join(testFolderPath, 'folder1', 'test2.sql');
    await fs_1.promises.writeFile(test2, '');
    filesList.push(vscode_1.Uri.file(test2));
    const testLongerName = path.join(testFolderPath, 'folder1', 'testLongerName.sql');
    await fs_1.promises.writeFile(testLongerName, '');
    filesList.push(vscode_1.Uri.file(testLongerName));
    const preDeploymentScript = path.join(testFolderPath, 'folder2', 'Script.PreDeployment1.sql');
    await fs_1.promises.writeFile(preDeploymentScript, '');
    filesList.push(vscode_1.Uri.file(preDeploymentScript));
    const postDeploymentScript1 = path.join(testFolderPath, 'folder2', 'Script.PostDeployment1.sql');
    await fs_1.promises.writeFile(postDeploymentScript1, '');
    filesList.push(vscode_1.Uri.file(preDeploymentScript));
    const postDeploymentScript2 = path.join(testFolderPath, 'folder2', 'Script.PostDeployment2.sql');
    await fs_1.promises.writeFile(postDeploymentScript2, '');
    filesList.push(vscode_1.Uri.file(postDeploymentScript2));
    return filesList;
}
/**
 * Deletes folder generated for testing
 */
async function deleteGeneratedTestFolder() {
    const testFolderPath = generateBaseFolderName();
    if (await (0, utils_1.exists)(testFolderPath)) {
        await fs_1.promises.rm(testFolderPath, { recursive: true }); // cleanup folder
    }
}
//# sourceMappingURL=testUtils.js.map