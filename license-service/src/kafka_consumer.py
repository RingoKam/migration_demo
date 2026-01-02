import json
import os
import threading
from kafka import KafkaConsumer
from kafka.errors import KafkaError
import logging
from data import read_licenses, write_licenses

logger = logging.getLogger(__name__)


class KafkaConsumerService:
    def __init__(self):
        kafka_broker = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka:9093')
        self.topic = os.getenv('KAFKA_LICENSE_EVENTS_TOPIC', 'license-events')
        client_id = os.getenv('KAFKA_CLIENT_ID', 'license-service-consumer')
        group_id = os.getenv('KAFKA_CONSUMER_GROUP_ID', 'license-service-legacy-group')
        self.event_source = os.getenv('KAFKA_EVENT_SOURCE', 'license-service-legacy')
        self.consumer = None
        self.is_running = False
        
        try:
            self.consumer = KafkaConsumer(
                self.topic,
                bootstrap_servers=[kafka_broker],
                client_id=client_id,
                group_id=group_id,
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                auto_offset_reset='latest'  # Only consume new messages
            )
            logger.info(f'Kafka consumer initialized for topic: {self.topic}')
        except Exception as e:
            logger.error(f'Failed to initialize Kafka consumer: {e}')
            self.consumer = None

    def start(self):
        """Start consuming messages in a background thread"""
        if not self.consumer or self.is_running:
            return
        
        def consume_loop():
            self.is_running = True
            try:
                for message in self.consumer:
                    try:
                        event = message.value
                        self.handle_event(event)
                    except Exception as e:
                        logger.error(f'Error processing message: {e}')
            except Exception as e:
                logger.error(f'Error in consumer loop: {e}')
            finally:
                self.is_running = False
        
        thread = threading.Thread(target=consume_loop, daemon=True)
        thread.start()
        logger.info('Kafka consumer started in background thread')

    def handle_event(self, event):
        """Handle a license event"""
        # Skip events published by this service
        source = event.get('source', 'unknown')
        if source == self.event_source:
            logger.info(f'Skipping event from own service: {event.get("eventType")} for user {event.get("userId")}')
            return
        
        event_type = event.get('eventType')
        user_id = event.get('userId')
        payload = event.get('payload', {})
        
        logger.info(f'Received license event: {event_type} for user {user_id} from source: {source}')
        
        if event_type == 'LICENSE_UPDATED':
            license_data = read_licenses()
            license_info = license_data.get(user_id, {})
            
            # Check if update is actually needed (idempotency)
            has_changes = False
            for key, value in payload.items():
                if license_info.get(key) != value:
                    has_changes = True
                    break
            
            if not has_changes:
                logger.info(f'No changes detected for user {user_id}, skipping update')
                return
            
            license_info.update(payload)
            license_data[user_id] = license_info
            write_licenses(license_data)
            logger.info(f'License updated in legacy service for user: {user_id}')

    def close(self):
        """Close the Kafka consumer"""
        if self.consumer:
            try:
                self.consumer.close()
                self.is_running = False
                logger.info('Kafka consumer closed')
            except Exception as e:
                logger.error(f'Error closing Kafka consumer: {e}')


# Create singleton instance
kafka_consumer = KafkaConsumerService()

