import { describe, expect, it } from "vitest";
import type { ContainerResources, MicroService } from "./Entity/MicroService";
import { formatBytes, serviceResourcesOf } from "./serviceResources";

const MB = 1024 * 1024;

const resources = (
  cpuPercent: number | null,
  memoryUsedBytes: number,
  memoryLimitBytes = 4096 * MB,
): ContainerResources => ({
  cpuPercent,
  memoryUsedBytes,
  memoryLimitBytes,
  sampledAt: "2026-11-14T10:00:00.000Z",
});

const service = (
  ...sampled: (ContainerResources | undefined)[]
): MicroService => ({
  serviceName: "variamos_ms_languages",
  displayName: "Languages",
  health: { status: "UP", serviceName: "variamos_ms_languages" },
  replicasCount: sampled.length,
  containers: sampled.map((r, i) => ({
    id: `c${i}`,
    name: `languages_${i}`,
    state: r ? "running" : "exited",
    status: r ? "Up 1 hour" : "Exited (0)",
    created: new Date("2026-11-14T09:00:00Z"),
    labels: {},
    resources: r,
  })),
});

describe("serviceResourcesOf", () => {
  it("gives the CPU, the memory and the limit of a single container", () => {
    expect(serviceResourcesOf(service(resources(2.5, 150 * MB)))).toEqual({
      cpuPercent: 2.5,
      memoryUsedBytes: 150 * MB,
      memoryLimitBytes: 4096 * MB,
    });
  });

  it("adds up several containers, without a shared limit", () => {
    expect(
      serviceResourcesOf(
        service(resources(1.25, 100 * MB), resources(2.5, 50 * MB), undefined),
      ),
    ).toEqual({
      cpuPercent: 3.8,
      memoryUsedBytes: 150 * MB,
      memoryLimitBytes: null,
    });
  });

  it("has no CPU before the second sample", () => {
    expect(
      serviceResourcesOf(service(resources(null, 100 * MB)))?.cpuPercent,
    ).toBeNull();
  });

  it("gives nothing for a service without a sampled container", () => {
    expect(serviceResourcesOf(service(undefined))).toBeNull();
    expect(serviceResourcesOf(service())).toBeNull();
  });
});

describe("formatBytes", () => {
  it("writes megabytes, then gigabytes", () => {
    expect(formatBytes(152 * MB)).toBe("152 MB");
    expect(formatBytes(1536 * MB)).toBe("1.5 GB");
  });
});
