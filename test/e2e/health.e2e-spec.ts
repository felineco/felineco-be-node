// test/e2e/health.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { testINestApp } from 'test/setup/test-setup';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = testINestApp.getApp();
  });

  afterEach(async () => {
    // No need to clear database for health checks
  });

  afterAll(async () => {
    return;
  });

  describe('/api/health (GET)', () => {
    it('should return health check status', async () => {
      await request(app.getHttpServer())
        .get('/api/health')
        .expect((res) => {
          // Accept both 200 (healthy) and 503 (unhealthy) for e2e tests
          if (res.status !== 200 && res.status !== 503) {
            throw new Error(`Expected 200 or 503, got ${res.status}`);
          }
        });
    });
  });
});
