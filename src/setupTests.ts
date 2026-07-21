import { TextEncoder, TextDecoder } from "util";
import { TransformStream, ReadableStream, WritableStream } from "stream/web";

import "@testing-library/jest-dom";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;
global.TransformStream = TransformStream as any;
global.ReadableStream = ReadableStream as any;
global.WritableStream = WritableStream as any;

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
global.BroadcastChannel = DummyBroadcastChannel as any;

// Use dummy class for MessagePort to prevent open handles while satisfying undici
class DummyMessagePort {
  addEventListener() {}
  removeEventListener() {}
  postMessage() {}
  start() {}
  close() {}
}
global.MessagePort = DummyMessagePort as any;

const { fetch, Headers, Request, Response } = require("undici");

global.fetch = fetch;
global.Headers = Headers as any;
global.Request = Request as any;
global.Response = Response as any;

// Require server dynamically to prevent ES module import hoisting
const { server } = require("./shared/tests/mocks/server");

class MockIntersectionObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
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
