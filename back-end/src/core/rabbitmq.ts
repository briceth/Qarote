interface RabbitMQCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  vhost: string;
}

class RabbitMQClient {
  private baseUrl: string;
  private authHeader: string;
  private vhost: string;

  constructor(credentials: RabbitMQCredentials) {
    this.baseUrl = `http://${credentials.host}:${credentials.port}/api`;
    this.authHeader = `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`;
    this.vhost = encodeURIComponent(credentials.vhost);
  }

  private async request(endpoint: string) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`RabbitMQ API error: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error(`Error fetching from RabbitMQ API (${endpoint}):`, error);
      throw error;
    }
  }

  async getOverview() {
    return this.request('/overview');
  }

  async getQueues() {
    return this.request(`/queues/${this.vhost}`);
  }

  async getNodes() {
    return this.request('/nodes');
  }

  async getQueue(queueName: string) {
    const encodedQueueName = encodeURIComponent(queueName);
    return this.request(`/queues/${this.vhost}/${encodedQueueName}`);
  }
}

export default RabbitMQClient;