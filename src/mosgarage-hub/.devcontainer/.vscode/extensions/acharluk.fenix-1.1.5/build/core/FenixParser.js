"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const luajs = require("lua-in-js");
const FenixConfig_1 = require("./FenixConfig");
class FenixParser {
    constructor() {
        this._data = {};
        this._lua = luajs.createEnv();
    }
    static init() {
        if (!this.__instance) {
            this.__instance = new FenixParser();
        }
    }
    static get() {
        return this.__instance;
    }
    pushEnv() {
        this.clear();
        const env = FenixConfig_1.default.get().getEnv();
        for (let k in env) {
            this.push(k, env[k]);
        }
    }
    push(key, value) {
        this._data[key] = value;
    }
    get(key) {
        return this._data[key];
    }
    clear() {
        this._data = {};
    }
    renderRaw(inputStr, environment) {
        const _lua_data = this._data;
        let sc_lua_out = '';
        function superRender(something, format) {
            format = format || '%value%';
            if (typeof something === 'object') {
                if (Array.isArray(something)) {
                    something.forEach(s => superRender(s, format));
                }
                else {
                    let obj = something;
                    const regexList = [];
                    for (let key of Object.keys(obj)) {
                        regexList.push({
                            name: key,
                            reg: new RegExp(`%${key}%`, 'g'),
                        });
                    }
                    let ret = format;
                    regexList.forEach(r => {
                        ret = ret.replace(r.reg, something[r.name]);
                    });
                    sc_lua_out += ret;
                }
            }
            else {
                sc_lua_out += format.replace(/%value%/g, something);
            }
        }
        const fenixLib = new luajs.Table({
            render(var_name, format) {
                superRender(_lua_data[var_name] !== undefined ? _lua_data[var_name] : environment.find((e) => e.id === var_name).default || `<undefined_fenix_variable:${var_name}>`, format);
            },
            env(var_name) {
                return _lua_data[var_name] || `<undefined_fenix_variable:${var_name}>`;
            },
            date(format) {
                superRender(new Date().toLocaleDateString(format).toString());
            },
        });
        this._lua.loadLib('fnx', fenixLib);
        let openIndex = inputStr.indexOf('<$');
        while (openIndex > 0) {
            const closeIndex = inputStr.indexOf('$>');
            let parsing = inputStr.substring(openIndex, closeIndex + 2);
            sc_lua_out = '';
            this._lua.parse(parsing.substring(2, parsing.length - 2)).exec();
            inputStr = inputStr.replace(parsing, sc_lua_out);
            openIndex = inputStr.indexOf('<$');
        }
        return inputStr;
    }
}
exports.default = FenixParser;
//# sourceMappingURL=FenixParser.js.map