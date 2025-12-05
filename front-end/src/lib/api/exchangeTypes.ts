/**
 * RabbitMQ Exchange and Binding Types
 * Contains interfaces for exchanges, bindings, and consumers
 */

export interface Exchange {
  name: string;
  vhost: string;
  type: string;
  durable: boolean;
  auto_delete: boolean;
  internal: boolean;
  arguments: { [key: string]: unknown };
  policy?: string | null;
  user_who_performed_action?: string;
  message_stats?: {
    publish_in?: number;
    publish_out?: number;
  };
  bindingCount: number;
  bindings: Binding[];
}

export interface Binding {
  source: string;
  vhost: string;
  destination: string;
  destination_type: string;
  routing_key: string;
  arguments: { [key: string]: unknown };
  properties_key: string;
}

export interface Consumer {
  consumer_tag: string;
  channel_details: {
    name: string;
    number: number;
    connection_name: string;
    peer_host: string;
    peer_port: number;
  };
  queue: {
    name: string;
    vhost: string;
  };
  ack_required: boolean;
  exclusive: boolean;
  prefetch_count: number;
  arguments: { [key: string]: unknown };
}
