import { Kafka, logLevel } from 'kafkajs';
import { config } from '../config';

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers,
  logLevel: logLevel.ERROR,
});

export const consumer = kafka.consumer({ groupId: config.kafka.groupId });
