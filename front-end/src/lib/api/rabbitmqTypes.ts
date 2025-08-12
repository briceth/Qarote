/**
 * RabbitMQ Node and System Types
 * Contains interfaces related to RabbitMQ nodes, system metrics, and cluster information
 */

import { RateDetail, ExchangeType } from "./types";

interface Node {
  running: boolean;
}

// Permission status for unauthorized operations
export interface PermissionStatus {
  hasPermission: boolean;
  requiredPermission: string;
  message: string;
}

export interface RabbitMQAlert {
  id: string;
  serverId: string;
  serverName: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  details: {
    current: number | string;
    threshold?: number;
    recommended?: string;
    affected?: string[];
  };
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  source: {
    type: "node" | "queue" | "cluster";
    name: string;
  };
}

export interface AlertThresholds {
  memory: {
    warning: number;
    critical: number;
  };
  disk: {
    warning: number;
    critical: number;
  };
  fileDescriptors: {
    warning: number;
    critical: number;
  };
  queueMessages: {
    warning: number;
    critical: number;
  };
  connections: {
    warning: number;
    critical: number;
  };
}

export interface AlertsResponse {
  success: boolean;
  alerts: RabbitMQAlert[];
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
  thresholds: AlertThresholds;
  timestamp: string;
}

export interface AlertsSummaryResponse {
  success: boolean;
  clusterHealth: "healthy" | "warning" | "critical";
  summary: {
    critical: number;
    warning: number;
    total: number;
  };
  issues: string[];
  timestamp: string;
}

export interface NodesResponse {
  nodes: Node[] | null;
  permissionStatus?: PermissionStatus;
}

export interface SampleRetentionPolicies {
  global: number[];
  basic: number[];
  detailed: number[];
}

export interface ChurnRates {
  channel_closed: number;
  channel_closed_details: RateDetail;
  channel_created: number;
  channel_created_details: RateDetail;
  connection_closed: number;
  connection_closed_details: RateDetail;
  connection_created: number;
  connection_created_details: RateDetail;
  queue_created: number;
  queue_created_details: RateDetail;
  queue_declared: number;
  queue_declared_details: RateDetail;
  queue_deleted: number;
  queue_deleted_details: RateDetail;
}

export interface QueueTotals {
  messages: number;
  messages_details: RateDetail;
  messages_ready: number;
  messages_ready_details: RateDetail;
  messages_unacknowledged: number;
  messages_unacknowledged_details: RateDetail;
}

export interface ObjectTotals {
  channels: number;
  connections: number;
  consumers: number;
  exchanges: number;
  queues: number;
}

export interface MessageStats {
  disk_reads: number;
  disk_reads_details: RateDetail;
  disk_writes: number;
  disk_writes_details: RateDetail;
  publish_details?: RateDetail;
  deliver_details?: RateDetail;
  ack_details?: RateDetail;
}

export interface SocketOpts {
  backlog?: number;
  nodelay?: boolean;
  linger?: [boolean, number];
  exit_on_close?: boolean;
  cowboy_opts?: {
    sendfile?: boolean;
  };
  ip?: string;
  port?: number;
  protocol?: string;
}

export interface Listener {
  node: string;
  protocol: string;
  ip_address: string;
  port: number;
  socket_opts: SocketOpts;
}

export interface ContextInfo {
  ssl_opts: unknown[];
  node: string;
  description: string;
  path: string;
  cowboy_opts: string;
  ip?: string;
  port: string;
  protocol?: string;
}

export interface Overview {
  management_version: string;
  rates_mode: string;
  sample_retention_policies: SampleRetentionPolicies;
  exchange_types: ExchangeType[];
  product_version: string;
  product_name: string;
  rabbitmq_version: string;
  cluster_name: string;
  erlang_version: string;
  erlang_full_version: string;
  release_series_support_status: string;
  disable_stats: boolean;
  is_op_policy_updating_enabled: boolean;
  enable_queue_totals: boolean;
  message_stats: MessageStats;
  churn_rates: ChurnRates;
  queue_totals: QueueTotals;
  object_totals: ObjectTotals;
  statistics_db_event_queue: number;
  node: string;
  listeners: Listener[];
  contexts: ContextInfo[];
}

export interface Metrics {
  overview: Overview;
  nodes: Node[];
  connections: Connection[];
  channels: Channel[];
  avgLatency: number;
  diskUsage: number;
  totalMemoryBytes: number;
  totalMemoryGB: number;
  avgCpuUsage: number;
  calculatedAt: string;
}

export interface MetricsResponse {
  metrics: Metrics | null;
  permissionStatus?: PermissionStatus;
}

export interface Connection {
  name: string;
  node: string;
  state: string;
  user: string;
  vhost: string;
  protocol: string;
  channels: number;
  recv_cnt: number;
  send_cnt: number;
  recv_oct: number;
  send_oct: number;
  channelCount: number;
  channelDetails: Channel[];
}

export interface Channel {
  name: string;
  node: string;
  state: string;
  user: string;
  vhost: string;
  number: number;
  connection_details: {
    name: string;
    peer_port: number;
    peer_host: string;
  };
}

export interface TimeSeriesDataPoint {
  time: string;
  messages: number;
  publishRate: number;
  consumeRate: number;
}

export interface TimeSeriesResponse {
  timeseries: TimeSeriesDataPoint[] | null;
  timeRange: string;
  dataPoints: number;
  aggregatedThroughput?: Array<{
    timestamp: number;
    publishRate: number;
    consumeRate: number;
  }> | null;
  metadata?: {
    allowedTimeRanges: string[];
  };
  permissionStatus?: PermissionStatus;
}

export interface LiveRatesResponse {
  serverId: string;
  dataSource: "live_rates" | "permission_denied";
  timestamp: string;
  liveRates: {
    timestamp: number;
    rates: {
      publish: number;
      deliver: number;
      ack: number;
      deliver_get: number;
      confirm: number;
      get: number;
      get_no_ack: number;
      redeliver: number;
      reject: number;
      return_unroutable: number;
      disk_reads: number;
      disk_writes: number;
    };
  };
  aggregatedThroughput: Array<{
    timestamp: number;
    publishRate: number;
    consumeRate: number;
  }>;
  metadata: {
    plan: string | null;
    allowedTimeRanges: string[];
    updateInterval: string;
    dataPoints: number;
  };
  permissionStatus?: PermissionStatus;
}

export interface NodeMemoryDetailsResponse {
  node: NodeMemoryDetails;
  planAccess: NodeMemoryPlanAccess;
}

export interface NodeMemoryDetails {
  name: string;
  running: boolean;
  uptime: number;
  immediate?: NodeMemoryImmediate;
  advanced?: NodeMemoryAdvanced;
  expert?: NodeMemoryExpert;
  trends?: NodeMemoryTrends;
  optimization?: NodeMemoryOptimization;
}

export interface NodeMemoryImmediate {
  totalMemory: number;
  usedMemory: number;
  freeMemory: number;
  memoryUsagePercentage: number;
  memoryAlarm: boolean;
  memoryCalculationStrategy: string;
}

export interface NodeMemoryAdvanced {
  fileDescriptors: {
    used: number;
    total: number;
    usagePercentage: number;
  };
  sockets: {
    used: number;
    total: number;
    usagePercentage: number;
  };
  processes: {
    used: number;
    total: number;
    usagePercentage: number;
  };
  garbageCollection: {
    gcCount: number;
    gcBytesReclaimed: number;
    gcRate: number;
  };
}

export interface NodeMemoryExpert {
  ioMetrics: {
    readCount: number;
    readBytes: number;
    readAvgTime: number;
    writeCount: number;
    writeBytes: number;
    writeAvgTime: number;
    syncCount: number;
    syncAvgTime: number;
  };
  mnesia: {
    ramTransactions: number;
    diskTransactions: number;
  };
  messageStore: {
    readCount: number;
    writeCount: number;
  };
  queueIndex: {
    readCount: number;
    writeCount: number;
  };
  systemMetrics: {
    runQueue: number;
    processors: number;
    contextSwitches: number;
  };
}

export interface NodeMemoryTrends {
  memoryUsageRate: number;
  diskFreeRate: number;
  fdUsageRate: number;
  socketUsageRate: number;
  processUsageRate: number;
}

export interface NodeMemoryOptimization {
  overallHealth: "Good" | "Warning" | "Critical";
  warnings: string[];
  suggestions: string[];
  recommendations: {
    memoryTuning: boolean;
    connectionOptimization: boolean;
    fileDescriptorTuning: boolean;
    processLimitIncrease: boolean;
  };
}

export interface NodeMemoryPlanAccess {
  hasBasic: boolean;
  hasAdvanced: boolean;
  hasExpert: boolean;
  hasTrends: boolean;
  hasOptimization: boolean;
}

// Alert Types
export enum AlertSeverity {
  CRITICAL = "critical",
  WARNING = "warning",
  INFO = "info",
}

export enum AlertCategory {
  MEMORY = "memory",
  DISK = "disk",
  CONNECTION = "connection",
  QUEUE = "queue",
  NODE = "node",
  PERFORMANCE = "performance",
}

export interface RabbitMQAlert {
  id: string;
  serverId: string;
  serverName: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  details: {
    current: number | string;
    threshold?: number;
    recommended?: string;
    affected?: string[];
  };
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  source: {
    type: "node" | "queue" | "cluster";
    name: string;
  };
}

export interface AlertThresholds {
  memory: {
    warning: number;
    critical: number;
  };
  disk: {
    warning: number;
    critical: number;
  };
  fileDescriptors: {
    warning: number;
    critical: number;
  };
  queueMessages: {
    warning: number;
    critical: number;
  };
  connections: {
    warning: number;
    critical: number;
  };
}

export interface AlertsResponse {
  success: boolean;
  alerts: RabbitMQAlert[];
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
  thresholds: AlertThresholds;
  timestamp: string;
}

export interface AlertsSummaryResponse {
  success: boolean;
  clusterHealth: "healthy" | "warning" | "critical";
  summary: {
    critical: number;
    warning: number;
    total: number;
  };
  issues: string[];
  timestamp: string;
}

export interface ThresholdsResponse {
  success: boolean;
  thresholds: AlertThresholds;
  canModify: boolean;
  defaults: AlertThresholds;
}

export interface UpdateThresholdsResponse {
  success: boolean;
  message: string;
  thresholds: AlertThresholds;
}
