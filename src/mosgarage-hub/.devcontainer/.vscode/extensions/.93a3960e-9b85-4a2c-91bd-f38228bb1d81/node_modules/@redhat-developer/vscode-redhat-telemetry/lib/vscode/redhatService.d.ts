import { ExtensionContext } from "vscode";
import { RedHatService } from "../interfaces/redhatService";
/**
 * Returns a new `RedHatService` instance for a Visual Studio Code extension. For telemetry, the following is performed:
 * - A preference listener enables/disables  telemetry based on changes to `redhat.telemetry.enabled`
 * - If `redhat.telemetry.enabled` is not set, a popup requesting telemetry opt-in will be displayed
 * - when the extension is deactivated, a telemetry shutdown event will be emitted (if telemetry is enabled)
 *
 * @param context the extension's context
 * @returns a Promise of RedHatService
 */
export declare function getRedHatService(context: ExtensionContext): Promise<RedHatService>;
//# sourceMappingURL=redhatService.d.ts.map