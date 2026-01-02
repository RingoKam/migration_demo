import json
import os
from datetime import datetime
from kafka import KafkaProducer
from kafka.errors import KafkaError
import logging

logger = logging.getLogger(__name__)


class KafkaProducerService:
    def __init__(self):
        kafka_broker = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka:9093')
        self.topic = os.getenv('KAFKA_LICENSE_EVENTS_TOPIC', 'license-events')
        client_id = os.getenv('KAFKA_CLIENT_ID', 'license-service')
        self.event_source = os.getenv('KAFKA_EVENT_SOURCE', 'license-service-legacy')
        
        try:
            self.producer = KafkaProducer(
                bootstrap_servers=[kafka_broker],
                client_id=client_id,
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8') if k else None
            )
            logger.info(f'Kafka producer initialized with broker: {kafka_broker}')
        except Exception as e:
            logger.error(f'Failed to initialize Kafka producer: {e}')
            self.producer = None

    def publish_event(self, event_type: str, user_id: str, payload: dict):
        """Publish a license event to Kafka"""
        try:
            event = {
                'eventType': event_type,
                'userId': user_id,
                'payload': payload,
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'source': self.event_source
            }

            future = self.producer.send(
                self.topic,
                key=user_id,
                value=event
            )
            
            # Wait for the message to be sent (optional, can be async)
            record_metadata = future.get(timeout=10)
            logger.info(
                f'Published license event: {event_type} for user {user_id} '
                f'to topic {record_metadata.topic} partition {record_metadata.partition}'
            )
        except KafkaError as e:
            logger.error(f'Failed to publish license event: {e}')
            raise
        except Exception as e:
            logger.error(f'Unexpected error publishing license event: {e}')
            raise

    def close(self):
        """Close the Kafka producer"""
        if self.producer:
            try:
                self.producer.close()
                logger.info('Kafka producer closed')
            except Exception as e:
                logger.error(f'Error closing Kafka producer: {e}')


# Create singleton instance
kafka_producer = KafkaProducerService()

