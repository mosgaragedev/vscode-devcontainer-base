"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printResult = exports.printOptions = exports.log = exports.error = void 0;
const vscode_1 = require("vscode");
const logger = vscode_1.window.createOutputChannel('Compare Folders');
function printData(...data) {
    data.forEach(item => {
        if (typeof item === 'string') {
            logger.appendLine(item);
        }
        else {
            logger.appendLine(JSON.stringify(item, null, 2));
        }
    });
}
function error(...data) {
    logger.appendLine('====error====');
    printData(...data);
    console.error(...data);
    logger.appendLine('===============');
}
exports.error = error;
function log(...data) {
    printData(...data);
    console.log(...data);
}
exports.log = log;
function printOptions(options) {
    log('====options====');
    log(options);
    log('===============');
}
exports.printOptions = printOptions;
function printResult(result) {
    log('====result====');
    log('Directories are %s', result.same ? 'identical' : 'different');
    log('Statistics - equal entries: %s, distinct entries: %s, left only entries: %s, right only entries: %s, differences: %s', result.equal, result.distinct, result.left, result.right, result.differences);
    if (!result.diffSet) {
        log('result is undefined');
        return;
    }
    result.diffSet.forEach(dif => log(`${dif.name1} ${dif.name2} ${dif.state} ${dif.type1} ${dif.type2}`));
    log('===============');
}
exports.printResult = printResult;
//# sourceMappingURL=logger.js.map