import { createClient } from 'redis';

class RedisService {
  constructor() {
    this.client = null;
    this.publisher = null;
    this.subscriber = null;
  }

  async connect() {
    try {
      // Create Redis clients
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
        }
      });

      this.publisher = this.client.duplicate();
      this.subscriber = this.client.duplicate();

      // Connect all clients
      await Promise.all([
        this.client.connect(),
        this.publisher.connect(),
        this.subscriber.connect()
      ]);

      console.log('✅ Redis connected successfully');

      // Handle connection events
      this.client.on('error', (err) => console.error('Redis Client Error:', err));
      this.publisher.on('error', (err) => console.error('Redis Publisher Error:', err));
      this.subscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));

      this.client.on('connect', () => console.log('📡 Redis client connected'));
      this.client.on('ready', () => console.log('🚀 Redis client ready'));

    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await Promise.all([
        this.client?.quit(),
        this.publisher?.quit(),
        this.subscriber?.quit()
      ]);
      console.log('🔌 Redis disconnected');
    } catch (error) {
      console.error('Error disconnecting Redis:', error);
    }
  }

  // Publish message to a channel
  async publish(channel, message) {
    try {
      const messageStr = JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });

      await this.publisher.publish(channel, messageStr);
      console.log(`📤 Published to ${channel}:`, message.type || 'message');
    } catch (error) {
      console.error(`❌ Failed to publish to ${channel}:`, error);
      throw error;
    }
  }

  // Subscribe to a channel
  async subscribe(channel, callback) {
    try {
      await this.subscriber.subscribe(channel, (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          callback(parsedMessage);
        } catch (error) {
          console.error('Error parsing message:', error);
          callback({ error: 'Invalid message format', raw: message });
        }
      });
      console.log(`📥 Subscribed to ${channel}`);
    } catch (error) {
      console.error(`❌ Failed to subscribe to ${channel}:`, error);
      throw error;
    }
  }

  // Add to queue (for job processing)
  async addToQueue(queueName, job) {
    try {
      const jobData = JSON.stringify({
        ...job,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });

      await this.client.lPush(queueName, jobData);
      console.log(`📋 Added job to ${queueName}:`, job.type || 'job');
    } catch (error) {
      console.error(`❌ Failed to add job to ${queueName}:`, error);
      throw error;
    }
  }

  // Process queue (for job consumers)
  async processQueue(queueName, callback) {
    console.log(`🔄 Started processing queue: ${queueName}`);
    
    while (true) {
      try {
        // Block for 10 seconds waiting for jobs
        const result = await this.client.brPop(queueName, 10);
        
        if (result) {
          const job = JSON.parse(result.element);
          console.log(`⚡ Processing job ${job.id} from ${queueName}`);
          
          try {
            await callback(job);
            console.log(`✅ Job ${job.id} completed successfully`);
          } catch (jobError) {
            console.error(`❌ Job ${job.id} failed:`, jobError);
            // Add to dead letter queue or retry mechanism
            await this.addToQueue(`${queueName}:failed`, {
              ...job,
              error: jobError.message,
              failedAt: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error(`❌ Error processing queue ${queueName}:`, error);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  // Get queue stats
  async getQueueStats(queueName) {
    try {
      const length = await this.client.lLen(queueName);
      const failedLength = await this.client.lLen(`${queueName}:failed`);
      
      return {
        pending: length,
        failed: failedLength,
        total: length + failedLength
      };
    } catch (error) {
      console.error(`❌ Failed to get stats for ${queueName}:`, error);
      return { pending: 0, failed: 0, total: 0 };
    }
  }

  // Health check
  async healthCheck() {
    try {
      await this.client.ping();
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }
}

// Create singleton instance
const redisService = new RedisService();

export default redisService;

// Export convenience methods
export const publishMessage = (channel, message) => redisService.publish(channel, message);
export const subscribeToChannel = (channel, callback) => redisService.subscribe(channel, callback);
export const addJob = (queueName, job) => redisService.addToQueue(queueName, job);
export const processJobs = (queueName, callback) => redisService.processQueue(queueName, callback);
