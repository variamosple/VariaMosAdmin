import { TextEncoder, TextDecoder } from "util";
import { TransformStream, ReadableStream, WritableStream } from "stream/web";

import "@testing-library/jest-dom";

import { vi } from "vitest";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
global.TransformStream = TransformStream as unknown as typeof global.TransformStream;
global.ReadableStream = ReadableStream as unknown as typeof global.ReadableStream;
global.WritableStream = WritableStream as unknown as typeof global.WritableStream;

// Use dummy class for BroadcastChannel to prevent open handles while satisfying MSW ws.ts
class DummyBroadcastChannel {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  addEventListener() {}
  removeEventListener() {}
  postMessage() {}
  close() {}
  unref() {}
}
global.BroadcastChannel = DummyBroadcastChannel as unknown as typeof global.BroadcastChannel;

// Use dummy class for MessagePort to prevent open handles while satisfying undici
class DummyMessagePort {
  addEventListener() {}
  removeEventListener() {}
  postMessage() {}
  start() {}
  close() {}
}
global.MessagePort = DummyMessagePort as unknown as typeof global.MessagePort;

const { fetch, Headers, Request, Response } = require("undici");

global.fetch = fetch;
global.Headers = Headers as unknown as typeof global.Headers;
global.Request = Request as unknown as typeof global.Request;
global.Response = Response as unknown as typeof global.Response;

// Require server dynamically to prevent ES module import hoisting
const { server } = require("./shared/tests/mocks/server");

class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

const { getGlobalDispatcher } = require("undici");

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(async () => {
  server.close();
  const dispatcher = getGlobalDispatcher();
  if (dispatcher && typeof dispatcher.destroy === "function") {
    await dispatcher.destroy();
  }
});
