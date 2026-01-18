export type Paged<T> = {
    items: T[],
    count: number
}

//region Device
/**
 * @see [DeviceAlterSchema](https://iotroam.nl/api/v1/docs#/:~:text=object-,DeviceAlterSchema,-Expand%20all)
 */
export type DeviceAlter = {
    /**
     * @max-length <= 32 characters
     */
    name: string,
    owner: {
        type: 'group',
        id: number | string,
    },
    /**
     * @max-length <= 23 characters
     */
    mac: string,
    profile?: number | null,
    /**
     * @max-length <= 63 characters
     */
    password: string,
    expiry?: string | null,
    /**
     * @max-length 30 characters (Experimented limit not in api docs)
     */
    location?: string | null,
}
/**
 * @see [DeviceDetailsSchema](https://iotroam.nl/api/v1/docs#/:~:text=Schemas-,DeviceDetailsSchema,-Expand%20all)
 */
export type DeviceDetails = {
    id: number,
    mac: string,
    /**
     * @warning <= 32 characters
     */
    name: string,
    profile: ProfileDetails | null,
    owner: {
        type: 'group',
        id: number,
        name: string,
        url: string,
    }
    password: string,
    expiry: string,
    last_seen: string | null,
    location: string | null,
    url: string
}

export type DeviceAPI = {
    "/api/v1/device/{id}/details": {
        "GET": {
            parameters: {
                $path: {
                    id: number | string
                },
                $headers?: {
                    /**
                     * @default uses top level context X-API-Key override here
                     */
                    "X-API-Key"?: string
                }
            }
            return: DeviceDetails
        }
    },
    "/api/v1/device/{id}/edit": {
        "PUT": {
            parameters: {
                $path: {
                    id: number | string
                },
                $headers?: {
                    /**
                     * @default uses top level context X-API-Key override here
                     */
                    "X-API-Key"?: string
                }
                $body: Partial<DeviceAlter>
            },
            return: DeviceDetails
        }
    },
    "/api/v1/device/{id}/delete": {
        "DELETE": {
            parameters: {
                $path: {
                    id: number | string
                },
                $headers?: {
                    /**
                     * @default uses top level context X-API-Key override here
                     */
                    "X-API-Key"?: string
                }
            },
            return: void
        }
    },
    "/api/v1/device/add": {
        "POST": {
            parameters: {
                $body: DeviceAlter,
                $headers?: {
                    /**
                     * @default uses top level context X-API-Key override here
                     */
                    "X-API-Key"?: string
                }
            }
            return: DeviceDetails
        }
    }
};

//endregion

//region Group

/**
 * @see [ProfileDetailsSchema](https://iotroam.nl/api/v1/docs#/:~:text=ProfileDetailsSchema)
 */
export type ProfileDetails = {
    id: number,
    name: string,
    description: string,
    vlan: number
}

/**
 * @see [DeviceGroupDetailsSchema](https://dev.iotroam.org/api/v1/docs#/:~:text=DeviceGroupDetailsSchema)
 */
export type DeviceGroupDetails = {
    id: number,
    name: string,
    profile: ProfileDetails | null,
    icon: Icons,
    last_updated: string,
    default_expiry: number,
    url: string
}

/**
 * [Icon](https://dev.iotroam.org/api/v1/docs#/:~:text=string-,Icon,-Expand%20all)
 */
export type Icons =
    "icon-group"
    | "icon-buildings-2"
    | "icon-bulb-1"
    | "icon-fitness-weights-1"
    | "icon-surveillance-camera-1"
    | "icon-science-molecule-strucutre" //Typo in API-spec

/**
 * [Input](https://dev.iotroam.org/api/v1/docs#/:~:text=integer-,Input,-Collapse%20all)
 */
export type Input = {
    /**
     * @default 100
     */
    limit?: number,
    /**
     * @default 0
     */
    offset?: number
}

export type GroupAPI = {
    "/api/v1/group/list": {
        "GET": {
            parameters: {
                $query?: Input,
                $headers?: {
                    /**
                     * @default uses top level context X-API-Key override here
                     */
                    "X-API-Key"?: string
                }
            },
            return: Paged<DeviceGroupDetails>
        }
    },
    "/api/v1/group/{id}/details": {
        "GET": {
            parameters: {
                $path: {
                    id: number | string
                },
                $headers?: {
                    /**
                     * @default uses top level context X-API-Key override here
                     */
                    "X-API-Key"?: string
                }
            },
            return: DeviceGroupDetails
        }
    },
    "/api/v1/group/{id}/devices": {
        "GET": {
            parameters: {
                $path: {
                    id: string | number
                }
                $query?: Input,
                $headers?: {
                    /**
                     * @default uses top level context X-API-Key override here
                     */
                    "X-API-Key"?: string
                }
            },
            return: Paged<DeviceDetails>
        }
    },
}

//endregion

export type API = DeviceAPI & GroupAPI;

// region client
export const baseURL = new URL("https://iotroam.nl");

export type ClientConfig = {
    baseURL?: string | URL;
    apiKey: string;
    fetchImpl?: typeof fetch; // optional for node<18 / testing
};

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type MethodKey<P extends keyof API> = Extract<keyof API[P], HttpMethod>;

type Params<P extends keyof API, M extends MethodKey<P>> =
    API[P][M] extends { parameters: infer X } ? X : never;

type Ret<P extends keyof API, M extends MethodKey<P>> =
    API[P][M] extends { return: infer R } ? R : never;

type AnyArgs = {
    $path?: Record<string, string | number>;
    $query?: Record<string, any>;
    $headers?: Record<string, string | undefined>;
    $body?: unknown;
};

const client = (config: ClientConfig) => {
    const resolvedBase =
        config.baseURL === undefined
            ? baseURL
            : typeof config.baseURL === "string"
                ? new URL(config.baseURL)
                : config.baseURL;

    const fetchImpl = config.fetchImpl ?? fetch;


    const request = async <P extends keyof API, M extends MethodKey<P>>(
        path: P,
        method: M,
        args: Params<P, M>,
        requestInit?: RequestInit,
    ): Promise<Ret<P, M>> => {
        const a = args as unknown as AnyArgs;

        const pathParams = a.$path ?? {};
        const query = a.$query;
        const headersFromArgs = a.$headers ?? {};

        const resolvedPath = (path as string).replace(/\{(\w+)}/g, (_, key: string) => {
            const v = pathParams[key];
            if (v === undefined || v === null) throw new Error(`Missing $path.${key} for ${String(path)}`);
            return encodeURIComponent(String(v));
        });

        const url = new URL(resolvedPath.replace(/^\/+/, ""), resolvedBase);

        if (query) {
            for (const [k, v] of Object.entries(query)) {
                if (v === undefined || v === null) continue;
                if (Array.isArray(v)) for (const item of v) url.searchParams.append(k, String(item));
                else url.searchParams.set(k, String(v));
            }
        }

        const apiKey = headersFromArgs["X-API-Key"] ?? config.apiKey;

        const headers: Record<string, string> = {
            Accept: "application/json",
            "X-API-Key": apiKey,
            ...Object.fromEntries(
                Object.entries(headersFromArgs).filter(([, v]) => v !== undefined && v !== null)
            ) as Record<string, string>,
        };

        const init: RequestInit = {
            ...requestInit,
            method: method as string,
            headers: {
                ...requestInit?.headers,
                ...headers,
            }
        };

        if (a.$body !== undefined && (method as string) !== "GET") {
            (init.headers as Record<string, string>)["Content-Type"] = "application/json";
            init.body = JSON.stringify(a.$body);
        }

        const res = await fetchImpl(url.toString(), init);

        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} ${res.statusText}: ${txt}`);
        }

        if ((method as string) === "DELETE") return undefined as Ret<P, M>;

        const contentType = res.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
            const txt = await res.text().catch(() => "");
            return (txt ? (txt as any) : undefined) as Ret<P, M>;
        }

        return (await res.json()) as Ret<P, M>;
    };

    return {
        groups: {
            list: (options?: GroupAPI["/api/v1/group/list"]["GET"]["parameters"]["$query"], requestInit?: RequestInit) =>
                request("/api/v1/group/list", "GET", {$query: options}, requestInit),
            get: (input: GroupAPI["/api/v1/group/{id}/devices"]["GET"]["parameters"]["$path"], requestInit?: RequestInit) =>
                request("/api/v1/group/{id}/details", "GET", {$path: input}, requestInit),
            devices: (
                input: GroupAPI["/api/v1/group/{id}/devices"]["GET"]["parameters"]["$path"],
                options?: GroupAPI["/api/v1/group/{id}/devices"]["GET"]["parameters"]["$query"],
                requestInit?: RequestInit
            ) => request("/api/v1/group/{id}/devices", "GET", {$path: input, $query: options}, requestInit),
        },
        devices: {
            create: (input: DeviceAPI["/api/v1/device/add"]["POST"]["parameters"]["$body"], requestInit?: RequestInit) =>
                request("/api/v1/device/add", "POST", {$body: input}, requestInit),
            get: (input: DeviceAPI["/api/v1/device/{id}/details"]["GET"]["parameters"]["$path"], requestInit?: RequestInit) =>
                request("/api/v1/device/{id}/details", "GET", {$path: input},requestInit),
            update: (
                input: DeviceAPI["/api/v1/device/{id}/edit"]["PUT"]["parameters"]["$path"],
                update: DeviceAPI["/api/v1/device/{id}/edit"]["PUT"]["parameters"]["$body"],
                requestInit?: RequestInit
            ) => request("/api/v1/device/{id}/edit", "PUT", {$path: input, $body: update},requestInit),
            delete: (input: DeviceAPI["/api/v1/device/{id}/delete"]["DELETE"]["parameters"]["$path"], requestInit?: RequestInit) =>
                request("/api/v1/device/{id}/delete", "DELETE", {$path: input},requestInit),
        },
        request, // optional: expose the generic request
        set apiKey(apiKey: string) {
            config.apiKey = apiKey;
        }
    };
};

export const iotroam = client;

export default client
//endregion
