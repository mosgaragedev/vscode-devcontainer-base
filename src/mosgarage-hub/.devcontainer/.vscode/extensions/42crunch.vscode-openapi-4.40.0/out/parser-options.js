"use strict";
/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.parserOptions = exports.ParserOptions = void 0;
class ParserOptions {
    constructor() {
        this.yaml = {};
    }
    configure(configuration) {
        this.configuration = configuration;
        const customTags = configuration.get("customTags");
        this.yaml = {
            customTags: this.buildCustomTags(customTags),
        };
        configuration.onDidChange(this.onConfigurationChanged, this);
    }
    get() {
        return {
            yaml: this.yaml,
        };
    }
    onConfigurationChanged(e) {
        if (this.configuration && this.configuration.changed(e, "customTags")) {
            const customTags = this.configuration.get("customTags");
            this.yaml = {
                customTags: this.buildCustomTags(customTags),
            };
        }
    }
    buildCustomTags(customTags) {
        const tags = {};
        for (const tag of customTags) {
            let [name, type] = tag.split(" ");
            type = type ? type.toLowerCase() : "scalar";
            if (type === "mapping" || type === "scalar" || type === "sequence") {
                tags[name] = type;
            }
        }
        return tags;
    }
}
exports.ParserOptions = ParserOptions;
exports.parserOptions = new ParserOptions();
//# sourceMappingURL=parser-options.js.map