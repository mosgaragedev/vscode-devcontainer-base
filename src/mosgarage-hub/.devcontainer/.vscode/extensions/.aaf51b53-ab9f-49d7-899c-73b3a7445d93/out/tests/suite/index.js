"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const Mocha = require("mocha");
const glob_1 = require("glob");
const path_1 = require("path");
async function run() {
    const mocha = new Mocha({
        ui: "bdd",
        color: true,
    });
    const cwd = (0, path_1.resolve)(__dirname, "..");
    return new Promise((success, error) => {
        (0, glob_1.glob)("**/**.test.js", { cwd }, (e, files) => {
            if (e)
                return error(e);
            files.forEach((file) => mocha.addFile((0, path_1.resolve)(cwd, file)));
            try {
                mocha.run((failures) => {
                    if (failures > 0) {
                        error(new Error(`${failures} tests failed.`));
                    }
                    else {
                        success();
                    }
                });
            }
            catch (e) {
                error(e);
            }
        });
    });
}
exports.run = run;
//# sourceMappingURL=index.js.map