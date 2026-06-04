// src/config/db.ts
//
// Mongoose connection manager.
// - Single connection instance (Mongoose handles connection pooling internally)
// - Graceful retry with exponential backoff on initial connect
// - Emits process-level events for monitoring
// - Handles SIGINT / SIGTERM shutdown cleanly

import mongoose from 'mongoose';
import env from './env';
import logger from '../utils/logger';

// ---------------------------------------------------------------------------
// Connection options
// ---------------------------------------------------------------------------
const MONGOOSE_OPTIONS: mongoose.ConnectOptions = {
  // How long the driver waits before failing a connection attempt
  serverSelectionTimeoutMS: 10_000,
  // How long to wait for a socket operation (read/write)
  socketTimeoutMS: 45_000,
  // Mongoose 6+ default — keep for explicitness
  maxPoolSize: 10,
  minPoolSize: 2,
};

// ---------------------------------------------------------------------------
// Retry config
// ---------------------------------------------------------------------------
const MAX_RETRIES   = 5;
const BASE_DELAY_MS = 2_000; // doubles each attempt (2s, 4s, 8s, 16s, 32s)

// ---------------------------------------------------------------------------
// Connection state tracking
// ---------------------------------------------------------------------------
let retryCount = 0;
let isConnected = false;

// ---------------------------------------------------------------------------
// Event listeners — wired once, survive reconnects
// ---------------------------------------------------------------------------
function attachMongooseEvents(): void {
  const conn = mongoose.connection;

  conn.on('connected', () => {
    isConnected = true;
    retryCount  = 0;
    logger.info('[db] MongoDB connected', {
      host: conn.host,
      port: conn.port,
      name: conn.name,
    });
  });

  conn.on('disconnected', () => {
    isConnected = false;
    logger.warn('[db] MongoDB disconnected');
  });

  conn.on('reconnected', () => {
    isConnected = true;
    logger.info('[db] MongoDB reconnected');
  });

  conn.on('error', (err: Error) => {
    logger.error('[db] MongoDB connection error', { message: err.message });
    // Don't re-throw — let Mongoose manage the connection state
  });

  conn.on('close', () => {
    isConnected = false;
    logger.info('[db] MongoDB connection closed');
  });
}

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
async function closeConnection(): Promise<void> {
  if (!isConnected) return;
  try {
    await mongoose.connection.close();
    logger.info('[db] MongoDB connection closed gracefully');
  } catch (err) {
    logger.error('[db] Error closing MongoDB connection', { err });
  }
}

function registerShutdownHooks(): void {
  const shutdown = async (signal: string) => {
    logger.info(`[db] Received ${signal}, closing MongoDB connection...`);
    await closeConnection();
    process.exit(0);
  };

  process.once('SIGINT',  () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}

// ---------------------------------------------------------------------------
// Connect with exponential backoff
// ---------------------------------------------------------------------------
async function connectWithRetry(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, MONGOOSE_OPTIONS);
    // 'connected' event fires above — success logging handled there
  } catch (err) {
    retryCount += 1;

    if (retryCount > MAX_RETRIES) {
      logger.error('[db] Max connection retries reached. Exiting.', { err });
      process.exit(1);
    }

    const delayMs = BASE_DELAY_MS * Math.pow(2, retryCount - 1);
    logger.warn(
      `[db] Connection attempt ${retryCount}/${MAX_RETRIES} failed. ` +
      `Retrying in ${delayMs / 1000}s...`,
      { err }
    );

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return connectWithRetry();
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function connectDB(): Promise<void> {
  if (isConnected) {
    logger.debug('[db] Already connected, skipping');
    return;
  }

  attachMongooseEvents(); // attach once before first connect attempt
  registerShutdownHooks();

  logger.info('[db] Connecting to MongoDB...');
  await connectWithRetry();
}

export async function disconnectDB(): Promise<void> {
  await closeConnection();
}

export function getConnectionState(): {
  isConnected: boolean;
  readyState: number;
  host: string | undefined;
  name: string | undefined;
} {
  const conn = mongoose.connection;
  return {
    isConnected,
    readyState: conn.readyState,
    host: conn.host,
    name: conn.name,
  };
}