"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.html = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const template_1 = __importDefault(require("lodash/template"));
function compile(webview) {
    return template_1.default(`
    <html>
        <link rel="stylesheet" href="${assetPath(webview, 'css', 'gittags.css')}" >
        <body>
            <div id="container" class="ag-theme-blue"></div>

            <script>
            window.rows = <%= JSON.stringify(obj.tags) %>
            </script>
            <script src="${assetPath(webview, 'js', 'aggrid.js')}"></script>
            <script src="${assetPath(webview, 'js', 'app.js')}"></script>
        </body>
    </html>
`, { variable: 'obj' });
}
function html(tags, webview) {
    return compile(webview)({
        tags
    });
}
exports.html = html;
function assetPath(webview, ...args) {
    return webview.asWebviewUri(vscode.Uri.file(path.join(__dirname, '..', '..', 'assets', ...args)));
}
//# sourceMappingURL=index.js.map