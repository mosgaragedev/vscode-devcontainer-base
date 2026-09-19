"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const should = require("should");
const vscode = require("vscode");
const os = require("os");
const path = require("path");
const project_1 = require("../models/project");
const fileFolderTreeItem_1 = require("../models/tree/fileFolderTreeItem");
const projectTreeItem_1 = require("../models/tree/projectTreeItem");
const constants_1 = require("../common/constants");
describe('Project Tree tests', function () {
    it('Should correctly order tree nodes by type, then by name', function () {
        const root = os.platform() === 'win32' ? 'Z:\\' : '/';
        const sqlprojUri = vscode.Uri.file(`${root}Fake.sqlproj`);
        let inputNodes = [
            new fileFolderTreeItem_1.SqlObjectFileNode(vscode.Uri.file(`${root}C`), sqlprojUri, 'C'),
            new fileFolderTreeItem_1.SqlObjectFileNode(vscode.Uri.file(`${root}D`), sqlprojUri, 'D'),
            new fileFolderTreeItem_1.FolderNode(vscode.Uri.file(`${root}Z`), sqlprojUri, 'Z'),
            new fileFolderTreeItem_1.FolderNode(vscode.Uri.file(`${root}X`), sqlprojUri, 'X'),
            new fileFolderTreeItem_1.SqlObjectFileNode(vscode.Uri.file(`${root}B`), sqlprojUri, 'B'),
            new fileFolderTreeItem_1.SqlObjectFileNode(vscode.Uri.file(`${root}A`), sqlprojUri, 'A'),
            new fileFolderTreeItem_1.FolderNode(vscode.Uri.file(`${root}W`), sqlprojUri, 'W'),
            new fileFolderTreeItem_1.FolderNode(vscode.Uri.file(`${root}Y`), sqlprojUri, 'Y')
        ];
        inputNodes = inputNodes.sort(fileFolderTreeItem_1.sortFileFolderNodes);
        const expectedNodes = [
            new fileFolderTreeItem_1.FolderNode(vscode.Uri.file(`${root}W`), sqlprojUri, 'W'),
            new fileFolderTreeItem_1.FolderNode(vscode.Uri.file(`${root}X`), sqlprojUri, 'X'),
            new fileFolderTreeItem_1.FolderNode(vscode.Uri.file(`${root}Y`), sqlprojUri, 'Y'),
            new fileFolderTreeItem_1.FolderNode(vscode.Uri.file(`${root}Z`), sqlprojUri, 'Z'),
            new fileFolderTreeItem_1.SqlObjectFileNode(vscode.Uri.file(`${root}A`), sqlprojUri, 'A'),
            new fileFolderTreeItem_1.SqlObjectFileNode(vscode.Uri.file(`${root}B`), sqlprojUri, 'B'),
            new fileFolderTreeItem_1.SqlObjectFileNode(vscode.Uri.file(`${root}C`), sqlprojUri, 'C'),
            new fileFolderTreeItem_1.SqlObjectFileNode(vscode.Uri.file(`${root}D`), sqlprojUri, 'D')
        ];
        should(inputNodes.map(n => n.relativeProjectUri.path)).deepEqual(expectedNodes.map(n => n.relativeProjectUri.path));
    });
    it('Should build tree from Project file correctly', function () {
        const root = os.platform() === 'win32' ? 'Z:\\' : '/';
        const proj = new project_1.Project(vscode.Uri.file(`${root}TestProj.sqlproj`).fsPath);
        // nested entries before explicit top-level folder entry
        // also, ordering of files/folders at all levels
        proj.sqlObjectScripts.push(proj.createFileProjectEntry(path.join('someFolder', 'bNestedTest.sql'), 0 /* EntryType.File */));
        proj.folders.push(proj.createFileProjectEntry(path.join('someFolder', 'bNestedFolder'), 1 /* EntryType.Folder */));
        proj.sqlObjectScripts.push(proj.createFileProjectEntry(path.join('someFolder', 'aNestedTest.sql'), 0 /* EntryType.File */));
        proj.folders.push(proj.createFileProjectEntry(path.join('someFolder', 'aNestedFolder'), 1 /* EntryType.Folder */));
        proj.folders.push(proj.createFileProjectEntry('someFolder', 1 /* EntryType.Folder */));
        // duplicate files
        proj.sqlObjectScripts.push(proj.createFileProjectEntry('duplicate.sql', 0 /* EntryType.File */));
        proj.sqlObjectScripts.push(proj.createFileProjectEntry('duplicate.sql', 0 /* EntryType.File */));
        // duplicate folders
        proj.folders.push(proj.createFileProjectEntry('duplicateFolder', 1 /* EntryType.Folder */));
        proj.folders.push(proj.createFileProjectEntry('duplicateFolder', 1 /* EntryType.Folder */));
        const tree = new projectTreeItem_1.ProjectRootTreeItem(proj);
        should(tree.children.map(x => x.relativeProjectUri.path)).deepEqual([
            '/TestProj/Database References',
            '/TestProj/SQLCMD Variables',
            '/TestProj/duplicateFolder',
            '/TestProj/someFolder',
            '/TestProj/duplicate.sql'
        ]);
        should(tree.children.find(x => x.relativeProjectUri.path === '/TestProj/someFolder')?.children.map(y => y.relativeProjectUri.path)).deepEqual([
            '/TestProj/someFolder/aNestedFolder',
            '/TestProj/someFolder/bNestedFolder',
            '/TestProj/someFolder/aNestedTest.sql',
            '/TestProj/someFolder/bNestedTest.sql'
        ]);
        should(tree.children.map(x => x.treeItem.contextValue)).deepEqual([
            constants_1.DatabaseProjectItemType.referencesRoot,
            constants_1.DatabaseProjectItemType.sqlcmdVariablesRoot,
            constants_1.DatabaseProjectItemType.folder,
            constants_1.DatabaseProjectItemType.folder,
            constants_1.DatabaseProjectItemType.sqlObjectScript
        ]);
        should(tree.children.find(x => x.relativeProjectUri.path === '/TestProj/someFolder')?.children.map(y => y.treeItem.contextValue)).deepEqual([
            constants_1.DatabaseProjectItemType.folder,
            constants_1.DatabaseProjectItemType.folder,
            constants_1.DatabaseProjectItemType.sqlObjectScript,
            constants_1.DatabaseProjectItemType.sqlObjectScript
        ]);
    });
    it('Should be able to parse windows relative path as platform safe path', function () {
        const root = os.platform() === 'win32' ? 'Z:\\' : '/';
        const proj = new project_1.Project(vscode.Uri.file(`${root}TestProj.sqlproj`).fsPath);
        // nested entries before explicit top-level folder entry
        // also, ordering of files/folders at all levels
        proj.sqlObjectScripts.push(proj.createFileProjectEntry('someFolder1\\MyNestedFolder1\\MyFile1.sql', 0 /* EntryType.File */));
        proj.folders.push(proj.createFileProjectEntry('someFolder1\\MyNestedFolder2', 1 /* EntryType.Folder */));
        proj.folders.push(proj.createFileProjectEntry('someFolder1', 1 /* EntryType.Folder */));
        proj.folders.push(proj.createFileProjectEntry('someFolder1\\MyNestedFolder1', 1 /* EntryType.Folder */));
        proj.sqlObjectScripts.push(proj.createFileProjectEntry('someFolder1\\MyFile2.sql', 0 /* EntryType.File */));
        const tree = new projectTreeItem_1.ProjectRootTreeItem(proj);
        should(tree.children.map(x => x.relativeProjectUri.path)).deepEqual([
            '/TestProj/Database References',
            '/TestProj/SQLCMD Variables',
            '/TestProj/someFolder1'
        ]);
        should(tree.children.find(x => x.relativeProjectUri.path === '/TestProj/someFolder1')?.children.map(y => y.relativeProjectUri.path)).deepEqual([
            '/TestProj/someFolder1/MyNestedFolder1',
            '/TestProj/someFolder1/MyNestedFolder2',
            '/TestProj/someFolder1/MyFile2.sql'
        ]);
    });
    it('Should be able to parse and include relative paths outside project folder', function () {
        const root = os.platform() === 'win32' ? 'Z:\\Level1\\Level2\\' : '/Root/Level1/Level2/';
        const proj = new project_1.Project(vscode.Uri.file(`${root}TestProj.sqlproj`).fsPath);
        // nested entries before explicit top-level folder entry
        // also, ordering of files/folders at all levels
        proj.sqlObjectScripts.push(proj.createFileProjectEntry('..\\someFolder1\\MyNestedFolder1\\MyFile1.sql', 0 /* EntryType.File */));
        proj.sqlObjectScripts.push(proj.createFileProjectEntry('..\\..\\someFolder2\\MyFile2.sql', 0 /* EntryType.File */));
        proj.sqlObjectScripts.push(proj.createFileProjectEntry('..\\..\\someFolder3', 1 /* EntryType.Folder */)); // folder should not be counted (same as SSDT)
        const tree = new projectTreeItem_1.ProjectRootTreeItem(proj);
        should(tree.children.map(x => x.relativeProjectUri.path)).deepEqual([
            '/TestProj/Database References',
            '/TestProj/SQLCMD Variables',
            '/TestProj/MyFile1.sql',
            '/TestProj/MyFile2.sql'
        ]);
    });
});
//# sourceMappingURL=projectTree.test.js.map