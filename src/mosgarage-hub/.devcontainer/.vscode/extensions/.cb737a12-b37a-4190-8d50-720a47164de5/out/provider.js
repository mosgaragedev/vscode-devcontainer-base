"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QtsuiteTestLibraryAdapter = exports.GocheckTestLibraryAdapter = exports.TestProvider = void 0;
const child_process_1 = require("child_process");
const crypto_1 = require("crypto");
const path_1 = require("path");
const util_1 = require("util");
const vscode = require("vscode");
const parser_1 = require("./parser");
const assert = require("assert");
const util_2 = require("./util");
const path = require("path");
const _FAILED_TO_RETRIEVE_GO_EXECUTION_PARAMS_ERROR_MESSAGE = 'error: cannot retrieve `go` execution command from Go extension';
/**
 * Provides Go tests for supported test libraries.
 *
 * The test *Entries* (i.e., `vscode.TestItem` instances) are structured in this way:
 *
 * - Package (e.g., `my_package`)
 *   - File (e.g., `normal_test.go`)
 *     - Function (e.g., `TestSomething`)
 */
class TestProvider {
    constructor(telemetry, controller, output, adapter, logUri) {
        this.telemetry = telemetry;
        this.controller = controller;
        this.output = output;
        this.adapter = adapter;
        this.logUri = logUri;
        this._disposables = [];
        this._map = new WeakMap();
        this._onCreateDebugAdapterTracker = new vscode.EventEmitter();
        this._onUpdateEmitter = new vscode.EventEmitter();
        /**
         * Fires when the list of discovered tests is updated.
         */
        this.onUpdate = this._onUpdateEmitter.event;
        // First, create the `resolveHandler`. This may initially be called with
        // "undefined" to ask for all tests in the workspace to be discovered, usually
        // when the user opens the Test Explorer for the first time.
        this.controller.resolveHandler = async (test) => {
            if (!test) {
                await this._discoverAllTests();
                return;
            }
            const data = this._map.get(test);
            if (!data) {
                return;
            }
            if (data === 'package') {
                await this._refreshPackageEntry(test);
            }
            else if (data === 'file') {
                await this._refreshFileEntry(test);
            }
            else {
                assert(test.uri);
                await this._discoverTestsInFile(test.uri);
            }
        };
        this.controller.refreshHandler = async (token) => {
            await this._discoverAllTests(token);
        };
        this._disposables.push(
        // When text documents are open, parse tests in them.
        vscode.workspace.onDidOpenTextDocument(e => this._discoverTestsInFile(e.uri, e.getText())), 
        // // We could also listen to document changes to re-parse unsaved changes:
        // vscode.workspace.onDidChangeTextDocument(e => this.parseTestsInDocument(e.document)),
        controller.createRunProfile('Run', vscode.TestRunProfileKind.Run, (request, token) => this._startTestRun(false, request, token)), controller.createRunProfile('Debug', vscode.TestRunProfileKind.Debug, (request, token) => this._startTestRun(true, request, token)));
        vscode.debug.registerDebugAdapterTrackerFactory('go', {
            createDebugAdapterTracker: (session) => {
                const e = { session, tracker: undefined };
                this._onCreateDebugAdapterTracker.fire(e);
                return e.tracker;
            }
        });
    }
    dispose() {
        this._disposables.forEach(x => x.dispose);
    }
    async _go() {
        if (this._goExtension) {
            return this._goExtension;
        }
        const ext = vscode.extensions.getExtension('golang.go');
        if (!ext) {
            throw new Error('Go extension should be installed');
        }
        if (!ext.isActive) {
            await ext.activate();
        }
        this._goExtension = ext.exports;
        return this._goExtension;
    }
    getTests() {
        const result = [];
        const stack = [];
        const push = (values) => values.forEach(x => stack.push(x));
        push(this.controller.items);
        while (true) {
            const entry = stack.pop();
            if (!entry) {
                break;
            }
            if (entry.range) {
                result.push(entry);
            }
            push(entry.children);
        }
        return result;
    }
    _findFileEntry(uri) {
        return (0, util_2.firstChild)(this.controller.items, (x) => x.uri?.path === uri.path && this._map.get(x) === 'file');
    }
    _findFileEntriesWithNoChildren() {
        return (0, util_2.filterChildren)(this.controller.items, (x) => this._map.get(x) === 'file' && !x.children.size);
    }
    _findPackageEntriesWithNoChildren() {
        return (0, util_2.filterChildren)(this.controller.items, (x) => this._map.get(x) === 'package' && !x.children.size);
    }
    _purgeEntriesWithNoChildren() {
        for (const x of this._findFileEntriesWithNoChildren()) {
            assert(x.parent);
            this._map.delete(x);
            x.parent.children.delete(x.id);
        }
        for (const x of this._findPackageEntriesWithNoChildren()) {
            this._map.delete(x);
            this.controller.items.delete(x.id);
        }
    }
    async _refreshPackageEntry(test) {
        assert(test.uri);
        (0, util_2.traceChildren)(test).forEach(x => this._map.delete(x));
        test.children.replace([]);
        const files = await vscode.workspace.fs.readDirectory(test.uri);
        for (const [filename, fileType] of files) {
            if (fileType !== vscode.FileType.File) {
                continue;
            }
            await this._discoverTestsInFile(vscode.Uri.joinPath(test.uri, filename));
        }
    }
    async _refreshFileEntry(test) {
        assert(test.uri);
        test.children.forEach(x => this._map.delete(x));
        test.children.replace([]);
        await this._discoverTestsInFile(test.uri);
    }
    async _discoverTestsInFile(uri, content) {
        if (uri.scheme !== 'file' || !uri.path.endsWith('_test.go')) {
            return;
        }
        if (uri.path.split(path.sep).includes('testdata')) {
            /**
             * As per `go help test` docs:
             * > The go tool will ignore a directory named "testdata", making it available to hold ancillary data needed by the tests.
             */
            return;
        }
        const filename = (0, path_1.basename)(uri.path);
        if (filename.startsWith('.') || filename.startsWith('_')) {
            /**
             * As per `go help test` docs:
             * > Files whose names begin with "_" (including "_test.go") or "." are ignored.
             */
            return;
        }
        content ?? (content = new util_1.TextDecoder().decode(await vscode.workspace.fs.readFile(uri)));
        const packageName = new parser_1.GoParser(content).parsePackageName()?.name;
        if (!packageName) {
            return;
        }
        const discovered = this.adapter.discoverTestFunctions(content, uri.path);
        if (!discovered.length) {
            return;
        }
        let updated = false;
        const directory = uri.with({ path: (0, path_1.dirname)(uri.path) });
        const packageId = `${directory.path}:${packageName}`;
        let packageItem = this.controller.items.get(packageId);
        if (!packageItem) {
            const directoryAsRelative = vscode.workspace.asRelativePath(directory.fsPath + '/.');
            const label = `${directoryAsRelative}${directoryAsRelative ? '/' : ''}${packageName}`;
            packageItem = this.controller.createTestItem(packageId, label, directory);
            this.controller.items.add(packageItem);
            this._map.set(packageItem, 'package');
            updated = true;
        }
        const filenameWithoutExtension = filename.split('.').slice(0, -1).join('.');
        const fileId = filenameWithoutExtension;
        let fileItem = packageItem.children.get(fileId);
        if (!fileItem) {
            fileItem = this.controller.createTestItem(fileId, filename, uri);
            packageItem.children.add(fileItem);
            this._map.set(fileItem, 'file');
            updated = true;
        }
        for (const t of discovered) {
            const id = t.receiverType ? `${t.receiverType}.${t.functionName}` : t.functionName;
            const item = this.controller.createTestItem(id, id, uri);
            item.range = new vscode.Range(...t.range);
            fileItem.children.add(item);
            this._map.set(item, t);
            updated = true;
        }
        if (updated) {
            this._onUpdateEmitter.fire();
        }
    }
    async _discoverAllTests(token) {
        if (token?.isCancellationRequested) {
            return [];
        }
        this.controller.items.replace([]);
        if (!vscode.workspace.workspaceFolders) {
            return []; // handle the case of no open folders
        }
        const cancelPromise = token ? this._getCancellationTokenPromise(token) : undefined;
        const promises = vscode.workspace.workspaceFolders.map(async (workspaceFolder) => {
            const pattern = new vscode.RelativePattern(workspaceFolder, '**/*_test.go');
            const watcher = vscode.workspace.createFileSystemWatcher(pattern);
            this._disposables.push(watcher, 
            // When files are created, make sure there's a corresponding "file" node in the tree
            watcher.onDidCreate(async (uri) => { await this._discoverTestsInFile(uri); }), 
            // When files change, re-parse them. Note that you could optimize this so
            // that you only re-parse children that have been resolved in the past.
            watcher.onDidChange(async (uri) => {
                const test = this._findFileEntry(uri);
                if (!test) {
                    await this._discoverTestsInFile(uri);
                }
                else {
                    await this._refreshFileEntry(test);
                }
                this._purgeEntriesWithNoChildren();
            }), 
            // And, finally, delete TestItems for removed files. This is simple, since
            // we use the URI as the TestItem's ID.
            watcher.onDidDelete(uri => {
                const test = this._findFileEntry(uri);
                if (!test) {
                    return;
                }
                test.parent?.children.delete(test.id);
                this._map.delete(test);
                this._purgeEntriesWithNoChildren();
            }));
            const allFiles = vscode.workspace.findFiles(pattern);
            const race = await Promise.race([allFiles, ...(cancelPromise ? [cancelPromise] : [])]);
            if (!race) {
                return watcher;
            }
            for (const file of race) {
                if (token?.isCancellationRequested) {
                    break;
                }
                this._discoverTestsInFile(file);
            }
            return watcher;
        });
        return await Promise.all(promises);
    }
    _getCancellationTokenPromise(token) {
        return new Promise(resolve => {
            if (token.isCancellationRequested) {
                resolve();
            }
            const listener = token.onCancellationRequested(e => {
                listener.dispose();
                resolve();
            });
            this._disposables.push(listener);
        });
    }
    async _startTestRun(isDebug, request, token) {
        const queue = [];
        const run = this.controller.createTestRun(request);
        function gatherTestItems(collection) {
            const items = [];
            collection.forEach(item => items.push(item));
            return items;
        }
        const discoverTests = async (tests) => {
            for (const test of tests) {
                if (request.exclude?.includes(test)) {
                    continue;
                }
                const data = this._map.get(test);
                if (!data) {
                    continue;
                }
                if (data === 'file' || data === 'package') {
                    await discoverTests(gatherTestItems(test.children));
                }
                else {
                    run.enqueued(test);
                    queue.push({ test, data });
                }
            }
        };
        const runTestQueue = async () => {
            for (const { test, data } of queue) {
                if (run.token.isCancellationRequested) {
                    run.skipped(test);
                    this._log(`Skipped ${test.id}\r\n`, run);
                }
                else {
                    run.started(test);
                    this._log(`Running ${test.id}\r\n`, run);
                    if (isDebug) {
                        this.telemetry.reporter.sendTelemetryEvent(this.telemetry.events.debug);
                        await this._debug(run, test, data, token);
                    }
                    else {
                        this.telemetry.reporter.sendTelemetryEvent(this.telemetry.events.run);
                        await this._run(run, test, data, token);
                    }
                    this._log(`Completed ${test.id}\r\n`, run);
                }
            }
            run.end();
        };
        await discoverTests(request.include ?? gatherTestItems(this.controller.items));
        if (!queue.length) {
            vscode.window.showErrorMessage("No tests to run");
            run.end();
            return;
        }
        else if (isDebug && queue.length > 1) {
            vscode.window.showErrorMessage("The extension does not support debugging multiple tests");
            run.end();
            return;
        }
        await runTestQueue();
    }
    ;
    async _run(run, test, data, token) {
        assert(test.uri);
        const execution = (await this._go()).settings.getExecutionCommand('go');
        if (!execution) {
            this._log(_FAILED_TO_RETRIEVE_GO_EXECUTION_PARAMS_ERROR_MESSAGE, run);
            run.skipped(test);
            return;
        }
        const cmd = this.adapter.getRunCommand(data, test.uri?.path);
        const testDirectory = (0, path_1.dirname)(test.uri.path);
        const command = cmd.command || execution.binPath;
        const args = cmd.args || ['test'];
        test.busy = true;
        const start = Date.now();
        const result = await new Promise(resolve => {
            assert(test.uri);
            const cp = (0, child_process_1.spawn)(command, args, {
                cwd: testDirectory,
                env: execution.env || undefined,
            });
            const result = {
                code: 0,
                stdout: '',
                stderr: '',
            };
            cp.stdout.on('data', (data) => {
                result.stdout += data.toString().replace(/\r?\n/g, '\r\n');
            });
            cp.stderr.on('data', (data) => {
                result.stderr += data.toString().replace(/\r?\n/g, '\r\n');
                ;
            });
            cp.on('close', (code) => {
                result.code = code;
                resolve(result);
            });
        });
        test.busy = false;
        if (result.code === 0) {
            if (result.stdout) {
                this._log(result.stdout, run);
            }
            run.passed(test, Date.now() - start);
        }
        else {
            this._log(`test failed (exit code: ${result.code}): ${test.id}`, run);
            if (result.stdout) {
                this._log(result.stdout, run);
            }
            if (result.stderr) {
                this._log(result.stderr, run);
            }
            run.failed(test, new vscode.TestMessage(`${result.stdout}\r\n${result.stderr}`), Date.now() - start);
        }
    }
    async _debug(run, test, data, token) {
        assert(test.uri);
        const execution = (await this._go()).settings.getExecutionCommand('go');
        if (!execution) {
            this._log(_FAILED_TO_RETRIEVE_GO_EXECUTION_PARAMS_ERROR_MESSAGE, run);
            run.skipped(test);
            return;
        }
        const goCheckSessionIDKey = 'goTestSessionID';
        const sessionId = (0, crypto_1.randomUUID)();
        let tracker = undefined;
        const trackerListener = this._onCreateDebugAdapterTracker.event(e => {
            if (e.tracker || e.session.configuration[goCheckSessionIDKey] !== sessionId) {
                return;
            }
            e.tracker = tracker = new GoTestDebugAdapterTracker();
            trackerListener.dispose();
        });
        this._disposables.push(trackerListener);
        const testDirectory = (0, path_1.dirname)(test.uri.path);
        const cmd = this.adapter.getDebugCommand(data, test.uri.path);
        const program = cmd.program || testDirectory;
        const args = cmd.args || [];
        let sessionStartSignal;
        const sessionStartPromise = new Promise(resolve => { sessionStartSignal = resolve; });
        const listener = vscode.debug.onDidStartDebugSession(e => {
            if (e.configuration[goCheckSessionIDKey] === sessionId) {
                sessionStartSignal(e);
                listener.dispose();
            }
        });
        this._disposables.push(listener);
        const logFile = this._getLogFilePath(sessionId);
        const started = await vscode.debug.startDebugging(vscode.workspace.getWorkspaceFolder(test.uri), {
            [goCheckSessionIDKey]: sessionId,
            type: 'go',
            request: 'launch',
            mode: 'test',
            name: `Debug test ${test.id}`,
            cwd: testDirectory,
            env: execution?.env,
            program,
            args,
            showLog: true,
            logDest: logFile.fsPath,
        });
        if (!started) {
            this._log('error: debug session did not start', run);
            run.skipped(test);
            return;
        }
        let sessionStopSignal;
        const sessionStopPromise = new Promise(resolve => { sessionStopSignal = resolve; });
        const listener2 = vscode.debug.onDidTerminateDebugSession(e => {
            if (e.configuration[goCheckSessionIDKey] === sessionId) {
                if (tracker) {
                    const stdout = tracker.stdout.join('\r\n');
                    const stderr = tracker.stderr.join('\r\n');
                    const others = tracker.others.join('\r\n');
                    const trail = [stdout, stderr, others].join('\r\n');
                    const markAsFailed = () => run.failed(test, new vscode.TestMessage(trail));
                    const markAsPassed = () => run.passed(test);
                    this._log(trail);
                    if (tracker.error) {
                        markAsFailed();
                    }
                    else if (tracker.exitCode !== undefined) {
                        if (!tracker.exitCode) {
                            markAsPassed();
                        }
                        else {
                            markAsFailed();
                        }
                    }
                    else {
                        if (/^PASS$/m.exec(stdout)) {
                            markAsPassed();
                        }
                        else if (/^FAIL$/m.exec(stdout)) {
                            markAsFailed();
                        }
                        else {
                            run.skipped(test);
                        }
                    }
                }
                else {
                    run.skipped(test);
                }
                const debuggerLog = (0, util_2.tryReadFileSync)(logFile.fsPath);
                if (debuggerLog) {
                    this._log(debuggerLog, run);
                }
                listener2.dispose();
                sessionStopSignal();
            }
        });
        this._disposables.push(listener2);
        const session = await sessionStartPromise;
        const cancelListener = token.onCancellationRequested(e => {
            vscode.debug.stopDebugging(session);
            cancelListener.dispose();
        });
        this._disposables.push(cancelListener);
        await sessionStopPromise;
    }
    _getLogFilePath(name) {
        return vscode.Uri.joinPath(this.logUri, name);
    }
    _log(message, run) {
        this.output.appendLine(message);
        run?.appendOutput(message);
    }
}
exports.TestProvider = TestProvider;
class GoTestDebugAdapterTracker {
    constructor() {
        this.stdout = [];
        this.stderr = [];
        this.others = [];
        this._exitCode = undefined;
        this._error = undefined;
    }
    get exitCode() {
        return this._exitCode;
    }
    get error() {
        return this._error;
    }
    /**
     * The debug adapter has sent a Debug Adapter Protocol message to the editor.
     */
    onDidSendMessage(message) {
        if (message['type'] !== 'event' || message['event'] !== 'output') {
            return;
        }
        if (message.body.category === 'stdout') {
            this.stdout.push(message.body.output);
        }
        else if (message.body.category === 'stderr') {
            this.stderr.push(message.body.output);
        }
        else {
            this.others.push(message.body.output);
        }
    }
    /**
     * An error with the debug adapter has occurred.
     */
    onError(error) {
        this._error = error;
    }
    /**
     * The debug adapter has exited with the given exit code or signal.
     */
    onExit(code, signal) {
        this._exitCode = code;
    }
}
class GocheckTestLibraryAdapter {
    discoverTestFunctions(content, path) {
        return new parser_1.GoParser(content).parse()?.testFunctions.filter(x => x.kind === 'gocheck') || [];
    }
    getRunCommand(data, path) {
        assert(data.receiverType);
        return { args: ['test', '-check.f', `^${data.receiverType}.${data.functionName}$`] };
    }
    getDebugCommand(data, path) {
        assert(data.receiverType);
        return { args: ['-check.f', `^${data.receiverType}.${data.functionName}$`] };
    }
}
exports.GocheckTestLibraryAdapter = GocheckTestLibraryAdapter;
class QtsuiteTestLibraryAdapter {
    discoverTestFunctions(content, path) {
        return new parser_1.GoParser(content).parse()?.testFunctions.filter(x => x.kind === 'quicktest') || [];
    }
    getRunCommand(data, path) {
        return { args: ['test', '-run', `.*/${data.functionName}`] };
    }
    getDebugCommand(data, path) {
        return { args: ['-test.run', `.*/${data.functionName}`] };
    }
}
exports.QtsuiteTestLibraryAdapter = QtsuiteTestLibraryAdapter;
//# sourceMappingURL=provider.js.map