// test/e2e/permissions.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { testINestApp } from 'test/setup/test-setup';
import { Action, Privilege } from '../../src/common/enums/permission.enum';

describe('Permissions (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = testINestApp.getApp();
  });

  afterEach(async () => {
    await testINestApp.clearTestDatabase();
  });

  afterAll(async () => {
    // Template
    return;
  });

  describe('/api/permissions (POST)', () => {
    it('should create a new permission', async () => {
      const permissionData = {
        privilege: Privilege.USER,
        action: Action.CREATE,
      };

      const response = await request(app.getHttpServer())
        .post('/api/permissions')
        .send(permissionData)
        .expect(201);

      expect(response.body).toMatchObject({
        statusCode: 201,
        data: {
          _id: expect.any(String),
          object: Privilege.USER,
          action: Action.CREATE,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });
    });

    it('should return 400 for duplicate permission', async () => {
      const permissionData = {
        privilege: Privilege.USER,
        action: Action.CREATE,
      };

      // Create first permission
      await request(app.getHttpServer())
        .post('/api/permissions')
        .send(permissionData)
        .expect(201);

      // Try to create duplicate
      await request(app.getHttpServer())
        .post('/api/permissions')
        .send(permissionData)
        .expect(400);
    });

    it('should return 400 for invalid privilege', async () => {
      const invalidData = {
        privilege: 'INVALID_PRIVILEGE',
        action: Action.CREATE,
      };

      await request(app.getHttpServer())
        .post('/api/permissions')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('/api/permissions (GET)', () => {
    it('should return paginated permissions', async () => {
      // Create test permissions
      await request(app.getHttpServer())
        .post('/api/permissions')
        .send({ privilege: Privilege.USER, action: Action.CREATE });

      await request(app.getHttpServer())
        .post('/api/permissions')
        .send({ privilege: Privilege.USER, action: Action.READ });

      const response = await request(app.getHttpServer())
        .get('/api/permissions')
        .expect(200);

      expect(response.body).toMatchObject({
        statusCode: 200,
        data: expect.any(Array),
        meta: {
          page: 1,
          limit: 10,
          itemCount: 2,
          pageCount: 1,
        },
      });

      expect(response.body.data).toHaveLength(2);
    });

    it('should support pagination', async () => {
      // Create test permissions
      for (const action of [Action.CREATE, Action.READ, Action.UPDATE]) {
        await request(app.getHttpServer())
          .post('/api/permissions')
          .send({ privilege: Privilege.USER, action });
      }

      const response = await request(app.getHttpServer())
        .get('/api/permissions?page=1&limit=2')
        .expect(200);

      expect(response.body.meta.itemCount).toBe(3);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('/api/permissions/:id (GET)', () => {
    it('should return a permission by id', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/permissions')
        .send({ privilege: Privilege.USER, action: Action.CREATE });

      const permissionId = createResponse.body.data._id;

      const response = await request(app.getHttpServer())
        .get(`/api/permissions/${permissionId}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        _id: permissionId,
        object: Privilege.USER,
        action: Action.CREATE,
      });
    });

    it('should return 400 for invalid id', async () => {
      await request(app.getHttpServer())
        .get('/api/permissions/invalid-id')
        .expect(400);
    });
  });

  describe('/api/permissions/:id (PATCH)', () => {
    it('should update a permission', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/permissions')
        .send({ privilege: Privilege.USER, action: Action.CREATE });

      const permissionId = createResponse.body.data._id;

      const response = await request(app.getHttpServer())
        .patch(`/api/permissions/${permissionId}`)
        .send({ action: Action.UPDATE })
        .expect(200);

      expect(response.body.data.action).toBe(Action.UPDATE);
    });
  });

  describe('/api/permissions/:id (DELETE)', () => {
    it('should delete a permission', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/permissions')
        .send({ privilege: Privilege.USER, action: Action.CREATE });

      const permissionId = createResponse.body.data._id;

      await request(app.getHttpServer())
        .delete(`/api/permissions/${permissionId}`)
        .expect(200);

      // Verify it's deleted
      await request(app.getHttpServer())
        .get(`/api/permissions/${permissionId}`)
        .expect(400);
    });
  });
});
