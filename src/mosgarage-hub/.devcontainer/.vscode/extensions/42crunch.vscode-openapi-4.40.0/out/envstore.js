"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvStore = void 0;
const vscode_1 = require("vscode");
const ENV_DEFAULT_KEY = "openapi-42crunch.environment-default";
const ENV_SECRETS_KEY = "openapi-42crunch.environment-secrets";
class EnvStore {
    constructor(memento, secret) {
        this.memento = memento;
        this.secret = secret;
        this._onEnvironmentDidChange = new vscode_1.EventEmitter();
    }
    get onEnvironmentDidChange() {
        return this._onEnvironmentDidChange.event;
    }
    async save(env) {
        if (env.name === "default") {
            await this.memento.update(ENV_DEFAULT_KEY, env.environment);
        }
        else if (env.name === "secrets") {
            await this.secret.store(ENV_SECRETS_KEY, JSON.stringify(env.environment));
        }
        this._onEnvironmentDidChange.fire(env);
    }
    async all() {
        const defaultEnv = this.memento.get(ENV_DEFAULT_KEY, {});
        const secretsEnv = JSON.parse((await this.secret.get(ENV_SECRETS_KEY)) || "{}");
        return { default: defaultEnv, secrets: secretsEnv };
    }
}
exports.EnvStore = EnvStore;
//# sourceMappingURL=envstore.js.map