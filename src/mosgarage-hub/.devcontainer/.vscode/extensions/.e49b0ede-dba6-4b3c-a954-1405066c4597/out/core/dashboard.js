"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const util_1 = require("./util");
const config_1 = require("./config");
const message_1 = require("./message");
const project_entry_1 = require("./project-entry");
const project_folder_1 = require("./project-folder");
class Dashboard {
    ////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////
    constructor(ext) {
        this.ext = ext;
        this.conf = new config_1.default;
        // if a new window opens and it is a blank workspace then
        // allow the dashboard to open itself if enabled.
        if (this.conf.openOnNewWindow)
            if (typeof vscode.workspace.name === 'undefined')
                if (vscode.workspace.textDocuments.length === 0)
                    this.open();
        return;
    }
    ;
    ////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////
    open() {
        // settings changed via the settings ui do not take effect unless
        // we reload them. im sure its not that big of a deal but most
        // users are not going to need this happening every time.
        // this.conf = new Config;
        if (this.panel) {
            this.panel.reveal();
            return;
        }
        this.panel = vscode.window.createWebviewPanel('dashyeah-dashboard-main', 'Dashboard', {
            viewColumn: vscode.ViewColumn.One,
            preserveFocus: true
        }, {
            retainContextWhenHidden: true,
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(this.ext.extensionPath)
            ]
        });
        this.panel.iconPath = vscode.Uri.file(path.join(this.ext.extensionPath, 'local', 'gfx', 'icon.svg'));
        (this.panel)
            .onDidDispose(this.onClosed.bind(this));
        (this.panel.webview)
            .onDidReceiveMessage(this.onMessage.bind(this));
        (this.panel.webview)
            .html = this.generateContent();
        return;
    }
    ;
    send(msg) {
        if (!this.panel)
            return;
        (this.panel.webview)
            .postMessage(msg);
        return;
    }
    ;
    sendv(type, data = null) {
        if (!this.panel)
            return;
        let msg = new message_1.default(type, data);
        util_1.default.println(type, 'Dashboard::sendv');
        (this.panel.webview)
            .postMessage(msg);
        return;
    }
    ;
    ////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////
    generateContent() {
        if (!this.panel)
            return '';
        let filename = path.join(this.ext.extensionPath, 'local', 'html', 'main.html');
        let tokens = {
            "%COLUMNSIZING%": this.conf.columnSizing,
            "%CSPSOURCE%": this.panel.webview.cspSource,
            "%ROOT%": this.localToWebpath(path.join(this.ext.extensionPath)),
            "%NMROOT%": this.localToWebpath(path.join(this.ext.extensionPath, 'node_modules')),
            "%CSSROOT%": this.localToWebpath(path.join(this.ext.extensionPath, 'local', 'css')),
            "%JSROOT%": this.localToWebpath(path.join(this.ext.extensionPath, 'local', 'js')),
            "%IMGROOT%": this.localToWebpath(path.join(this.ext.extensionPath, 'local', 'img'))
        };
        let content = (fs
            .readFileSync(filename)
            .toString());
        ////////
        for (const token in tokens)
            content = content.replace((new RegExp(token, 'g')), tokens[token]);
        ////////
        return content;
    }
    ;
    generateDatabase() {
        return {};
    }
    ;
    ////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////
    onClosed() {
        util_1.default.println('Dashboard Closed');
        delete this.panel;
        return;
    }
    ;
    ////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////
    onMessage(input) {
        let msg = message_1.default.FromObject(input);
        if (this.conf.debug)
            util_1.default.println(JSON.stringify(msg), 'Dashboard::onMessage');
        switch (msg.type) {
            case 'hey':
                this.onHey(msg);
                break;
            case 'pickdir':
                this.onPickDir(msg);
                break;
            case 'foldernew':
                this.onFolderNew(msg);
                break;
            case 'projectopen':
                this.onProjectOpen(msg);
                break;
            case 'projectnew':
                this.onProjectNew(msg);
                break;
            case 'projectdel':
                this.onProjectDel(msg);
                break;
            case 'projectset':
                this.onProjectSet(msg);
                break;
            case 'projectmove':
                this.onProjectMove(msg);
                break;
            case 'configset':
                this.onConfigSet(msg);
                break;
            case 'folderopen':
                this.onFolderOpen(msg);
                break;
            case 'folderopenall':
                this.onFolderOpenAll(msg);
                break;
            case 'folderclose':
                this.onFolderClose(msg);
                break;
            case 'foldercloseall':
                this.onFolderCloseAll(msg);
                break;
            case 'foldercolourset':
                this.onFolderColourSet(msg);
                break;
            case 'foldercolourrng':
                this.onFolderColourRng(msg);
                break;
            case 'foldersort':
                this.onFolderSort(msg);
                break;
        }
        return;
    }
    ;
    onHey(msg) {
        let config = this.conf.getObject();
        this.sendv('sup', config);
        return;
    }
    ;
    onPickDir(msg) {
        let self = this;
        (vscode.window)
            .showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false
        })
            .then(function (Selected) {
            if (typeof Selected === 'undefined')
                return;
            if (typeof Selected[0] === 'undefined')
                return;
            let fsp = util_1.default.fixDriveLetters(Selected[0].fsPath);
            let uri = util_1.default.fixDriveLetters(Selected[0].toString());
            self.sendv('dirpick', {
                label: fsp,
                uri: uri
            });
            return;
        });
        return;
    }
    ;
    onFolderNew(msg) {
        this.conf.addFolder(msg.data.name);
        this.onHey(msg);
        return;
    }
    ;
    onProjectOpen(msg) {
        let project = this.conf.findProject(msg.data.id);
        let openNewWindow = msg.data.openNewWindow ?? false;
        if (project instanceof project_entry_1.default) {
            util_1.default.println(`open ${msg.data.id} ${msg.data.openNewWindow}`, 'Dashboard::onOpen');
            vscode.commands.executeCommand('vscode.openFolder', project.getUriObject(), { forceNewWindow: openNewWindow });
            return;
        }
        return;
    }
    ;
    onProjectNew(msg) {
        this.conf.addProject(msg.data.name, msg.data.uri, msg.data.parent);
        this.onHey(msg);
        return;
    }
    ;
    onProjectDel(msg) {
        this.conf.removeProject(msg.data.id);
        this.onHey(msg);
        return;
    }
    ;
    onProjectMove(msg) {
        if (typeof msg.data.into !== 'undefined')
            this.onProjectMove_Into(msg);
        else if (typeof msg.data.before !== 'undefined')
            this.onProjectMove_Before(msg);
        this.onHey(msg);
        return;
    }
    ;
    onProjectMove_Into(msg) {
        this.conf.moveProject(msg.data.id, msg.data.into ?? null, msg.data.before ?? null);
        return;
    }
    ;
    onProjectMove_Before(msg) {
        this.conf.moveProject(msg.data.id, msg.data.into ?? null, msg.data.before ?? null);
        return;
    }
    ;
    onProjectSet(msg) {
        this.conf.updateProject(msg.data.id, msg.data);
        this.onHey(msg);
        return;
    }
    ;
    onConfigSet(msg) {
        this.conf.setObject(msg.data);
        this.onHey(msg);
        return;
    }
    ;
    onFolderOpen(msg) {
        this.conf.updateProject(msg.data.id, { open: true });
        this.onHey(msg);
        return;
    }
    ;
    onFolderOpenAll(msg) {
        for (const item of this.conf.database)
            if (item instanceof project_folder_1.default)
                item.open = true;
        this.conf.save();
        this.onHey(msg);
        return;
    }
    ;
    onFolderClose(msg) {
        this.conf.updateProject(msg.data.id, { open: false });
        this.onHey(msg);
        return;
    }
    ;
    onFolderCloseAll(msg) {
        for (const item of this.conf.database)
            if (item instanceof project_folder_1.default)
                item.open = false;
        this.conf.save();
        this.onHey(msg);
        return;
    }
    ;
    onFolderColourSet(msg) {
        let folder = this.conf.findProject(msg.data.id);
        if (folder instanceof project_folder_1.default)
            for (const project of folder.projects)
                project.accent = folder.accent;
        this.conf.save();
        this.onHey(msg);
        return;
    }
    ;
    onFolderColourRng(msg) {
        let folder = this.conf.findProject(msg.data.id);
        let from = null;
        let severity = 8;
        if (!(folder instanceof project_folder_1.default))
            return;
        // if the message contained a starting point then use that as the
        // base as thats what was in the text input but not commited to
        // the save yet.
        if (typeof msg.data.from === 'string')
            from = msg.data.from;
        if (folder.projects.length <= 3)
            severity *= 3.0;
        else if (folder.projects.length <= 2)
            severity *= 5.0;
        // produce a spread of colours.
        let colours = util_1.default.arrayColoursFrom((from ?? folder.accent), folder.projects.length, severity);
        // randomize the colours if asked.
        if (typeof msg.data.random === 'boolean')
            if (msg.data.random)
                colours.sort((a, b) => util_1.default.randomNegative());
        // distribute the colours across the projects.
        for (const project of folder.projects)
            project.accent = colours.pop() ?? folder.accent;
        this.conf.save();
        this.onHey(msg);
        return;
    }
    ;
    onFolderSort(msg) {
        let folder = this.conf.findProject(msg.data.id);
        let mode = 'desc';
        if (!(folder instanceof project_folder_1.default))
            return;
        if (typeof msg.data.dir === 'string')
            mode = msg.data.dir;
        ////////
        if (mode === 'asc')
            folder.projects.sort(util_1.default.sortFuncByNameAsc);
        else
            folder.projects.sort(util_1.default.sortFuncByNameDesc);
        console.log(folder.projects);
        this.conf.save();
        this.onHey(msg);
        return;
    }
    ;
    ////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////
    localToWebpath(filename) {
        if (!this.panel)
            return '';
        return (this.panel.webview
            .asWebviewUri(vscode.Uri.file(filename))
            .toString());
    }
    ;
}
;
exports.default = Dashboard;
//# sourceMappingURL=dashboard.js.map