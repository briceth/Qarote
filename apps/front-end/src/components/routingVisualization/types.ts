/**
 * TypeScript interfaces for routing visualization
 */

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type ExchangeType = "direct" | "topic" | "headers" | "fanout";

export interface ExchangeNode {
  id: string;
  name: string;
  type: ExchangeType;
  position: Position;
  size: Size;
  isActive: boolean;
  messageCount: number;
  routingKeys: string[];
  bindings: Binding[];
}

export interface QueueNode {
  id: string;
  name: string;
  position: Position;
  size: Size;
  isActive: boolean;
  messageCount: number;
  consumerCount: number;
  messagesReady: number;
  messagesUnacknowledged: number;
}

export interface Binding {
  id: string;
  exchangeId: string;
  queueId: string;
  routingKey: string;
  arguments?: Record<string, string | number | boolean>;
  isActive: boolean;
}

export interface MessageFlow {
  id: string;
  exchangeId: string;
  queueId: string;
  routingKey: string;
  message: {
    body: string;
    headers: Record<string, string | number | boolean>;
    properties: Record<string, string | number | boolean>;
  };
  timestamp: number;
  status: "routing" | "delivered" | "failed";
  progress: number; // 0-1
  path: Position[];
}

export interface RoutingPattern {
  id: string;
  name: string;
  description: string;
  exchangeType: ExchangeType;
  routingKey: string;
  pattern: string;
  examples: string[];
}

export interface VisualizationSettings {
  showMessageFlow: boolean;
  showBindings: boolean;
  showInactiveNodes: boolean;
  animationSpeed: number;
  autoLayout: boolean;
  theme: "light" | "dark";
  nodeSpacing: number;
  showStatistics: boolean;
}

export interface RoutingMetrics {
  totalMessages: number;
  messagesPerSecond: number;
  routingSuccessRate: number;
  averageRoutingTime: number;
  exchangeMetrics: ExchangeMetrics[];
  queueMetrics: QueueMetrics[];
}

export interface ExchangeMetrics {
  exchangeId: string;
  messagesIn: number;
  messagesOut: number;
  routingFailures: number;
  averageRoutingTime: number;
}

export interface QueueMetrics {
  queueId: string;
  messagesDelivered: number;
  messagesAcknowledged: number;
  messagesRejected: number;
  averageDeliveryTime: number;
}

export interface RoutingTopology {
  exchanges: ExchangeNode[];
  queues: QueueNode[];
  bindings: Binding[];
  messageFlows: MessageFlow[];
  metrics: RoutingMetrics;
}

export interface SimulationConfig {
  isEnabled: boolean;
  messageRate: number;
  routingPatterns: RoutingPattern[];
  duration: number;
  autoGenerate: boolean;
}

export interface VisualizationEvent {
  type: "nodeClick" | "bindingClick" | "messageClick" | "backgroundClick";
  data: ExchangeNode | QueueNode | Binding | MessageFlow | null;
  timestamp: number;
}

export interface LayoutConfig {
  type: "hierarchical" | "force" | "circular" | "manual";
  direction: "horizontal" | "vertical";
  spacing: {
    node: number;
    level: number;
  };
  animation: {
    enabled: boolean;
    duration: number;
    easing: string;
  };
}

export interface FilterOptions {
  exchangeTypes: ExchangeType[];
  showEmptyQueues: boolean;
  showUnboundExchanges: boolean;
  routingKeyPattern: string;
  messageCountThreshold: number;
}

export interface ExportOptions {
  format: "png" | "svg" | "pdf";
  includeMetrics: boolean;
  includeTimestamp: boolean;
  resolution: "low" | "medium" | "high";
}
