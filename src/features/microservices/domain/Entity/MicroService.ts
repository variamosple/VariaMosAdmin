export type HealthStatus = "UP" | "DEGRADED" | "DOWN";

export interface Labels {
  [label: string]: string;
}

export interface ContainerInstanceInfo {
  id: string;
  name: string;
  state: string;
  status: string;
  created: Date;
  labels: Labels;
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonPrimitive[]
  | Record<string, JsonPrimitive>;

export interface HealthCheckDetail {
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
  details?: Record<string, JsonValue>;
}

export interface MicroServiceHealthInfo {
  status: HealthStatus;
  serviceName: string;
  version?: string;
  uptimeSeconds?: number;
  responseTimeMs: number;
  checkedAt: string;
  checks?: Record<string, HealthCheckDetail>;
}

export interface UptimeHistorySlot {
  timestamp: string;
  status: HealthStatus;
  responseTimeMs: number;
  uptimePercentage: number;
}

export interface MicroServiceUptimeSummary {
  serviceName: string;
  currentStatus: HealthStatus;
  uptime24hPercentage: number;
  uptime30dPercentage: number;
  averageResponseTimeMs: number;
  history: UptimeHistorySlot[];
}

export interface MicroServiceConfigItem {
  id?: number;
  serviceName: string;
  key: string;
  value: string;
  type: "string" | "number" | "boolean" | "json";
  isSecret: boolean;
  isReadOnly: boolean;
  description?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MicroServiceAuditEntry {
  id?: number;
  serviceName: string;
  actionType: string;
  details: Record<string, JsonValue>;
  performedBy: string;
  createdAt: string;
}

export interface MicroService {
  serviceName: string;
  displayName: string;
  health: MicroServiceHealthInfo;
  replicasCount: number;
  containers: ContainerInstanceInfo[];
  uptimeSummary?: MicroServiceUptimeSummary;
  targetUrl?: string;
  version?: string;
  // Backward compatibility fields
  id?: string;
  names?: string[];
  created?: Date;
  labels?: Labels;
  state?: string;
  status?: string;
}
