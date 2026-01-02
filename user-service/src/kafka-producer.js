const { Kafka } = require('kafkajs');

class KafkaProducer {
  constructor() {
    const kafkaBroker = process.env.KAFKA_BOOTSTRAP_SERVERS || 'kafka:9093';
    const clientId = process.env.KAFKA_CLIENT_ID || 'user-service';
    this.eventSource = process.env.KAFKA_EVENT_SOURCE || 'user-service-legacy';
    
    this.kafka = new Kafka({
      clientId: clientId,
      brokers: [kafkaBroker],
    });
    
    this.producer = this.kafka.producer();
    this.topic = process.env.KAFKA_USER_EVENTS_TOPIC || 'user-events';
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      return;
    }
    
    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log('Kafka producer connected');
    } catch (error) {
      console.error('Failed to connect Kafka producer:', error);
      throw error;
    }
  }

  async disconnect() {
    if (!this.isConnected) {
      return;
    }
    
    try {
      await this.producer.disconnect();
      this.isConnected = false;
      console.log('Kafka producer disconnected');
    } catch (error) {
      console.error('Failed to disconnect Kafka producer:', error);
    }
  }

  async publishEvent(eventType, userId, payload) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const event = {
        eventType,
        userId,
        payload,
        timestamp: new Date().toISOString(),
        source: this.eventSource
      };

      const message = {
        topic: this.topic,
        messages: [{
          key: userId,
          value: JSON.stringify(event)
        }]
      };

      await this.producer.send(message);
      console.log(`Published user event: ${eventType} for user ${userId}`);
    } catch (error) {
      console.error(`Failed to publish user event: ${error.message}`, error);
      throw error;
    }
  }
}

// Create singleton instance
const kafkaProducer = new KafkaProducer();

// Connect on module load
kafkaProducer.connect().catch(err => {
  console.error('Initial Kafka connection failed:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await kafkaProducer.disconnect();
});

process.on('SIGINT', async () => {
  await kafkaProducer.disconnect();
  process.exit(0);
});

module.exports = kafkaProducer;

