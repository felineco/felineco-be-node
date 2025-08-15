// test/setup/test-setup.ts
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { AppLoggerService } from 'src/common/services/logger.service';
import { TestDatabase } from 'test/utils/database-setup';

export class TestINestApplication {
  private app: INestApplication;
  private moduleFixture: TestingModule;
  private testDatabase: TestDatabase;

  constructor() {
    this.testDatabase = new TestDatabase();
  }

  async initialize(): Promise<void> {
    console.log('Initializing test application...');
    await this.testDatabase.setupTestDatabase();

    this.moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = this.moduleFixture.createNestApplication();
    const logger = new AppLoggerService().setContext('E2E-Test');
    this.app.useLogger(logger);
    this.app.setGlobalPrefix('api');

    await this.app.init();
  }

  async close(): Promise<void> {
    await this.app.close();
    await this.testDatabase.teardownTestDatabase();
  }

  getApp(): INestApplication {
    if (this.app === undefined || this.app === null) {
      throw new Error('Application not initialized. Call initialize() first.');
    }
    return this.app;
  }

  getModuleFixture(): TestingModule {
    if (this.moduleFixture === undefined || this.moduleFixture === null) {
      throw new Error(
        'Module fixture not initialized. Call initialize() first.',
      );
    }
    return this.moduleFixture;
  }

  clearTestDatabase(): Promise<void> {
    return this.testDatabase.clearTestDatabase(this.app);
  }
}

const testINestApp = new TestINestApplication();
export { testINestApp };

beforeAll(async () => {
  await testINestApp.initialize();
});

afterAll(async () => {
  await testINestApp.close();
});
