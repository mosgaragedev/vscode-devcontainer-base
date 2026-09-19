"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertScrollableQuickPicksToTextAndDescription = exports.getAllQuickPickItems = exports.removeFilePathRecursively = exports.removeFolderFromWorkspace = exports.addFolderToWorkspace = exports.getIndexOfQuickPickItem = exports.convertArrayObjectsToTextAndDescription = exports.notificationExists = exports.runCommands = exports.openCommandPrompt = exports.getCommandPromptOptions = exports.typeCommandConfirm = exports.verifyQuickPicks = exports.waitForQuickPick = exports.convertArrayObjectsToText = void 0;
const fs = require("fs");
const chai_1 = require("chai");
const vscode_extension_tester_1 = require("vscode-extension-tester");
let path = require('path');
/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
function openCommandPrompt(timeout = 6000) {
    return __awaiter(this, void 0, void 0, function* () {
        const driver = vscode_extension_tester_1.VSBrowser.instance.driver;
        return driver.wait(() => __awaiter(this, void 0, void 0, function* () {
            // if cannot interact with vscode, return null
            if (!(yield vscode_extension_tester_1.VSBrowser.instance.driver.actions().sendKeys(vscode_extension_tester_1.Key.F1).perform().then(() => true).catch(() => false))) {
                return null;
            }
            return new vscode_extension_tester_1.InputBox().wait(750).catch(() => null);
        }), timeout, "Could not open command pallette - timed out");
    });
}
exports.openCommandPrompt = openCommandPrompt;
function runCommands(...commands) {
    return __awaiter(this, void 0, void 0, function* () {
        const commandPrompt = yield openCommandPrompt();
        for (let index = 0; index < commands.length; index++) {
            const command = commands[index];
            yield commandPrompt.setText(command);
            yield commandPrompt.confirm();
        }
        return commandPrompt;
    });
}
exports.runCommands = runCommands;
function waitForQuickPick(args) {
    return __awaiter(this, void 0, void 0, function* () {
        args.message = args.message || "Could not find quick pick";
        const quickPick = yield vscode_extension_tester_1.VSBrowser.instance.driver.wait(() => __awaiter(this, void 0, void 0, function* () {
            const quickPicks = yield args.input.getQuickPicks();
            const getter = args.quickPickGetter || vscode_extension_tester_1.QuickPickItem.prototype.getText;
            for (const q of quickPicks) {
                if (args.quickPickText === (yield getter.call(q))) {
                    return q;
                }
            }
            return undefined;
        }), args.timeout || 6000, args.message);
        if (quickPick === undefined) {
            chai_1.expect.fail(args.message);
        }
        else {
            return quickPick;
        }
    });
}
exports.waitForQuickPick = waitForQuickPick;
function verifyQuickPicks(input, quickPickValues, quickPickTextGetter = vscode_extension_tester_1.QuickPickItem.prototype.getText, timeout, message) {
    return __awaiter(this, void 0, void 0, function* () {
        const quickPicks = yield Promise.all(quickPickValues.map((option) => __awaiter(this, void 0, void 0, function* () {
            return waitForQuickPick({
                input,
                timeout,
                quickPickText: option,
                quickPickGetter: quickPickTextGetter,
                message: `Could not find quick pick with value: ${option}`,
            });
        }))).catch((e) => __awaiter(this, void 0, void 0, function* () {
            throw Error(`Could not find quick picks { ${quickPickValues.join(', ')} }
         in { ${(yield Promise.all((yield input.getQuickPicks()).map((q) => __awaiter(this, void 0, void 0, function* () { return yield q.getText(); })))).join(', ')} }.
        Error: ${e}`);
        }));
        (0, chai_1.expect)(quickPicks.length, `Quick pick menu does not have ${quickPickValues.length} entires. Actual number of entries: ${quickPicks.length}`)
            .to.be.equal(quickPickValues.length);
    });
}
exports.verifyQuickPicks = verifyQuickPicks;
function typeCommandConfirm(command, quickPickTextGetter, quickPickTimeout) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!command.startsWith(">")) {
            command = ">" + command;
        }
        const prompt = yield vscode_extension_tester_1.InputBox.create();
        yield prompt.setText(command);
        if (quickPickTextGetter) {
            const quickPickText = command.substring(1);
            const quickPick = yield waitForQuickPick({
                input: prompt,
                quickPickText,
                quickPickGetter: quickPickTextGetter,
                timeout: quickPickTimeout
            });
            if (quickPick) {
                yield quickPick.select();
            }
            else {
                throw Error('QuickPick item does not exist for command' + command);
            }
        }
        else {
            yield prompt.confirm();
        }
    });
}
exports.typeCommandConfirm = typeCommandConfirm;
function getCommandPromptOptions(command) {
    return __awaiter(this, void 0, void 0, function* () {
        const commandPrompt = yield vscode_extension_tester_1.InputBox.create();
        yield commandPrompt.setText(command);
        const options = yield commandPrompt.getQuickPicks();
        return convertArrayObjectsToText(options);
    });
}
exports.getCommandPromptOptions = getCommandPromptOptions;
function convertArrayObjectsToText(array) {
    return __awaiter(this, void 0, void 0, function* () {
        let options = [];
        for (let index = 0; index < array.length; index++) {
            const element = yield array[index].getLabel();
            options.push(element.toString());
        }
        return options;
    });
}
exports.convertArrayObjectsToText = convertArrayObjectsToText;
function convertArrayObjectsToTextAndDescription(array) {
    return __awaiter(this, void 0, void 0, function* () {
        let options = [];
        for (let index = 0; index < array.length; index++) {
            const label = yield array[index].getLabel();
            const description = yield array[index].getDescription();
            // const description = await array[index].findElement(By.className("label-description")).getText();
            options.push(label + " " + description);
        }
        return options;
    });
}
exports.convertArrayObjectsToTextAndDescription = convertArrayObjectsToTextAndDescription;
function getIndexOfQuickPickItem(fulltext, array) {
    return __awaiter(this, void 0, void 0, function* () {
        let index = -1;
        for (let item of array) {
            const text = yield item.getLabel();
            const description = yield item.getDescription();
            if (fulltext === text + " " + description) {
                return item.getIndex();
            }
        }
        return index;
    });
}
exports.getIndexOfQuickPickItem = getIndexOfQuickPickItem;
function convertScrollableQuickPicksToTextAndDescription(input) {
    return __awaiter(this, void 0, void 0, function* () {
        let options = new Set();
        const quickPicks = yield input.getQuickPicks();
        quickPicks.map((pick) => __awaiter(this, void 0, void 0, function* () {
            options.add(yield pick.getLabel());
        }));
        let actualLength = quickPicks.length;
        while (true) {
            const quickPick = yield input.findQuickPick(actualLength);
            if (quickPick) {
                options.add(yield quickPick.getLabel());
                actualLength++;
            }
            else {
                break;
            }
        }
        return Array.from(options);
    });
}
exports.convertScrollableQuickPicksToTextAndDescription = convertScrollableQuickPicksToTextAndDescription;
function getAllQuickPickItems(input) {
    return __awaiter(this, void 0, void 0, function* () {
        let resultArray = new Set();
        const quickPicks = yield input.getQuickPicks();
        quickPicks.map(pick => resultArray.add(pick));
        let actualLength = quickPicks.length;
        while (true) {
            const quickPick = yield input.findQuickPick(actualLength);
            if (quickPick) {
                resultArray.add(quickPick);
                actualLength++;
            }
            else {
                break;
            }
        }
        return Array.from(resultArray);
    });
}
exports.getAllQuickPickItems = getAllQuickPickItems;
function notificationExists(text, timeout = 6000) {
    return __awaiter(this, void 0, void 0, function* () {
        return vscode_extension_tester_1.VSBrowser.instance.driver.wait(() => __awaiter(this, void 0, void 0, function* () {
            const center = yield new vscode_extension_tester_1.Workbench().openNotificationsCenter();
            const notifications = yield center.getNotifications(vscode_extension_tester_1.NotificationType.Any).catch(() => []);
            for (const notification of notifications) {
                const message = yield notification.getMessage().catch(() => null);
                if ((message === null || message === void 0 ? void 0 : message.includes(text)) && (yield notification.isDisplayed())) {
                    return notification;
                }
            }
            return undefined;
        }), timeout);
    });
}
exports.notificationExists = notificationExists;
function removeFolderFromWorkspace(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        yield openCommandPrompt();
        yield typeCommandConfirm(">Workspaces: Remove Folder from workspace", vscode_extension_tester_1.QuickPickItem.prototype.getLabel);
        const input = yield vscode_extension_tester_1.InputBox.create();
        let dirs = yield convertArrayObjectsToText(yield input.getQuickPicks());
        if (dirs.filter(item => { return item.indexOf(dir) === 0; }).length === 0) {
            throw Error("Folder " + dir + " is not set as workspace, cannot be removed, available folders: " + dirs);
        }
        yield input.selectQuickPick(dir);
    });
}
exports.removeFolderFromWorkspace = removeFolderFromWorkspace;
function addFolderToWorkspace(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        yield openCommandPrompt();
        const quick = yield vscode_extension_tester_1.InputBox.create();
        yield quick.setText(">Extest: Add Folder");
        yield quick.confirm();
        let confirmedPrompt = yield vscode_extension_tester_1.InputBox.create();
        yield confirmedPrompt.setText(dir);
        yield confirmedPrompt.confirm();
    });
}
exports.addFolderToWorkspace = addFolderToWorkspace;
function removeFilePathRecursively(filepath, includeRootDir = false) {
    if (fs.lstatSync(filepath).isDirectory()) {
        for (let file of fs.readdirSync(filepath)) {
            removeFilePathRecursively(filepath + path.sep + file, true);
        }
        if (includeRootDir) {
            fs.rmdirSync(filepath);
        }
    }
    else {
        fs.unlinkSync(filepath);
    }
}
exports.removeFilePathRecursively = removeFilePathRecursively;
//# sourceMappingURL=commonUtils.js.map