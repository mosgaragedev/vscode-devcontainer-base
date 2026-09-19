"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertContainsOptions = exports.assertEqualOptions = exports.sleep = void 0;
const assert_1 = require("assert");
/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;
function assertEqualOptions(expected, actual) {
    if (actual === null || actual.length === 0) {
        throw new Error('Array passed into assert is null or empty');
    }
    let missing = expected.filter(item => actual.indexOf(item) < 0);
    if (missing.length > 0) {
        (0, assert_1.fail)('Missing expected option in command palette: ' + missing);
    }
}
exports.assertEqualOptions = assertEqualOptions;
function assertContainsOptions(expected, actual) {
    if (actual === null || actual.length === 0) {
        throw new Error('Array passed into assert is null or empty');
    }
    let missing = expected.filter(item => actual.indexOf(item) > -1);
    if (missing.length > 0) {
        (0, assert_1.fail)('Missing expected option in command palette: ' + missing);
    }
}
exports.assertContainsOptions = assertContainsOptions;
//# sourceMappingURL=testUtils.js.map