import {
  ReadableStream,
  TransformStream,
  WritableStream,
} from "node:stream/web";
import { TextDecoder, TextEncoder } from "node:util";

import "@testing-library/jest-dom/vitest";

import { createElement, type ReactNode } from "react";
import { vi } from "vitest";
import { server } from "./shared/tests/mocks/server";

Object.defineProperty(globalThis, "TextEncoder", {
  value: TextEncoder,
  writable: true,
});
Object.defineProperty(globalThis, "TextDecoder", {
  value: TextDecoder,
  writable: true,
});
Object.defineProperty(globalThis, "TransformStream", {
  value: TransformStream,
  writable: true,
});
Object.defineProperty(globalThis, "ReadableStream", {
  value: ReadableStream,
  writable: true,
});
Object.defineProperty(globalThis, "WritableStream", {
  value: WritableStream,
  writable: true,
});

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
Object.defineProperty(globalThis, "BroadcastChannel", {
  value: DummyBroadcastChannel,
  writable: true,
});

// Use dummy class for MessagePort to prevent open handles while satisfying undici
class DummyMessagePort {
  addEventListener() {}
  removeEventListener() {}
  postMessage() {}
  start() {}
  close() {}
}
Object.defineProperty(globalThis, "MessagePort", {
  value: DummyMessagePort,
  writable: true,
});

interface GlobalDispatcher {
  destroy?: () => Promise<void> | void;
}

let getGlobalDispatcher: (() => GlobalDispatcher) | null = null;

try {
  const undici = require("undici");
  Object.defineProperty(globalThis, "fetch", {
    value: undici.fetch,
    writable: true,
  });
  Object.defineProperty(globalThis, "Headers", {
    value: undici.Headers,
    writable: true,
  });
  Object.defineProperty(globalThis, "Request", {
    value: undici.Request,
    writable: true,
  });
  Object.defineProperty(globalThis, "Response", {
    value: undici.Response,
    writable: true,
  });
  getGlobalDispatcher = undici.getGlobalDispatcher;
} catch (e) {
  // Fallback to native fetch if undici fails to load due to node version incompatibilities
  if (typeof globalThis.fetch === "undefined") {
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

// A request with no handler fails the test: it would reach the network
// (TST-FRONT-06). A test that expects one declares it with server.use.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
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

// Global mock for @variamosple/variamos-components to satisfy ResponseModel and PagedModel usages in all unit tests
vi.mock("@variamosple/variamos-components", () => {
  class ResponseModel<T = Record<string, never>> {
    status: string;
    errorCode: number | null = null;
    message: string = "";
    data: T | null = null;
    constructor(status = "success") {
      this.status = status;
      this.errorCode = status === "success" ? 0 : null;
    }
    withData(data: T) {
      this.data = data;
      return this;
    }
    withError(code: number, msg: string) {
      this.errorCode = code;
      this.message = msg;
      return this;
    }
  }
  return {
    withPageVisit: <T>(component: T): T => component,
    NotificationProvider: ({ children }: { children: ReactNode }) => children,
    AuthWrapper: ({ children }: { children: ReactNode }) => children,
    NotAuthorized: () => null,
    ProtectedRoute: ({ children }: { children: ReactNode }) => children,
    PagedModel: class PagedModel {},
    // One button to the next page: enough to drive a paged list in a test
    Paginator: (props: {
      currentPage: number;
      totalPages: number;
      onPageChange: (page: number) => void;
    }) =>
      createElement(
        "button",
        {
          type: "button",
          onClick: () => props.onPageChange(props.currentPage + 1),
        },
        `Page ${props.currentPage} of ${props.totalPages}`,
      ),
    ResponseModel,
    useRouter: vi.fn(),
    useSession: vi.fn(),
  };
});
