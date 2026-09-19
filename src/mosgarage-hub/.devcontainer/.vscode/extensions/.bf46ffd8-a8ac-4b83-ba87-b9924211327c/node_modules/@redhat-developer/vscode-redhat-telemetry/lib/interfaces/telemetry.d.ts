/**
 * Telemetry Event
 */
export interface TelemetryEvent {
    type?: string;
    name: string;
    properties?: any;
    measures?: any;
    traits?: any;
    context?: any;
}
/**
 * Service for sending Telemetry events
 */
export interface TelemetryService {
    /**
     * Sends a `startup` Telemetry event
     */
    sendStartupEvent(): Promise<void>;
    /**
     * Sends the Telemetry event
     */
    send(event: TelemetryEvent): Promise<void>;
    /**
     * Sends a `shutdown` Telemetry event
     */
    sendShutdownEvent(): Promise<void>;
    /**
     * Flushes the service's Telemetry events queue
     */
    flushQueue(): Promise<void>;
    /**
     * Dispose this service
     */
    dispose(): Promise<void>;
}
//# sourceMappingURL=telemetry.d.ts.map