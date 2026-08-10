import {
  ReadableStream,
  TransformStream,
  WritableStream,
} from "node:stream/web";
import { TextDecoder, TextEncoder } from "node:util";

import "@testing-library/jest-dom";

import { vi } from "vitest";
import { server } from "./shared/tests/mocks/server";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
global.TransformStream =
  TransformStream as unknown as typeof global.TransformStream;
global.ReadableStream =
  ReadableStream as unknown as typeof global.ReadableStream;
global.WritableStream =
  WritableStream as unknown as typeof global.WritableStream;

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
global.BroadcastChannel =
  DummyBroadcastChannel as unknown as typeof global.BroadcastChannel;

// Use dummy class for MessagePort to prevent open handles while satisfying undici
class DummyMessagePort {
  addEventListener() {}
  removeEventListener() {}
  postMessage() {}
  start() {}
  close() {}
}
global.MessagePort = DummyMessagePort as unknown as typeof global.MessagePort;

let getGlobalDispatcher: any = null;

try {
  const undici = require("undici");
  global.fetch = undici.fetch;
  global.Headers = undici.Headers as unknown as typeof global.Headers;
  global.Request = undici.Request as unknown as typeof global.Request;
  global.Response = undici.Response as unknown as typeof global.Response;
  getGlobalDispatcher = undici.getGlobalDispatcher;
} catch (e) {
  // Fallback to native fetch if undici fails to load due to node version incompatibilities
  if (typeof global.fetch === "undefined") {
    throw e;
  }
}

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

// Polyfill window.getComputedStyle to return default transition values in JSDOM,
// preventing NaN timeout warnings in third-party transition helpers (like react-bootstrap)
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = function (elt, ...args) {
  const style = originalGetComputedStyle.call(this, elt, ...args);
  if (style) {
    if (!style.transitionDuration) {
      style.transitionDuration = "0s";
    }
    if (!style.transitionDelay) {
      style.transitionDelay = "0s";
    }
  }
  return style;
};

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(async () => {
  server.close();
  if (getGlobalDispatcher) {
    const dispatcher = getGlobalDispatcher();
    if (dispatcher && typeof dispatcher.destroy === "function") {
      await dispatcher.destroy();
    }
  }
});
