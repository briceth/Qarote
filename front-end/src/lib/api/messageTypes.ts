/**
 * RabbitMQ Message Types
 * Contains interfaces for message handling, publishing, and browsing
 */

export interface RabbitMQMessage {
  payload: string;
  payload_bytes: number;
  payload_encoding: string;
  properties: {
    delivery_mode?: number;
    headers?: Record<string, unknown>;
    correlation_id?: string;
    reply_to?: string;
    expiration?: string;
    message_id?: string;
    timestamp?: number;
    type?: string;
    user_id?: string;
    app_id?: string;
    content_type?: string;
    content_encoding?: string;
  };
  routing_key: string;
  redelivered: boolean;
  exchange: string;
  message_count: number;
}

export interface BrowseMessagesResponse {
  messages: RabbitMQMessage[];
  count: number;
  queueName: string;
}

export interface PublishMessageRequest {
  serverId: string;
  exchange: string;
  routingKey: string;
  payload: string;
  properties: {
    delivery_mode?: number;
    priority?: number;
    expiration?: string;
    user_id?: string;
    app_id?: string;
    content_type?: string;
    content_encoding?: string;
    correlation_id?: string;
    reply_to?: string;
    message_id?: string;
    timestamp?: number;
    type?: string;
    headers?: Record<string, unknown>;
  };
}

export interface PublishMessageResponse {
  success: boolean;
  message: string;
  routed: boolean;
  exchange: string;
  routingKey: string;
  payloadSize: number;
}

export interface CreateQueueRequest {
  serverId: string;
  name: string;
  durable: boolean;
  autoDelete: boolean;
  exclusive: boolean;
  arguments: Record<string, unknown>;
  bindToExchange?: string;
  routingKey: string;
}

export interface CreateQueueResponse {
  success: boolean;
  message: string;
  queue: import("./types").Queue;
  bound: boolean;
  exchange?: string;
  routingKey?: string;
}
