export interface Dependency {
    name: string;
    command: string;
    installCommand: string;
    description?: string;
    minVersion?: string;
    versionCommand?: string;
    versionParser?: (output: string) => string | null;
}
export interface DependencyCheckResult {
    satisfied: boolean;
    missingDependencies: Dependency[];
    versionMismatches: Array<{
        dependency: Dependency;
        currentVersion: string;
        requiredVersion: string;
    }>;
}
/**
 * Check if all dependencies are satisfied (including versions)
 */
export declare function checkDependencies(dependencies: Dependency[]): Promise<DependencyCheckResult>;
/**
 * Format a helpful error message for missing dependencies and version mismatches
 */
export declare function formatDependencyError(toolName: string, missingDeps: Dependency[], versionMismatches?: Array<{
    dependency: Dependency;
    currentVersion: string;
    requiredVersion: string;
}>): string;
/**
 * Common dependencies for Ansible tools
 */
export declare const COMMON_DEPENDENCIES: {
    ansible: {
        name: string;
        command: string;
        installCommand: string;
        description: string;
        minVersion: string;
        versionCommand: string;
        versionParser: (output: string) => string | null;
    };
    ansibleLint: {
        name: string;
        command: string;
        installCommand: string;
        description: string;
        minVersion: string;
        versionCommand: string;
        versionParser: (output: string) => string | null;
    };
    ansibleNavigator: {
        name: string;
        command: string;
        installCommand: string;
        description: string;
        minVersion: string;
        versionCommand: string;
        versionParser: (output: string) => string | null;
    };
    ansibleCreator: {
        name: string;
        command: string;
        installCommand: string;
        description: string;
        minVersion: string;
        versionCommand: string;
        versionParser: (output: string) => string | null;
    };
    python: {
        name: string;
        command: string;
        installCommand: string;
        description: string;
        minVersion: string;
        versionCommand: string;
        versionParser: (output: string) => string | null;
    };
};
