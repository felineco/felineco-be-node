// test/utils/database-setup.ts
import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Connection, ConnectionStates } from 'mongoose';

let mongoServer: MongoMemoryServer;

export const setupTestDatabase = async (): Promise<void> => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URL = mongoUri;
    console.log('Test MongoDB connected at:', mongoUri);
  } catch (error) {
    console.error('Failed to start test MongoDB:', error);
    throw error;
  }
};

export const teardownTestDatabase = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== ConnectionStates.disconnected) {
      await mongoose.disconnect();
    }
    if (mongoServer !== null && mongoServer !== undefined) {
      await mongoServer.stop();
    }
    console.log('Test MongoDB disconnected');
  } catch (error) {
    console.error('Failed to cleanup test MongoDB:', error);
  }
};

export const clearTestDatabase = async (
  app: INestApplication,
): Promise<void> => {
  try {
    const connection = app.get<Connection>(getConnectionToken());

    if (connection.readyState !== ConnectionStates.disconnected) {
      const collections = connection.collections;
      const deletePromises = Object.values(collections).map((collection) =>
        collection.deleteMany({}),
      );
      await Promise.all(deletePromises);
    }
  } catch (error) {
    console.error('Failed to clear collections:', error);
  }
};

export const getTestDatabaseUri = (): string => {
  return mongoServer?.getUri() || '';
};
