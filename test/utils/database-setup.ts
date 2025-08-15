// test/utils/database-setup.ts
import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Connection, ConnectionStates } from 'mongoose';

export class TestDatabase {
  private mongoServer: MongoMemoryServer;

  async setupTestDatabase(): Promise<void> {
    try {
      this.mongoServer = await MongoMemoryServer.create();
      const mongoUri = this.mongoServer.getUri();
      process.env.MONGODB_URL = mongoUri;
      console.log('Test MongoDB connected at:', mongoUri);
    } catch (error) {
      console.error('Failed to start test MongoDB:', error);
    }
  }

  async teardownTestDatabase(): Promise<void> {
    try {
      if (mongoose.connection.readyState !== ConnectionStates.disconnected) {
        await mongoose.disconnect();
      }
      if (this.mongoServer !== null && this.mongoServer !== undefined) {
        await this.mongoServer.stop();
      }
      console.log('Test MongoDB disconnected');
    } catch (error) {
      console.error('Failed to cleanup test MongoDB:', error);
    }
  }

  async clearTestDatabase(app: INestApplication | undefined): Promise<void> {
    try {
      const connection = app?.get<Connection>(getConnectionToken());

      if (
        connection !== undefined &&
        connection.readyState !== ConnectionStates.disconnected
      ) {
        const collections = connection.collections;
        const deletePromises = Object.values(collections).map((collection) =>
          collection.deleteMany({}),
        );
        await Promise.all(deletePromises);
      }
    } catch (error) {
      console.error('Failed to clear collections:', error);
    }
  }
}
