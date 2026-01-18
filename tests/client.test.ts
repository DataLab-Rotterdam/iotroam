import { describe, it, expect, vi, beforeEach } from "vitest";
import iotroam from "../src"; // adjust if your entry differs

type FetchCall = [input: RequestInfo | URL, init?: RequestInit];

function lastCall(fetchMock: ReturnType<typeof vi.fn>): FetchCall {
    const calls = fetchMock.mock.calls as FetchCall[];
    if (calls.length === 0) throw new Error("fetch was not called");
    return calls[calls.length - 1];
}

function asHeaders(init?: RequestInit): Record<string, string> {
    const h = (init?.headers ?? {}) as any;

    // If caller passes a Headers instance, normalize it.
    if (typeof Headers !== "undefined" && h instanceof Headers) {
        return Object.fromEntries(h.entries());
    }

    // If caller passes array tuples, normalize it.
    if (Array.isArray(h)) {
        return Object.fromEntries(h);
    }

    return h as Record<string, string>;
}

describe("iotroam client", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("uses default baseURL when not provided", async () => {
        const fetchMock = vi.fn(async () => {
            return new Response(JSON.stringify({ items: [], count: 0 }), {
                status: 200,
                headers: { "content-type": "application/json" },
            });
        });

        const api = iotroam({ apiKey: "TOP", fetchImpl: fetchMock as any });

        await api.groups.list();

        const [input, init] = lastCall(fetchMock);
        expect(String(input)).toBe("https://iotroam.nl/api/v1/group/list");
        expect(init?.method).toBe("GET");
    });

    it("respects custom baseURL (string)", async () => {
        const fetchMock = vi.fn(async () => {
            return new Response(JSON.stringify({ items: [], count: 0 }), {
                status: 200,
                headers: { "content-type": "application/json" },
            });
        });

        const api = iotroam({
            apiKey: "TOP",
            baseURL: "https://example.test/root/",
            fetchImpl: fetchMock as any,
        });

        await api.groups.list();

        const [input] = lastCall(fetchMock);
        expect(String(input)).toBe("https://example.test/root/api/v1/group/list");
    });

    it("replaces {id} path params and encodes them", async () => {
        const fetchMock = vi.fn(async () => {
            return new Response(JSON.stringify({ items: [], count: 0 }), {
                status: 200,
                headers: { "content-type": "application/json" },
            });
        });

        const api = iotroam({ apiKey: "TOP", fetchImpl: fetchMock as any });

        await api.groups.devices({ id: "a/b" });

        const [input] = lastCall(fetchMock);
        expect(String(input)).toContain("/api/v1/group/a%2Fb/devices");
    });

    it("throws when required $path param is missing", async () => {
        const fetchMock = vi.fn(async () => {
            return new Response("ok", { status: 200 });
        });

        const api = iotroam({ apiKey: "TOP", fetchImpl: fetchMock as any });

        // call the generic request to simulate incorrect usage
        await expect(
            api.request("/api/v1/group/{id}/details", "GET", { $path: {} } as any)
        ).rejects.toThrow(/Missing \$path\.id/);

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("encodes query params, skips undefined/null, supports arrays", async () => {
        const fetchMock = vi.fn(async () => {
            return new Response(JSON.stringify({ items: [], count: 0 }), {
                status: 200,
                headers: { "content-type": "application/json" },
            });
        });

        const api = iotroam({ apiKey: "TOP", fetchImpl: fetchMock as any });

        await api.request("/api/v1/group/list", "GET", {
            $query: {
                limit: 10,
                offset: 0,
                q: undefined,
                n: null,
                tags: ["a", "b"],
            },
        } as any);

        const [input] = lastCall(fetchMock);
        const url = new URL(String(input));

        expect(url.searchParams.get("limit")).toBe("10");
        expect(url.searchParams.get("offset")).toBe("0");
        expect(url.searchParams.get("q")).toBeNull();
        expect(url.searchParams.get("n")).toBeNull();

        const tags = url.searchParams.getAll("tags");
        expect(tags).toEqual(["a", "b"]);
    });

    it("sets Accept: application/json and X-API-Key by default", async () => {
        const fetchMock = vi.fn(async () => {
            return new Response(JSON.stringify({ items: [], count: 0 }), {
                status: 200,
                headers: { "content-type": "application/json" },
            });
        });

        const api = iotroam({ apiKey: "TOP", fetchImpl: fetchMock as any });

        await api.groups.list();

        const [, init] = lastCall(fetchMock);
        const h = asHeaders(init);

        expect(h.Accept).toBe("application/json");
        expect(h["X-API-Key"]).toBe("TOP");
    });

    it("allows per-request X-API-Key override via $headers", async () => {
        const fetchMock = vi.fn(async () => {
            return new Response(JSON.stringify({ items: [], count: 0 }), {
                status: 200,
                headers: { "content-type": "application/json" },
            });
        });

        const api = iotroam({ apiKey: "TOP", fetchImpl: fetchMock as any });

        await api.request("/api/v1/group/list", "GET", {
            $headers: { "X-API-Key": "OVERRIDE" },
        } as any);

        const [, init] = lastCall(fetchMock);
        const h = asHeaders(init);
        expect(h["X-API-Key"]).toBe("OVERRIDE");
    });

    it("merges RequestInit headers (caller can add extra headers)", async () => {
        const fetchMock = vi.fn(async () => {
            return new Response(JSON.stringify({ items: [], count: 0 }), {
                status: 200,
                headers: { "content-type": "application/json" },
            });
        });

        const api = iotroam({ apiKey: "TOP", fetchImpl: fetchMock as any });

        await api.groups.list(undefined, {
            headers: { "X-Trace": "123" },
        });

        const [, init] = lastCall(fetchMock);
        const h = asHeaders(init);

        expect(h["X-Trace"]).toBe("123");
        expect(h["X-API-Key"]).toBe("TOP");
    });

    it("serializes $body as JSON for non-GET and sets Content-Type", async () => {
        const fetchMock = vi.fn(async () => {
            return new Response(JSON.stringify({ id: 1 }), {
                status: 200,
                headers: { "content-type": "application/json" },
            });
        });

        const api = iotroam({ apiKey: "TOP", fetchImpl: fetchMock as any });

        await api.devices.create({
            name: "device",
            mac: "AA:BB:CC:DD:EE:FF",
            password: "pw",
            owner: { type: "group", id: 1 },
        });

        const [, init] = lastCall(fetchMock);
        const h = asHeaders(init);

        expect(init?.method).toBe("POST");
        expect(h["Content-Type"]).toBe("application/json");
        expect(typeof init?.body).toBe("string");
        expect(JSON.parse(String(init?.body))).toMatchObject({
            name: "device",
            mac: "AA:BB:CC:DD:EE:FF",
            password: "pw",
            owner: { type: "group", id: 1 },
        });
    });

    it("DELETE returns undefined without attempting JSON parse", async () => {
        const fetchMock = vi.fn(async () => {
            return new Response("", { status: 200 });
        });

        const api = iotroam({ apiKey: "TOP", fetchImpl: fetchMock as any });

        const result = await api.devices.delete({ id: 123 });
        expect(result).toBeUndefined();
    });

    it("returns text when response is not application/json", async () => {
        const fetchMock = vi.fn(async () => {
            return new Response("plain text", {
                status: 200,
                headers: { "content-type": "text/plain" },
            });
        });

        const api = iotroam({ apiKey: "TOP", fetchImpl: fetchMock as any });

        const out = await api.request("/api/v1/group/list", "GET", {} as any);
        expect(out).toBe("plain text");
    });

    it("throws on non-ok response and includes response body text", async () => {
        const fetchMock = vi.fn(async () => {
            return new Response("bad things happened", {
                status: 400,
                statusText: "Bad Request",
                headers: { "content-type": "text/plain" },
            });
        });

        const api = iotroam({ apiKey: "TOP", fetchImpl: fetchMock as any });

        await expect(api.groups.list()).rejects.toThrow(
            /HTTP 400 Bad Request: bad things happened/
        );
    });

    it("supports updating apiKey via setter", async () => {
        const fetchMock = vi.fn(async () => {
            return new Response(JSON.stringify({ items: [], count: 0 }), {
                status: 200,
                headers: { "content-type": "application/json" },
            });
        });

        const api = iotroam({ apiKey: "OLD", fetchImpl: fetchMock as any });

        api.apiKey = "NEW";
        await api.groups.list();

        const [, init] = lastCall(fetchMock);
        const h = asHeaders(init);
        expect(h["X-API-Key"]).toBe("NEW");
    });
});
