import {
  RELOADED_AT_KEY,
  type ReloadTarget,
  reloadOnStaleFiles,
} from "./StaleFilesReload";

describe("reloadOnStaleFiles", () => {
  const reload = vi.fn();
  let target: EventTarget;
  let storage: ReloadTarget["sessionStorage"];
  let clock: number;

  const fakeWindow = (): ReloadTarget =>
    Object.assign(target, {
      sessionStorage: storage,
      location: { reload },
    });

  const fail = () => {
    const event = new Event("vite:preloadError", { cancelable: true });
    target.dispatchEvent(event);
    return event;
  };

  beforeEach(() => {
    reload.mockReset();
    target = new EventTarget();
    window.sessionStorage.clear();
    storage = window.sessionStorage;
    clock = 1_000_000;
    reloadOnStaleFiles(fakeWindow(), () => clock);
  });

  it("reloads once when a page file is missing", () => {
    const event = fail();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    expect(storage.getItem(RELOADED_AT_KEY)).toBe(String(clock));
  });

  it("leaves the error shown when it fails again right after a reload", () => {
    fail();
    clock += 5_000;
    const event = fail();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(false);
  });

  it("reloads again for a later deployment", () => {
    fail();
    clock += 60_000;
    fail();

    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("does not reload when the storage is unavailable", () => {
    target = new EventTarget();
    storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: vi.fn(),
    };
    reloadOnStaleFiles(fakeWindow(), () => clock);

    const event = fail();

    expect(reload).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
});
