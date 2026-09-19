"use strict";
/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCliAudit = runCliAudit;
const audit_1 = require("../audit");
const cli_ast_1 = require("../../platform/cli-ast");
const upgrade_1 = require("../../platform/upgrade");
const config_1 = require("../../util/config");
async function runCliAudit(document, oas, mapping, tags, cache, secrets, configuration, logger, progress, isFullAudit) {
    const config = await (0, config_1.loadConfig)(configuration, secrets);
    const [result, error] = await (0, cli_ast_1.runAuditWithCliBinary)(secrets, config, logger, oas, tags, isFullAudit, config.cliDirectoryOverride);
    if (error !== undefined) {
        if (error.statusCode === 3 && error.statusMessage === "limits_reached") {
            await (0, upgrade_1.offerUpgrade)(isFullAudit);
            return;
        }
        else {
            throw new Error(`Unexpected error running Security Audit: ${JSON.stringify(error)}`);
        }
    }
    if (result.cli.remainingPerOperationAudit !== undefined &&
        result.cli.remainingPerOperationAudit < upgrade_1.UPGRADE_WARN_LIMIT) {
        (0, upgrade_1.warnOperationAudits)(result.cli.remainingPerOperationAudit);
    }
    const audit = await (0, audit_1.parseAuditReport)(cache, document, result.audit, mapping);
    if (result.todo !== undefined) {
        const { issues: todo } = await (0, audit_1.parseAuditReport)(cache, document, result.todo, mapping);
        audit.todo = todo;
    }
    if (result.compliance !== undefined) {
        audit.compliance = result.compliance;
    }
    return { audit, tempAuditDirectory: result.tempAuditDirectory };
}
//# sourceMappingURL=cli.js.map