const { Kafka } = require('kafkajs');
const { readUsers, writeUsers } = require('./data.js');

class KafkaConsumer {
  constructor() {
    const kafkaBroker = process.env.KAFKA_BOOTSTRAP_SERVERS || 'kafka:9093';
    const clientId = process.env.KAFKA_CLIENT_ID || 'user-service-consumer';
    const groupId = process.env.KAFKA_CONSUMER_GROUP_ID || 'user-service-legacy-group';
    this.eventSource = process.env.KAFKA_EVENT_SOURCE || 'user-service-legacy';
    
    this.kafka = new Kafka({
      clientId: clientId,
      brokers: [kafkaBroker],
    });
    
    this.consumer = this.kafka.consumer({ 
      groupId: groupId
    });
    this.topic = process.env.KAFKA_USER_EVENTS_TOPIC || 'user-events';
    this.isRunning = false;
  }

  async connect() {
    if (this.isRunning) {
      return;
    }
    
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: this.topic, fromBeginning: false });
      this.isRunning = true;
      console.log('Kafka consumer connected and subscribed');
      
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const event = JSON.parse(message.value.toString());
            await this.handleEvent(event);
          } catch (error) {
            console.error('Error processing message:', error);
          }
        },
      });
    } catch (error) {
      console.error('Failed to connect Kafka consumer:', error);
      throw error;
    }
  }

  async handleEvent(event) {
    // Skip events published by this service
    if (event.source === this.eventSource) {
      console.log(`Skipping event from own service: ${event.eventType} for user ${event.userId}`);
      return;
    }

    console.log(`Received user event: ${event.eventType} for user ${event.userId} from source: ${event.source}`);
    
    const users = await readUsers();
    
    if (event.eventType === 'USER_CREATED') {
      const payload = event.payload;
      // Check if user already exists (idempotency check)
      if (users[payload.id]) {
        console.log(`User ${payload.id} already exists, skipping creation`);
        return;
      }
      
      users[payload.id] = {
        id: payload.id,
        email: payload.email,
        username: payload.username,
        role: payload.role,
        password: payload.password || '' // Password might not be in event for security
      };
      await writeUsers(users);
      console.log(`User created in legacy service: ${payload.id}`);
    } else if (event.eventType === 'USER_UPDATED') {
      const userId = event.userId;
      // Only update if user exists
      if (!users[userId]) {
        console.log(`User ${userId} not found, skipping update`);
        return;
      }
      
      // Check if update is actually needed (optional optimization)
      const hasChanges = Object.keys(event.payload).some(
        key => users[userId][key] !== event.payload[key]
      );
      
      if (!hasChanges) {
        console.log(`No changes detected for user ${userId}, skipping update`);
        return;
      }
      
      Object.assign(users[userId], event.payload);
      await writeUsers(users);
      console.log(`User updated in legacy service: ${userId}`);
    }
  }

  async disconnect() {
    if (!this.isRunning) {
      return;
    }
    
    try {
      await this.consumer.disconnect();
      this.isRunning = false;
      console.log('Kafka consumer disconnected');
    } catch (error) {
      console.error('Failed to disconnect Kafka consumer:', error);
    }
  }
}

// Create singleton instance
const kafkaConsumer = new KafkaConsumer();

module.exports = kafkaConsumer;

