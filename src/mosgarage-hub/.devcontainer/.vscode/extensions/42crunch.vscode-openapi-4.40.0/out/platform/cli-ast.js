"use strict";
/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScanConfigWithCliBinary = createScanConfigWithCliBinary;
exports.createDefaultConfigWithCliBinary = createDefaultConfigWithCliBinary;
exports.backupConfig = backupConfig;
exports.getCliInfo = getCliInfo;
exports.testCli = testCli;
exports.ensureCliDownloaded = ensureCliDownloaded;
exports.checkForCliUpdate = checkForCliUpdate;
exports.downloadCli = downloadCli;
exports.runScanWithCliBinary = runScanWithCliBinary;
exports.runValidateScanConfigWithCliBinary = runValidateScanConfigWithCliBinary;
exports.runAuditWithCliBinary = runAuditWithCliBinary;
const got_1 = __importDefault(require("got"));
const node_child_process_1 = require("node:child_process");
const node_events_1 = require("node:events");
const node_fs_1 = require("node:fs");
const promises_1 = require("node:fs/promises");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const node_stream_1 = require("node:stream");
const node_util_1 = require("node:util");
const node_crypto_1 = require("node:crypto");
const vscode = __importStar(require("vscode"));
const endpoints_1 = require("@xliic/common/endpoints");
const configuration_1 = require("../configuration");
const credentials_1 = require("../credentials");
const config_1 = require("../util/config");
const time_util_1 = require("../time-util");
const cli_ast_update_1 = require("./cli-ast-update");
const types_1 = require("../types");
const fs_1 = require("../util/fs");
const proxy_1 = require("../proxy");
const asyncExecFile = (0, node_util_1.promisify)(node_child_process_1.execFile);
let lastCliUpdateCheckTime = 0;
const cliUpdateCheckInterval = 1000 * 60 * 60 * 1; // 1 hour
const execMaxBuffer = 1024 * 1024 * 20; // 20MB
async function createScanConfigWithCliBinary(scanconfUri, oas, cliDirectoryOverride, logger) {
    const tmpdir = (0, fs_1.createTempDirectory)("scan-");
    const oasFilename = (0, node_path_1.join)(tmpdir, "openapi.json");
    const cli = (0, node_path_1.join)(getBinDirectory(cliDirectoryOverride), getCliFilename());
    const args = [
        "scan",
        "conf",
        "generate",
        "--output-format",
        "json",
        "--output",
        "scanconfig.json",
        "openapi.json",
    ];
    await (0, promises_1.writeFile)(oasFilename, oas, { encoding: "utf8" });
    try {
        logger.debug(`Running the binary: ${cli} ${args.join(" ")}`);
        await asyncExecFile(cli, args, { cwd: tmpdir, windowsHide: true, maxBuffer: execMaxBuffer });
        // create scan config directory if does not exist
        const scanconfDir = (0, node_path_1.dirname)(scanconfUri.fsPath);
        if (!(0, fs_1.existsSync)(scanconfDir)) {
            (0, node_fs_1.mkdirSync)(scanconfDir, { recursive: true });
        }
        // copy scanconfig to the destination
        const scanconfigFilename = (0, node_path_1.join)(tmpdir, "scanconfig.json");
        await (0, promises_1.copyFile)(scanconfigFilename, scanconfUri.fsPath);
        // clean the temp directory
        (0, node_fs_1.unlinkSync)(oasFilename);
        (0, node_fs_1.unlinkSync)(scanconfigFilename);
        (0, node_fs_1.rmdirSync)(tmpdir);
    }
    catch (ex) {
        throw new Error(formatException(ex));
    }
}
async function createDefaultConfigWithCliBinary(oas, cliDirectoryOverride, logger) {
    const tmpdir = (0, fs_1.createTempDirectory)("scanconf-update-");
    const scanconfFilename = (0, node_path_1.join)(tmpdir, "scanconf.json");
    const scanconfUri = vscode.Uri.file(scanconfFilename);
    await createScanConfigWithCliBinary(scanconfUri, oas, cliDirectoryOverride, logger);
    const scanconf = await (0, promises_1.readFile)(scanconfFilename, { encoding: "utf8" });
    (0, node_fs_1.unlinkSync)(scanconfFilename);
    (0, node_fs_1.rmdirSync)(tmpdir);
    return scanconf;
}
async function backupConfig(scanconfUri) {
    const backup = (0, node_path_1.join)((0, node_path_1.dirname)(scanconfUri.fsPath), "scanconf-backup.json");
    await (0, promises_1.copyFile)(scanconfUri.fsPath, backup);
    return vscode.Uri.file(backup);
}
function getCliInfo(cliDirectoryOverride) {
    const cli = (0, node_path_1.join)(getBinDirectory(cliDirectoryOverride), getCliFilename());
    return { location: cli, found: (0, fs_1.existsSync)(cli) };
}
async function testCli(cliDirectoryOverride) {
    const cli = getCliInfo(cliDirectoryOverride);
    if (cli.found) {
        try {
            const { stdout } = await asyncExecFile(cli.location, ["--version"], {
                windowsHide: true,
                maxBuffer: execMaxBuffer,
            });
            const version = stdout.split("\n")?.[0]; // get the first line only
            const match = version.match(/(\d+\.\d+\.\d+.*)$/);
            if (match !== null) {
                return { success: true, version: match[1] };
            }
            return { success: true, version: "0.0.0" };
        }
        catch (e) {
            return { success: false, message: String(e.message ? e.message : e) };
        }
    }
    return {
        success: false,
        message: "42Crunch API Security Testing Binary is not found",
    };
}
async function ensureCliDownloaded(configuration, secrets) {
    const config = await (0, config_1.loadConfig)(configuration, secrets);
    const info = getCliInfo(config.cliDirectoryOverride);
    if (!info.found) {
        // offer to download
        await (0, time_util_1.delay)(100); // workaround for #133073
        const answer = await vscode.window.showInformationMessage("42Crunch API Security Testing Binary is not found, download?", { modal: true }, { title: "Download", id: "download" });
        if (answer?.id === "download") {
            const manifest = await (0, cli_ast_update_1.getCliUpdate)(config.repository, "0.0.0");
            if (manifest === undefined) {
                vscode.window.showErrorMessage("Failed to download 42Crunch API Security Testing Binary, manifest not found");
                return false;
            }
            return downloadCliWithProgress(manifest, config.cliDirectoryOverride);
        }
        return false;
    }
    // check for CLI update
    const currentTime = Date.now();
    if (currentTime - lastCliUpdateCheckTime > cliUpdateCheckInterval) {
        lastCliUpdateCheckTime = currentTime;
        checkForCliUpdate(config.repository, config.cliDirectoryOverride);
    }
    return true;
}
async function checkForCliUpdate(repository, cliDirectoryOverride) {
    const test = await testCli(cliDirectoryOverride);
    if (test.success) {
        const manifest = await (0, cli_ast_update_1.getCliUpdate)(repository, test.version);
        if (manifest !== undefined) {
            await (0, time_util_1.delay)(100); // workaround for #133073
            const answer = await vscode.window.showInformationMessage(`New version ${manifest.version} of 42Crunch API Security Testing Binary is available, download?`, { modal: true }, { title: "Download", id: "download" });
            if (answer?.id === "download") {
                return downloadCliWithProgress(manifest, cliDirectoryOverride);
            }
        }
    }
    return false;
}
function downloadCliWithProgress(manifest, cliDirectoryOverride) {
    return vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Downloading 42Crunch API Security Testing Binary",
        cancellable: false,
    }, async (progress, cancellationToken) => {
        let previous = 0;
        for await (const downloadProgress of downloadCli(manifest, cliDirectoryOverride)) {
            const increment = (downloadProgress.percent - previous) * 100;
            previous = downloadProgress.percent;
            progress.report({ increment });
        }
        return true;
    });
}
async function* downloadCli(manifest, cliDirectoryOverride) {
    ensureDirectories(cliDirectoryOverride);
    const tmpCli = yield* downloadToTempFile(manifest);
    const destinationCli = (0, node_path_1.join)(getBinDirectory(cliDirectoryOverride), getCliFilename());
    await (0, promises_1.copyFile)(tmpCli, destinationCli);
    (0, node_fs_1.unlinkSync)(tmpCli);
    (0, node_fs_1.rmdirSync)((0, node_path_1.dirname)(tmpCli));
    if (process.platform === "linux" || process.platform === "darwin") {
        (0, node_fs_1.chmodSync)(destinationCli, 0o755);
    }
    return destinationCli;
}
async function runScanWithCliBinary(secrets, scanEnv, config, logger, oas, scanconf, isFullScan) {
    logger.info(`Running API Conformance Scan using 42Crunch API Security Testing Binary`);
    const { cliFreemiumdHost, freemiumdUrl } = (0, endpoints_1.getEndpoints)(config.internalUseDevEndpoints);
    const tmpDir = (0, node_os_1.tmpdir)();
    const dir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)(`${tmpDir}`, "scan-"));
    const oasFilename = (0, node_path_1.join)(dir, "openapi.json");
    const scanconfFilename = (0, node_path_1.join)(dir, "scanconf.json");
    const reportFilename = (0, node_path_1.join)(dir, "report.json");
    await (0, promises_1.writeFile)(oasFilename, oas, { encoding: "utf8" });
    await (0, promises_1.writeFile)(scanconfFilename, scanconf, { encoding: "utf8" });
    logger.info(`Wrote scan configuration to: ${dir}`);
    const cli = (0, node_path_1.join)(getBinDirectory(config.cliDirectoryOverride), getCliFilename());
    logger.info(`Running scan using: ${cli}`);
    const userAgent = getUserAgent();
    const args = [
        "scan",
        "run",
        "openapi.json",
        "--conf-file",
        "scanconf.json",
        "--output",
        "report.json",
        "--output-format",
        "json",
        "--freemium-host",
        cliFreemiumdHost,
        "--verbose",
        "error",
        "--user-agent",
        userAgent,
        "--enrich=false",
    ];
    if (!isFullScan) {
        args.push("--is-operation");
    }
    if (config.platformAuthType === "anond-token") {
        const anondToken = (0, credentials_1.getAnondCredentials)(configuration_1.configuration);
        args.push("--token", String(anondToken));
        Object.assign(scanEnv, await (0, proxy_1.getProxyEnv)(freemiumdUrl, scanEnv["SCAN42C_HOST"], config, logger));
    }
    else {
        const platformConnection = await (0, credentials_1.getPlatformCredentials)(configuration_1.configuration, secrets);
        if (platformConnection !== undefined) {
            scanEnv["API_KEY"] = platformConnection.apiToken;
            scanEnv["PLATFORM_HOST"] = platformConnection.platformUrl;
            Object.assign(scanEnv, await (0, proxy_1.getProxyEnv)(platformConnection.platformUrl, scanEnv["SCAN42C_HOST"], config, logger));
        }
    }
    try {
        logger.debug(`Running the binary: ${cli} ${args.join(" ")}`);
        const output = await asyncExecFile(cli, args, {
            cwd: dir,
            windowsHide: true,
            env: scanEnv,
            maxBuffer: execMaxBuffer,
        });
        const cliResponse = parseCliJsonResponse(output.stdout);
        return [{ reportFilename, cli: cliResponse, tempScanDirectory: dir }, undefined];
    }
    catch (ex) {
        const error = readException(ex);
        const json = parseCliJsonResponse(error.stdout);
        if (json !== undefined) {
            return [undefined, json];
        }
        else {
            throw new Error(formatException(error));
        }
    }
}
async function runValidateScanConfigWithCliBinary(secrets, envStore, scanEnv, config, logger, oas, scanconf, cliDirectoryOverride) {
    logger.info(`Running Validate Scan Config using 42Crunch API Security Testing Binary`);
    const tmpDir = (0, node_os_1.tmpdir)();
    const dir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)(`${tmpDir}`, "scan-"));
    const oasFilename = (0, node_path_1.join)(dir, "openapi.json");
    const scanconfFilename = (0, node_path_1.join)(dir, "scanconf.json");
    await (0, promises_1.writeFile)(oasFilename, oas, { encoding: "utf8" });
    await (0, promises_1.writeFile)(scanconfFilename, scanconf, { encoding: "utf8" });
    logger.info(`Wrote scan configuration to: ${dir}`);
    const cli = (0, node_path_1.join)(getBinDirectory(cliDirectoryOverride), getCliFilename());
    const args = ["scan", "conf", "validate", "openapi.json", "--conf-file", "scanconf.json"];
    logger.info(`Running validate using: ${cli}`);
    try {
        logger.debug(`Running the binary: ${cli} ${args.join(" ")}`);
        const output = await asyncExecFile(cli, args, {
            cwd: dir,
            windowsHide: true,
            env: scanEnv,
            maxBuffer: execMaxBuffer,
        });
        const cliResponse = JSON.parse(output.stdout);
        // clean the temp directory
        (0, node_fs_1.unlinkSync)(oasFilename);
        (0, node_fs_1.unlinkSync)(scanconfFilename);
        (0, node_fs_1.rmdirSync)(dir);
        return [cliResponse, undefined];
    }
    catch (ex) {
        const error = readException(ex);
        const json = parseCliJsonResponse(error.stdout);
        if (json !== undefined) {
            return [undefined, json];
        }
        else {
            throw new Error(formatException(error));
        }
    }
}
async function runAuditWithCliBinary(secrets, config, logger, oas, tags, isFullAudit, cliDirectoryOverride) {
    const { cliFreemiumdHost, freemiumdUrl } = (0, endpoints_1.getEndpoints)(config.internalUseDevEndpoints);
    logger.info(`Running Security Audit using 42Crunch API Security Testing Binary`);
    const dir = (0, fs_1.createTempDirectory)("audit-");
    await (0, promises_1.writeFile)((0, node_path_1.join)(dir, "openapi.json"), oas, { encoding: "utf8" });
    logger.info(`Wrote Audit configuration to: ${dir}`);
    const cli = (0, node_path_1.join)(getBinDirectory(cliDirectoryOverride), getCliFilename());
    logger.info(`Running Security Audit using: ${cli}`);
    const userAgent = getUserAgent();
    const env = {};
    const args = [
        "audit",
        "run",
        "openapi.json",
        "--output",
        "report.json",
        "--output-format",
        "json",
        "--freemium-host",
        cliFreemiumdHost,
        "--verbose",
        "error",
        "--user-agent",
        userAgent,
        "--enrich=false",
    ];
    if (!isFullAudit) {
        args.push("--is-operation");
    }
    if (tags.length > 0) {
        args.push("--tag", tags.join(","));
    }
    if (config.platformAuthType === "anond-token") {
        const anondToken = (0, credentials_1.getAnondCredentials)(configuration_1.configuration);
        args.push("--token", String(anondToken));
        Object.assign(env, await (0, proxy_1.getProxyEnv)(freemiumdUrl, undefined, config, logger));
    }
    else {
        const platformConnection = await (0, credentials_1.getPlatformCredentials)(configuration_1.configuration, secrets);
        if (platformConnection !== undefined) {
            logger.debug(`Setting PLATFORM_HOST environment variable to: ${platformConnection.platformUrl}`);
            logger.debug("Setting API_KEY environment variable.");
            env["API_KEY"] = platformConnection.apiToken;
            env["PLATFORM_HOST"] = platformConnection.platformUrl;
            Object.assign(env, await (0, proxy_1.getProxyEnv)(platformConnection.platformUrl, undefined, config, logger));
        }
    }
    try {
        logger.debug(`Running the binary: ${cli} ${args.join(" ")}`);
        const output = await asyncExecFile(cli, args, {
            cwd: dir,
            windowsHide: true,
            env,
            maxBuffer: execMaxBuffer,
        });
        const reportFilename = (0, node_path_1.join)(dir, "report.json");
        const todoFilename = (0, node_path_1.join)(dir, "todo.json");
        const sqgFilename = (0, node_path_1.join)(dir, "sqg.json");
        const report = await (0, promises_1.readFile)(reportFilename, { encoding: "utf8" });
        const parsed = JSON.parse(report);
        const todo = await readTodoReport(todoFilename);
        const compliance = await readSqgReport(sqgFilename);
        const cliResponse = JSON.parse(output.stdout);
        logger.info(`Security Audit completed successfully`);
        return [
            { audit: parsed, todo, compliance, cli: cliResponse, tempAuditDirectory: dir },
            undefined,
        ];
    }
    catch (ex) {
        logger.error(`Binary exited with error code ${ex.code}`);
        if (ex.code === 3) {
            // limit reached
            const cliError = JSON.parse(ex.stdout);
            return [undefined, cliError];
        }
        else {
            const error = readException(ex);
            logger.error(`Error running Security Audit: ${JSON.stringify(error)}`);
            const json = parseCliJsonResponse(error.stdout);
            if (json !== undefined) {
                return [undefined, json];
            }
            else {
                throw new Error(formatException(error));
            }
        }
    }
}
function getCrunchDirectory() {
    if (process.platform === "win32") {
        return (0, node_path_1.join)(process.env["APPDATA"] || (0, node_os_1.homedir)(), "42Crunch");
    }
    else {
        return (0, node_path_1.join)((0, node_os_1.homedir)(), ".42crunch");
    }
}
function getBinDirectory(cliDirectoryOverride) {
    if (cliDirectoryOverride !== undefined && cliDirectoryOverride !== "") {
        return cliDirectoryOverride;
    }
    else {
        return (0, node_path_1.join)(getCrunchDirectory(), "bin");
    }
}
function getCliFilename() {
    if (process.platform === "win32") {
        return "42c-ast.exe";
    }
    else {
        return "42c-ast";
    }
}
function ensureDirectories(cliDirectoryOverride) {
    (0, node_fs_1.mkdirSync)(getBinDirectory(cliDirectoryOverride), { recursive: true });
}
async function* downloadToTempFile(manifest) {
    const asyncFinished = (0, node_util_1.promisify)(node_stream_1.finished);
    const cliFilename = getCliFilename();
    const tmpdir = (0, fs_1.createTempDirectory)("42c-ast-download-");
    const tmpfile = (0, node_path_1.join)(tmpdir, cliFilename);
    const fileWriterStream = (0, node_fs_1.createWriteStream)(tmpfile);
    const downloadStream = got_1.default.stream(manifest.downloadUrl);
    const hash = (0, node_crypto_1.createHash)("sha256");
    for await (const chunk of downloadStream) {
        yield downloadStream.downloadProgress;
        hash.update(chunk);
        if (!fileWriterStream.write(chunk)) {
            await (0, node_events_1.once)(fileWriterStream, "drain");
        }
    }
    fileWriterStream.end();
    await asyncFinished(fileWriterStream);
    if (manifest.sha256 !== hash.digest("hex")) {
        throw new Error(`SHA256 hash mismatch for ${manifest.downloadUrl}`);
    }
    return tmpfile;
}
function readException(ex) {
    const message = "message" in ex ? ex.message : "";
    const stdout = "stdout" in ex ? Buffer.from(ex.stdout, "utf8").toString() : "";
    const stderr = "stdout" in ex ? Buffer.from(ex.stderr, "utf8").toString() : "";
    return { message, stdout, stderr };
}
function formatException({ message, stdout, stderr, }) {
    return [message, stdout, stderr].filter((message) => message !== "").join("\n");
}
function parseCliJsonResponse(response) {
    try {
        if (response.startsWith("{")) {
            return JSON.parse(response);
        }
    }
    catch (ex) {
        // failed to parse json
    }
    return undefined;
}
function getUserAgent() {
    const extension = vscode.extensions.getExtension(types_1.extensionQualifiedId);
    return `42Crunch-VSCode/${extension.packageJSON.version}`;
}
async function readTodoReport(todoFilename) {
    if ((0, fs_1.existsSync)(todoFilename)) {
        const report = await (0, promises_1.readFile)(todoFilename, { encoding: "utf8" });
        return JSON.parse(report);
    }
}
async function readSqgReport(sqgReportFilename) {
    if ((0, fs_1.existsSync)(sqgReportFilename)) {
        const report = await (0, promises_1.readFile)(sqgReportFilename, { encoding: "utf8" });
        return JSON.parse(report);
    }
}
//# sourceMappingURL=cli-ast.js.map