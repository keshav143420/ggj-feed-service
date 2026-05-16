import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import feedRoutes from './routes/feed.routes';
import { config } from './config';
import { startConsumer } from './kafka/consumer';
import { consumer } from './kafka/client';
import redisClient from './redis/client';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/v1/feed', feedRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

let server: any;

const startServer = async () => {
  try {
    // Start Kafka consumer
    await startConsumer();

    server = app.listen(config.port, () => {
      console.log(`Feed Service listening on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async () => {
  console.log('Received shutdown signal. Shutting down gracefully...');
  
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
    });
  }

  try {
    await consumer.disconnect();
    console.log('Kafka consumer disconnected');
  } catch (error) {
    console.error('Error disconnecting Kafka consumer:', error);
  }

  try {
    await redisClient.quit();
    console.log('Redis client disconnected');
  } catch (error) {
    console.error('Error disconnecting Redis client:', error);
  }

  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();
