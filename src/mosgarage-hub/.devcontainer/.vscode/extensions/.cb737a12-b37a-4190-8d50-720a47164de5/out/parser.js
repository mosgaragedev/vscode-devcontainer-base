"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoParser = void 0;
const _PACKAGE_STATEMENT_REGEXP = /^package (.+)\r?$/;
const _IMPORT_SINGLE_LINE_REGEXP = /^import (?:(.*?) )?"(.*?)"\r?$/;
const _IMPORT_MULTI_LINE_START_REGEXP = /^import \(\r?$/;
const _IMPORT_MULTI_LINE_END_REGEXP = /^\)\r?$/;
const _IMPORT_MULTI_LINE_ENTRY_REGEXP = /^\s*(?:(.*?) )?"(.*?)"\r?$/;
const _SUITE_TEST_FUNCTION_REGEXP = /^func \(.*? \*?(.*?)\) (Test.*?)\(.*? \*?(?:(.*?)\.)?(.*?)\) \{/;
const _GOCHECK_MODULE_NAME = 'gopkg.in/check.v1';
const _GOCHECK_PACKAGE_NAME = 'check';
const _QUICKTEST_MODULE_NAME = 'github.com/frankban/quicktest';
const _QUICKTEST_PACKAGE_NAME = 'quicktest';
/**
 * Partially parses Go files and extracts package/import/test data.
 */
class GoParser {
    constructor(content = '') {
        this.content = content;
    }
    /**
     * @returns `undefined` on failure.
     */
    parse(lines) {
        const ls = lines || this._getLines();
        const packageInfo = this.parsePackageName(ls);
        if (!packageInfo) {
            return;
        }
        const imports = this.parseImports(ls, 1 + packageInfo.lineNumber);
        const testFunctions = this.parseTestFunctions(imports, ls, 1 + packageInfo.lineNumber);
        return { packageInfo, imports, testFunctions };
    }
    _getLines() {
        return this.content.split('\n'); // No need to include `\r` (See RegExp pattern definition at the top.)
    }
    parsePackageName(lines) {
        const ls = lines || this._getLines();
        for (let n = 0; n < ls.length; n++) {
            const line = ls[n];
            const match = _PACKAGE_STATEMENT_REGEXP.exec(line);
            if (match) {
                return { name: match[1], lineNumber: n };
            }
        }
    }
    parseImports(lines, start = 0) {
        const ls = lines || this._getLines();
        const result = [];
        const q = {
            _n: start,
            lineNumber: function (offset = 0) { return offset + this._n; },
            consume: function (n = 0) { this._n += 1 + n; },
            peek: function (offset = 0) { return ls[offset + this._n]; },
            empty: function () { return this.peek() === undefined; }
        };
        while (!q.empty()) {
            if (acceptSingleLineImport() || acceptMultiLineImport()) {
                continue;
            }
            q.consume();
        }
        return result;
        function acceptSingleLineImport() {
            const match = _IMPORT_SINGLE_LINE_REGEXP.exec(q.peek());
            if (!match) {
                return false;
            }
            const entry = { moduleName: match[2], lineNumber: q.lineNumber() };
            if (match[1]) {
                entry.alias = match[1];
            }
            result.push(entry);
            q.consume();
            return true;
        }
        function acceptMultiLineImport() {
            if (!_IMPORT_MULTI_LINE_START_REGEXP.exec(q.peek())) {
                return false;
            }
            let n = 1;
            const imports = [];
            for (; q.peek(n) !== undefined; n++) {
                if (_IMPORT_MULTI_LINE_END_REGEXP.exec(q.peek(n))) {
                    result.push(...imports);
                    q.consume(n);
                    return true;
                }
                const match = _IMPORT_MULTI_LINE_ENTRY_REGEXP.exec(q.peek(n));
                if (match) {
                    const entry = { moduleName: match[2], lineNumber: q.lineNumber(n) };
                    if (match[1]) {
                        entry.alias = match[1];
                    }
                    imports.push(entry);
                }
            }
            return false;
        }
    }
    parseTestFunctions(imports, lines, start = 0) {
        const ls = lines || this._getLines();
        const result = [];
        for (let n = start; n < ls.length; n++) {
            const line = ls[n];
            const match = _SUITE_TEST_FUNCTION_REGEXP.exec(line);
            if (match) {
                const argTypeModule = match[3];
                if (!argTypeModule) {
                    continue;
                }
                const importsWithSameAlias = imports.filter(x => x.alias && x.alias === argTypeModule);
                if (importsWithSameAlias.length > 1) {
                    // This shouldn't happen with a valid .go file.
                    return [];
                }
                let argType;
                if (!importsWithSameAlias.length) {
                    switch (argTypeModule) {
                        case _GOCHECK_PACKAGE_NAME:
                            if (!imports.some(x => x.moduleName === _GOCHECK_MODULE_NAME)) {
                                continue;
                            }
                            argType = { moduleName: _GOCHECK_MODULE_NAME, typeName: match[4] };
                            break;
                        case _QUICKTEST_PACKAGE_NAME:
                            if (!imports.some(x => x.moduleName === _QUICKTEST_MODULE_NAME)) {
                                continue;
                            }
                            argType = { moduleName: _QUICKTEST_MODULE_NAME, typeName: match[4] };
                            break;
                        default:
                            // Unknown module.
                            continue;
                    }
                }
                else {
                    argType = { moduleName: importsWithSameAlias[0].moduleName, typeName: match[4] };
                }
                result.push({
                    kind: argType.moduleName === _GOCHECK_MODULE_NAME ? 'gocheck' :
                        argType.moduleName === _QUICKTEST_MODULE_NAME ? 'quicktest' :
                            undefined,
                    receiverType: match[1],
                    functionName: match[2],
                    argType,
                    lineNumber: n,
                    range: [n, match.index, n, match.index + match[0].length]
                });
            }
        }
        return result;
    }
}
exports.GoParser = GoParser;
//# sourceMappingURL=parser.js.map