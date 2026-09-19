export declare function createZenOfAnsibleHandler(): () => Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function createAgentsGuidelinesHandler(): () => Promise<{
    content: {
        type: "text";
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: "text";
        text: string;
    }[];
    isError: boolean;
}>;
export declare function createAnsibleLintHandler(): (args: {
    filePath: string;
    fix?: boolean;
}) => Promise<{
    content: {
        type: "text";
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: "text";
        text: string;
    }[];
    isError: boolean;
}>;
export declare function createWorkspaceFileHandler(workspaceRoot: string): (uri: URL, variables: Record<string, string | string[]>) => Promise<{
    contents: {
        uri: string;
        mimeType: string;
        text: string;
    }[];
}>;
export declare function createListToolsHandler(getToolNames: () => string[]): () => Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function createADEEnvironmentInfoHandler(workspaceRoot: string): () => Promise<{
    content: {
        type: "text";
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: "text";
        text: string;
    }[];
    isError: boolean;
}>;
export declare function createADESetupEnvironmentHandler(workspaceRoot: string): (args: {
    envName?: string;
    pythonVersion?: string;
    collections?: string[];
    installRequirements?: boolean;
    requirementsFile?: string;
}) => Promise<{
    content: {
        type: "text";
        text: string;
    }[];
    isError: boolean;
}>;
export declare function createADTCheckEnvHandler(): () => Promise<{
    content: {
        type: "text";
        text: string;
    }[];
    isError: boolean;
}>;
export declare function createAnsibleNavigatorHandler(): (args: {
    userMessage?: string;
    filePath?: string;
    mode?: string;
    environment?: string;
    disableExecutionEnvironment?: boolean;
}, workspaceRoot?: string) => Promise<{
    content: {
        type: "text";
        text: string;
    }[];
    isError: boolean;
} | {
    content: {
        type: "text";
        text: string;
    }[];
    isError?: undefined;
}>;
export declare function createDefineAndBuildExecutionEnvHandler(workspaceRoot: string): (args: {
    baseImage: string;
    tag: string;
    destinationPath?: string;
    collections?: string[];
    systemPackages?: string[];
    pythonPackages?: string[];
    generatedYaml?: string;
}) => Promise<{
    content: {
        type: "text";
        text: string;
    }[];
    isError: boolean;
}>;
