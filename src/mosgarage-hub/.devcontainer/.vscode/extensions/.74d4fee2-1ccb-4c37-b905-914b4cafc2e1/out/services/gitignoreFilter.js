"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGitignoreFilter = void 0;
// copied from https://github.com/gliviu/dir-compare/blob/e144d806386f9b54e849a4788f6c0e8eecbe41a4/test/extended/gitignoreSupport/gitignoreFilter.ts
const dir_compare_1 = require("dir-compare");
const globby_1 = require("@cjs-exporter/globby");
/**
 * Implements a custom filter that ignores files according to .gitignore rules.
 * Relies on globby library to provide the filtering logic.
 * Note that globby has some issues reported for .gitignore handling:
 * * https://github.com/sindresorhus/globby/issues/86
 * * https://github.com/sindresorhus/globby/issues/146
 * * https://github.com/sindresorhus/globby/issues/255
 * @param pathLeft This has to be the same as dir1 sent to dircompare.compare(dir1, dir2)
 * @param pathRight This has to be the same as dir2 sent to dircompare.compare(dir1, dir2)
 * @returns The filter function to be used as dircompare Option.
 */
function getGitignoreFilter(pathLeft, pathRight) {
    const isIgnoredLeft = (0, globby_1.isGitIgnoredSync)({ cwd: pathLeft });
    const isIgnoredRight = (0, globby_1.isGitIgnoredSync)({ cwd: pathRight });
    const gitignoreFilter = (entry, relativePath, options) => {
        const isIgnored = entry.origin === 'left' ? isIgnoredLeft : isIgnoredRight;
        // .git is not ignored by globby. We have to handle it.
        if (entry.name === '.git') {
            return false;
        }
        // Use globby to evaluate the current path
        if (isIgnored(entry.absolutePath)) {
            return false;
        }
        // Fallback on the default 'minimatch' implementation to deal with includeFilter and excludeFilter options
        return dir_compare_1.filterHandlers.defaultFilterHandler(entry, relativePath, options);
    };
    return gitignoreFilter;
}
exports.getGitignoreFilter = getGitignoreFilter;
//# sourceMappingURL=gitignoreFilter.js.map