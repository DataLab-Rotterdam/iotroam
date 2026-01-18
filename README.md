# IoTroam Client (Node.js + TypeScript)

[![npm version](https://img.shields.io/npm/v/iotroam?logo=npm)](https://www.npmjs.com/package/iotroam)
[![License](https://img.shields.io/npm/l/iotroam)](https://github.com/DataLab-Rotterdam/iotroam/blob/main/LICENSE)
[![TypeDoc](https://img.shields.io/badge/docs-typedoc-blue)](https://datalab-rotterdam.github.io/iotroam/)

A **TypeScript-first, dependency-free client** for the **SURF IoTroam REST API**.

This package provides a **fully typed API client** for managing **device groups, devices, and profiles** in IoTroam.
All endpoints, parameters, and responses are statically typed, enabling **compile-time safety** and excellent IDE
autocompletion.

The client is built directly on the native `fetch()` API and is suitable for Node.js, Bun, Deno, and modern browsers.

---

## Features

### ✅ Strong typing

- Fully typed request paths, methods, parameters, and return values
- Compile-time validation of:
  - required path parameters
  - request bodies
  - query parameters
- No runtime schema validation overhead

### 🔌 Zero dependencies

- Uses native `fetch`
- Optional `fetchImpl` override for:
  - Node < 18
  - testing
  - custom HTTP stacks

### 🔐 API key handling

- Global API key configured once
- Per-request override via `$headers`

### 🧰 Unified request builder

- Automatic:
  - `{id}` path parameter replacement
  - query string encoding
  - JSON body serialization
  - response parsing
- Full escape hatch via `RequestInit`

---

## Installation

```bash
npm install iotroam
````

TypeScript typings (`.d.ts`) are included.

---

## Quick start

### 1) Create a client

```ts
import { iotroam } from "iotroam";

const api = iotroam({
    apiKey: process.env.IOTROAM_API_KEY!,
});
```

Default base URL:

```
https://iotroam.nl
```

---

### 2) List device groups

```ts
const groups = await iotroam.groups.list({
  limit: 25,
  offset: 0,
});

console.log(groups.items);
console.log("Total:", groups.count);
```

---

### 3) Get group details

```ts
const group = await iotroam.groups.get({ id: 123 });

console.log(group.name);
console.log(group.profile?.vlan);
```

---

### 4) List devices in a group

```ts
const devices = await iotroam.groups.devices(
    { id: 123 },
    { limit: 10 }
);

devices.items.forEach(device => {
    console.log(device.id, device.name, device.mac);
});
```

---

### 5) Create a device

```ts
const device = await iotroam.devices.create({
    name: "sensor-01",
    mac: "AA:BB:CC:DD:EE:FF",
    password: "secret-password",
    owner: {
        type: "group",
        id: 123,
    },
    location: "Lab A",
});
```

---

### 6) Update a device

```ts
const updated = await iotroam.devices.update(
    { id: device.id },
    {
        name: "sensor-01-renamed",
        location: "Lab B",
    }
);
```

---

### 7) Delete a device

```ts
await iotroam.devices.delete({ id: device.id });
```

---

## API structure

### Groups

| Method                           | Description                |
| -------------------------------- | -------------------------- |
| `groups.list(query?)`            | List device groups (paged) |
| `groups.get({ id })`             | Get group details          |
| `groups.devices({ id }, query?)` | List devices in a group    |

---

### Devices

| Method                         | Description        |
| ------------------------------ | ------------------ |
| `devices.create(body)`         | Create a device    |
| `devices.get({ id })`          | Get device details |
| `devices.update({ id }, body)` | Update a device    |
| `devices.delete({ id })`       | Delete a device    |

---

## Parameter conventions

Each request follows a consistent parameter model:

```ts
{
    $path?:   Record<string, string | number>;
    $query?:  Record<string, any>;
    $body?:   unknown;
    $headers?: {
        "X-API-Key"?: string;
    };
}
```

Example with manual headers:

```ts
await iotroam.request(
    "/api/v1/group/list",
    "GET",
    {
        $headers: {
            "X-API-Key": "override-key",
        },
    }
);
```

---

## Generic request access

The low-level request helper is exposed for advanced use cases:

```ts
const result = await iotroam.request(
    "/api/v1/device/{id}/details",
    "GET",
    { $path: { id: 123 } }
);
```

This is useful for:

* experimenting with new endpoints
* building abstractions
* tooling and automation

---

## Error handling

Non-2xx responses throw a standard `Error`:

```ts
try {
    await iotroam.devices.get({ id: 999999 });
} catch (err) {
    console.error(err.message);
}
```

The error message includes:

* HTTP status code
* status text
* response body (when available)

---

## Runtime requirements

* Node.js **18+** (for global `fetch`)
* Or any runtime with a WHATWG-compatible `fetch`
* TypeScript target: **ES2020** or newer

---

## Documentation

* 📘 **TypeDoc**
  [https://datalab-rotterdam.github.io/iotroam/](https://datalab-rotterdam.github.io/iotroam/)

* 📡 **IoTroam API documentation**
  [https://iotroam.nl/api/v1/docs](https://iotroam.nl/api/v1/docs)

---

## License

Apache 2.0
See [LICENSE](./LICENSE)

---

## Maintainer
DataLab Rotterdam

