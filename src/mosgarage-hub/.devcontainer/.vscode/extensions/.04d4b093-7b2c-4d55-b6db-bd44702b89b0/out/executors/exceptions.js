"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComposeUnhandledError = exports.ComposeFileNotFound = exports.ComposeCommandNotFound = exports.ComposeExecutorError = exports.DockerUnhandledError = exports.DockerExecutorError = exports.ExecutorError = void 0;
class ExecutorError extends Error {
    constructor(message, output) {
        super();
        this.message = message;
        this.output = output;
    }
}
exports.ExecutorError = ExecutorError;
class DockerExecutorError extends ExecutorError {
}
exports.DockerExecutorError = DockerExecutorError;
class DockerUnhandledError extends DockerExecutorError {
}
exports.DockerUnhandledError = DockerUnhandledError;
class ComposeExecutorError extends ExecutorError {
}
exports.ComposeExecutorError = ComposeExecutorError;
class ComposeCommandNotFound extends ComposeExecutorError {
}
exports.ComposeCommandNotFound = ComposeCommandNotFound;
class ComposeFileNotFound extends ComposeExecutorError {
}
exports.ComposeFileNotFound = ComposeFileNotFound;
class ComposeUnhandledError extends ComposeExecutorError {
}
exports.ComposeUnhandledError = ComposeUnhandledError;
//# sourceMappingURL=exceptions.js.map