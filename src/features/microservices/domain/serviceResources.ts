import type { MicroService } from "./Entity/MicroService";

/** What a service uses, all its sampled containers together. */
export interface ServiceResources {
  /** Null until a container has two samples. */
  cpuPercent: number | null;
  memoryUsedBytes: number;
  /** Only for a service with one sampled container: several share the machine. */
  memoryLimitBytes: number | null;
}

/** Null when no container of the service was sampled. */
export function serviceResourcesOf(
  microService: MicroService,
): ServiceResources | null {
  const sampled = (microService.containers ?? [])
    .map((container) => container.resources)
    .filter((resources) => resources !== undefined);
  if (sampled.length === 0) return null;
  const cpus = sampled
    .map((resources) => resources.cpuPercent)
    .filter((cpu) => cpu !== null);
  return {
    cpuPercent:
      cpus.length === 0
        ? null
        : Math.round(cpus.reduce((sum, cpu) => sum + cpu, 0) * 10) / 10,
    memoryUsedBytes: sampled.reduce(
      (sum, resources) => sum + resources.memoryUsedBytes,
      0,
    ),
    memoryLimitBytes:
      sampled.length === 1 ? (sampled[0]?.memoryLimitBytes ?? null) : null,
  };
}

const MB = 1024 * 1024;
const GB = 1024 * MB;

/** "152 MB", "1.5 GB" */
export function formatBytes(bytes: number): string {
  if (bytes >= GB) return `${(bytes / GB).toFixed(1)} GB`;
  return `${Math.round(bytes / MB)} MB`;
}
