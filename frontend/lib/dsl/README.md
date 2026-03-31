
# Privacy-First Conversion DSL (v0.1)

## 1. Core Objective
A restricted, declarative DSL that describes *what* a conversion does, not *how*. It enables safe, local execution of file conversions using WASM with chunked streaming, falling back to server-side only when absolutely necessary and authorized.

## 2. Design Principles
- **Declarative**: No loops, conditionals, or arbitrary code.
- **Resource Bounded**: Memory and execution time are strictly limited.
- **Privacy First**: No network access, no filesystem access (other than streams provided).
- **Environment Agnostic**: The same plan works in Browser (WASM), Native Desktop, and Server.

## 3. DSL Structure
A Conversion Plan is a JSON object with four main sections:

1.  **Inputs**: Declaration of required input streams.
2.  **Outputs**: Declaration of produced output streams.
3.  **Steps**: Ordered list of operations to perform.
4.  **Limits**: Hard constraints on resource usage.

### Example: Image Resize
```json
{
  "version": "0.1",
  "limits": {
    "maxMemoryBytes": 209715200,
    "maxExecutionTimeMs": 30000
  },
  "inputs": [ { "id": "src", "type": "IMAGE" } ],
  "outputs": [ { "id": "dst", "type": "IMAGE" } ],
  "steps": [
    {
      "id": "s1",
      "opName": "image_resize",
      "inputs": ["src"],
      "outputs": ["dst"],
      "params": { "width": 800 }
    }
  ]
}
```

## 4. Execution Model
1.  **Static Analysis**: The plan is parsed and validated against the `OperationRegistry`. Memory usage is estimated.
2.  **Capability Routing**: The system checks the browser's capabilities (memory, WASM support).
3.  **Route Decision**:
    - `WASM_DIRECT`: Fits in memory, executed locally.
    - `WASM_CHUNKED`: Large file, executed locally via streaming.
    - `NATIVE_REQUIRED`: Requires native app (fallback).
    - `SERVER_REQUIRED`: Requires cloud processing (user consent needed).

## 5. Security & Privacy
- **No Network**: The execution environment (WASM sandbox) has no network fetching capabilities.
- **Memory Safety**: Operations are killable if they exceed memory limits.
- **Transparency**: The user is told exactly where the conversion happens (Local vs Cloud).
