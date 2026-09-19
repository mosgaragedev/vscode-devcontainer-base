"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
let geminiCliCommand;
let isGeminiCliAvailableCached = undefined;
let isGitAvailableCached = undefined;
async function getGitInstallPathFromRegistry() {
    try {
        const { stdout } = await new Promise((resolve, reject) => {
            (0, child_process_1.exec)('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\GitForWindows" /v InstallPath', (error, stdout, stderr) => {
                if (error) {
                    (0, child_process_1.exec)('reg query "HKEY_CURRENT_USER\\SOFTWARE\\GitForWindows" /v InstallPath', (error2, stdout2, stderr2) => {
                        if (error2) {
                            reject(error2);
                        }
                        else {
                            resolve({ stdout: stdout2, stderr: stderr2 });
                        }
                    });
                }
                else {
                    resolve({ stdout, stderr });
                }
            });
        });
        const match = stdout.match(/InstallPath\s+REG_SZ\s+(.*)/);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    catch (error) {
        console.error("레지스트리에서 Git 설치 경로를 찾을 수 없습니다:", error);
        vscode.window.showErrorMessage("Git 설치 경로를 찾을 수 없습니다. Git이 설치되어 있는지 확인해주세요.");
        await checkGitExistence();
    }
    return undefined;
}
async function findExecutableInGitPath(exeName) {
    const gitInstallPath = await getGitInstallPathFromRegistry();
    if (gitInstallPath) {
        const gitBinPath = path.join(gitInstallPath, "bin", exeName);
        if (fs.existsSync(gitBinPath)) {
            return gitBinPath;
        }
        const gitCmdPath = path.join(gitInstallPath, exeName);
        if (fs.existsSync(gitCmdPath)) {
            return gitCmdPath;
        }
    }
    return undefined;
}
async function getShellPath(defaultPath) {
    const exeName = path.basename(defaultPath);
    const pathEnv = process.env.PATH || "";
    const pathDirs = pathEnv.split(path.delimiter);
    for (const dir of pathDirs) {
        const fullPath = path.join(dir, exeName);
        if (fs.existsSync(fullPath)) {
            return fullPath;
        }
    }
    const gitExePath = await findExecutableInGitPath(exeName);
    if (gitExePath) {
        return gitExePath;
    }
    if (exeName.includes("bash")) {
        vscode.window.showErrorMessage(`'${exeName}' 쉘 경로를 찾을 수 없습니다. Git Bash가 설치되어 있는지 확인해주세요.`);
    }
    else {
        vscode.window.showErrorMessage(`'${exeName}' 쉘 경로를 찾을 수 없습니다.`);
    }
    return defaultPath;
}
async function checkGeminiCliExistence() {
    if (isGeminiCliAvailableCached !== undefined) {
        return isGeminiCliAvailableCached;
    }
    return new Promise(resolve => {
        (0, child_process_1.exec)('gemini --version', (error) => {
            if (error) {
                vscode.window.showErrorMessage("Gemini CLI를 찾을 수 없습니다. 설치되어 있는지 확인하거나 PATH에 추가해주세요.", "설치 가이드 보기").then(selection => {
                    if (selection === "설치 가이드 보기") {
                        vscode.env.openExternal(vscode.Uri.parse("https://github.com/google-gemini/gemini-cli?tab=readme-ov-file#quick-install"));
                    }
                });
                isGeminiCliAvailableCached = false;
                resolve(false);
            }
            else {
                isGeminiCliAvailableCached = true;
                resolve(true);
            }
        });
    });
}
async function checkGitExistence() {
    if (isGitAvailableCached !== undefined) {
        return isGitAvailableCached;
    }
    return new Promise(resolve => {
        (0, child_process_1.exec)('git --version', (error) => {
            if (error) {
                vscode.window.showErrorMessage("Git을 찾을 수 없습니다. 설치되어 있는지 확인하거나 PATH에 추가해주세요.", "설치 가이드 보기").then(selection => {
                    if (selection === "설치 가이드 보기") {
                        vscode.env.openExternal(vscode.Uri.parse("https://git-scm.com/downloads"));
                    }
                });
                isGitAvailableCached = false;
                resolve(false);
            }
            else {
                isGitAvailableCached = true;
                resolve(true);
            }
        });
    });
}
function updateGeminiCliCommand() {
    const config = vscode.workspace.getConfiguration("gemini.cli");
    const useFlashModel = config.get("command.useFlash", true);
    const useYolo = config.get("command.yolo", true);
    const useAllFiles = config.get("command.allFiles", true);
    const useCheckpointing = config.get("command.checkpointing", true);
    const commandParts = ["gemini"];
    if (useFlashModel) {
        commandParts.push("-m gemini-2.5-flash");
    }
    if (useYolo) {
        commandParts.push("-y");
    }
    if (useAllFiles) {
        commandParts.push("--all-files");
    }
    if (useCheckpointing) {
        commandParts.push("--checkpointing");
    }
    geminiCliCommand = commandParts.join(" ");
}
async function executeGeminiCommand(uri, shellType) {
    let command;
    let targetCwd;
    const isGeminiCliAvailable = await checkGeminiCliExistence();
    if (!isGeminiCliAvailable) {
        return;
    }
    if (uri) {
        const stats = fs.statSync(uri.fsPath);
        if (stats.isDirectory()) {
            targetCwd = uri.fsPath;
        }
        else {
            targetCwd = path.dirname(uri.fsPath);
        }
    }
    else {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        targetCwd = workspaceFolder ? workspaceFolder.uri.fsPath : process.cwd();
    }
    switch (shellType) {
        case "powershell":
            command = `start "PowerShell" powershell -NoExit -Command "${geminiCliCommand}"`;
            break;
        case "cmd":
            command = `start "CMD" cmd.exe /k "${geminiCliCommand}"`;
            break;
        case "bash":
            const BashPath = await getShellPath("bash.exe");
            command = `start "Git Bash" "${BashPath}" -c "${geminiCliCommand}"`;
            break;
        case "gitbash":
            const gitBashPath = await getShellPath("git-bash.exe");
            command = `start "Git Bash" "${gitBashPath}" -c "${geminiCliCommand}"`;
            break;
    }
    vscode.window.showInformationMessage(`'${targetCwd}'에서 Gemini CLI를 ${shellType}로 실행합니다.`);
    (0, child_process_1.exec)(command, { cwd: targetCwd });
}
async function activate(context) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : process.cwd();
    await checkGitExistence();
    await checkGeminiCliExistence();
    updateGeminiCliCommand();
    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration("gemini.cli")) {
            updateGeminiCliCommand();
        }
    });
    const geminiStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    geminiStatusBarItem.command = "gemini.cli";
    geminiStatusBarItem.text = "$(sparkle) Gemini CLI";
    geminiStatusBarItem.tooltip = `Gemini CLI Launcher: ${geminiCliCommand}`;
    geminiStatusBarItem.show();
    const openGeminiDisposable = vscode.commands.registerCommand("gemini.cli", async () => {
        const isGeminiCliAvailable = await checkGeminiCliExistence();
        if (!isGeminiCliAvailable) {
            return;
        }
        vscode.window
            .createTerminal({
            name: "Gemini CLI",
            shellPath: "powershell.exe",
            shellArgs: [
                "-NoExit",
                "-Command",
                `& ${geminiCliCommand}`,
            ],
            cwd,
        })
            .show();
    });
    const commandsToRegister = [
        { id: "gemini.cli.onPowerShell", shellType: "powershell" },
        { id: "gemini.cli.onCMD", shellType: "cmd" },
        { id: "gemini.cli.onBash", shellType: "bash" },
        { id: "gemini.cli.onGitBash", shellType: "gitbash" },
    ];
    const disposables = commandsToRegister.map(cmd => {
        return vscode.commands.registerCommand(cmd.id, async (uri) => {
            const isGeminiCliAvailable = await checkGeminiCliExistence();
            if (!isGeminiCliAvailable) {
                return;
            }
            executeGeminiCommand(uri, cmd.shellType);
        });
    });
    context.subscriptions.push(geminiStatusBarItem, openGeminiDisposable, ...disposables);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map