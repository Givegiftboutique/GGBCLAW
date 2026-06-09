export declare const REQUEST_TIMEOUT_MS: 3500;
export declare function readOnlyGetJson(baseUrl: string, endpoint: string, id?: string): Promise<unknown>;
export declare function readDevGatewayFixtures(baseUrl: string): Promise<Record<string, unknown>>;
