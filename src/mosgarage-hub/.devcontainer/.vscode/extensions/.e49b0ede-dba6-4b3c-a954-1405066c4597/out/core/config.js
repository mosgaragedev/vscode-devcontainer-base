"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const uuid = require("uuid");
const project_entry_1 = require("./project-entry");
const util_1 = require("./util");
const project_folder_1 = require("./project-folder");
class Config {
    ////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////
    constructor() {
        this.keepers = [
            'title', 'debug', 'database', 'folderSizing', 'columnSizing',
            'tabMode', 'showPaths', 'fontSize', 'rounded',
            'openOnNewWindow', 'openInNewWindow'
        ];
        this.api = vscode.workspace.getConfiguration('dashyeah');
        this.title = 'Dashboard';
        this.debug = false;
        this.database = [];
        this.folderSizing = 'col-12';
        this.columnSizing = 'col-12 col-md-6';
        this.tabMode = true;
        this.showPaths = true;
        this.openOnNewWindow = true;
        this.openInNewWindow = false;
        this.fontSize = 'font-size-normal';
        this.rounded = true;
        this.fillFromEditorConfig();
        return;
    }
    ;
    ////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////
    fillFromEditorConfig() {
        let self = this;
        // in this instance this self is quite specific because vsocde would
        // claim everything was fine, but manually running the compiler
        // bombed saying cannot find name this. even though for a while it
        // was working. but then this alias hack... whatever my dudes.
        for (const key of this.keepers) {
            if (key === 'database')
                continue;
            if (!this.api.has(key))
                continue;
            this[key] = this.api.get(key);
        }
        for (const item of this.api.database)
            if (typeof item.path === 'undefined')
                this.database.push(new project_folder_1.default(item));
            else
                this.database.push(new project_entry_1.default(item));
        return;
    }
    ;
    getMap() {
        let output = new Map();
        for (const key of this.keepers) {
            if (key === 'database')
                output.set(key, this.database.map((v) => v));
            else
                output.set(key, this[key]);
        }
        return output;
    }
    ;
    getObject() {
        let output = {};
        for (const key of this.keepers) {
            if (key === 'database')
                output[key] = this.database.map((v) => v);
            else
                output[key] = this[key];
        }
        return output;
    }
    ;
    setObject(input) {
        for (const key in input)
            if (this.keepers.indexOf(key) >= 0)
                this[key] = input[key];
        this.save();
        return;
    }
    ;
    save() {
        // only write the keys that have been configured in the
        // extension settings as not all configuration options are
        // exposed via the ui yet.
        for (const key of this.keepers)
            if (this.api.has(key))
                this.api.update(key, this[key], true);
        return;
    }
    ;
    ////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////
    addFolder(name) {
        let project = new project_folder_1.default({
            id: uuid.v4(),
            name: name
        });
        project.open = true;
        this.database.push(project);
        this.save();
        return;
    }
    ;
    addProject(name, path, parent) {
        let database = this.database;
        let folder = null;
        let accent = null;
        let icon = null;
        if (parent !== null) {
            folder = this.findProject(parent);
            if (folder instanceof project_folder_1.default) {
                database = folder.projects;
                accent = folder.accent;
            }
        }
        database.push(new project_entry_1.default({
            id: uuid.v4(),
            name: name,
            path: path,
            accent: accent,
            icon: icon
        }));
        this.save();
        return;
    }
    ;
    removeProject(id) {
        this.findProject(id, true);
        this.save();
        return;
    }
    ;
    updateProject(id, data) {
        const item = this.findProject(id);
        if (item !== null) {
            item.update(data);
            this.save();
        }
        return;
    }
    ;
    moveProject(id, into, before) {
        let database = null;
        let found = this.findProject(id);
        let folder = null;
        let shouldInsertAfter = false;
        let inset = false;
        let key = 0;
        if (found === null)
            return util_1.default.println(`project ${id} not found`, 'Config::moveProject');
        // determine the thing to contain this project exists.
        database = this.database;
        if (into !== null) {
            folder = util_1.default.findInArrayById(this.database, into);
            if (folder instanceof project_folder_1.default)
                database = folder.projects;
            else
                return util_1.default.println(`folder ${into} not found`, 'Config::moveProject');
        }
        if (!Array.isArray(database))
            return util_1.default.println('nothing happened', 'Config::moveProject');
        // determine if we dragged this to a project that came before or
        // after the one to move. this makes drag drop feel better when
        // dragging things farther down a list. but don't do anything
        // if we dragged it upon ourselves.
        if (before !== null) {
            if (found.id === before)
                return;
            for (key in database) {
                if (database[key].id === before) {
                    shouldInsertAfter = false;
                    break;
                }
                if (database[key].id === found.id) {
                    shouldInsertAfter = true;
                    break;
                }
            }
        }
        // pull the thing we are moving out and reset our database
        // references for later manipulation since this find/remove method
        // ends up returning new arrays i think.
        this.findProject(found.id, true);
        if (folder instanceof project_folder_1.default)
            database = folder.projects;
        else
            database = this.database;
        // then determine if it needs to go into a specific spot into the
        // the final dataset finding the array offset now that the original
        // item has been removed.
        key = 0;
        if (before !== null) {
            for (key in database) {
                if (database[key].id === before) {
                    inset = true;
                    break;
                }
            }
        }
        key = parseInt(key);
        if (shouldInsertAfter)
            key += 1;
        // summarize what we've determined.
        if (inset)
            util_1.default.println(`insert before ${before}`, 'Config::moveProject');
        util_1.default.println(`seating project in slot ${key}`, 'Config::moveProject');
        // and do it mang.
        if (inset)
            database.splice(key, 0, found);
        else
            database.push(found);
        this.save();
        return;
    }
    ;
    findProject(id, removeAsWell = false) {
        let found = null;
        // note: the remove operation does not commit a save, this is
        // intentional.
        for (const item of this.database) {
            if (item.id === id) {
                found = item;
                if (removeAsWell)
                    this.database = util_1.default.filterArrayStripById(this.database, id);
                break;
            }
            if (item instanceof project_folder_1.default)
                if (found = util_1.default.findInArrayById(item.projects, id)) {
                    if (removeAsWell)
                        item.projects = util_1.default.filterArrayStripById(item.projects, id);
                    break;
                }
        }
        return found;
    }
    ;
}
;
exports.default = Config;
//# sourceMappingURL=config.js.map