// test/e2e/s3.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { ACCESS_TOKEN_COOKIE_NAME } from 'src/common/constants/cookie-names.constant';
import { Operation, Privilege } from 'src/common/enums/permission.enum';
import { PermissionsService } from 'src/modules/permissions/services/permissions.service';
import { RolesService } from 'src/modules/roles/services/roles.service';
import { FileType } from 'src/modules/s3/enum/file-type.enum';
import { UsersService } from 'src/modules/users/services/users.service';
import * as request from 'supertest';
import { testINestApp } from 'test/setup/test-setup';

describe('S3 (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let permissionsService: PermissionsService;
  let rolesService: RolesService;
  let usersService: UsersService;

  // Test data
  let userPermissionId: string;
  let adminRoleId: string;
  let adminAccessToken: string;

  beforeAll(async () => {
    app = testINestApp.getApp();
    moduleFixture = testINestApp.getModuleFixture();
    permissionsService =
      moduleFixture.get<PermissionsService>(PermissionsService);
    rolesService = moduleFixture.get<RolesService>(RolesService);
    usersService = moduleFixture.get<UsersService>(UsersService);
  });

  beforeEach(async () => {
    // Create test permissions
    const userPermission = await permissionsService.create({
      privilege: Privilege.USER,
      operation: Operation.MANAGE,
    });
    userPermissionId = userPermission._id.toString();

    // Create test role
    const adminRole = await rolesService.create({
      roleName: 'Admin',
      permissionIds: [userPermissionId],
    });
    adminRoleId = adminRole._id.toString();

    // Create admin user and get access token
    await usersService.create({
      email: 'admin@example.com',
      password: 'password123',
      roleIds: [adminRoleId],
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123',
      })
      .expect(200);

    adminAccessToken = loginResponse.body.data.accessToken;
  });

  afterEach(async () => {
    await testINestApp.clearTestDatabase();
  });

  afterAll(async () => {
    return;
  });

  describe('/api/blob/presigned-url (POST)', () => {
    it('should return 401 without authentication', async () => {
      const requestData = {
        type: FileType.IMAGE,
        filename: 'test.jpg',
      };

      await request(app.getHttpServer())
        .post('/api/blob/presigned-url')
        .send(requestData)
        .expect(401);
    });

    it('should generate presigned URL for image upload', async () => {
      const requestData = {
        type: FileType.IMAGE,
        filename: 'test-image.jpg',
      };

      const response = await request(app.getHttpServer())
        .post('/api/blob/presigned-url')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(requestData)
        .expect(201);

      expect(response.body).toMatchObject({
        statusCode: 201,
        timestamp: expect.any(String),
        data: {
          presignedUrl: expect.any(String),
          url: expect.any(String),
          expiresIn: expect.any(Number),
          expiresAt: expect.any(String),
        },
      });

      // Check that the url contains 'images' folder for image type
      expect(response.body.data.url).toMatch(/.*\/images\//);

      // Check that presigned URL is a valid URL
      expect(response.body.data.presignedUrl).toMatch(/^https?:\/\//);

      // Check expiration time is reasonable (should be 600 seconds by default)
      expect(response.body.data.expiresIn).toBe(600);

      // Check expiresAt is a valid ISO date string
      expect(new Date(response.body.data.expiresAt)).toBeInstanceOf(Date);
    });

    it('should generate presigned URL for audio upload', async () => {
      const requestData = {
        type: FileType.AUDIO,
        filename: 'test-audio.mp3',
      };

      const response = await request(app.getHttpServer())
        .post('/api/blob/presigned-url')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(requestData)
        .expect(201);

      expect(response.body.data.url).toMatch(/.*\/audios\//);
    });

    it('should generate presigned URL without filename', async () => {
      const requestData = {
        type: FileType.IMAGE,
      };

      const response = await request(app.getHttpServer())
        .post('/api/blob/presigned-url')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(requestData)
        .expect(201);

      // Should use default extension for image type (.jpg)
      expect(response.body.data.url).toMatch(/.*\.jpg$/);
    });

    it('should handle audio type without filename', async () => {
      const requestData = {
        type: FileType.AUDIO,
      };

      const response = await request(app.getHttpServer())
        .post('/api/blob/presigned-url')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(requestData)
        .expect(201);

      // Should use default extension for audio type (.mp3)
      expect(response.body.data.url).toMatch(/.*\.mp3$/);
    });

    it('should return 400 for invalid file type', async () => {
      const requestData = {
        type: 'invalid-type',
        filename: 'test.jpg',
      };

      await request(app.getHttpServer())
        .post('/api/blob/presigned-url')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(requestData)
        .expect(400);
    });

    it('should return 400 for missing type', async () => {
      const requestData = {
        filename: 'test.jpg',
      };

      await request(app.getHttpServer())
        .post('/api/blob/presigned-url')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(requestData)
        .expect(400);
    });

    it('should preserve file extension from filename', async () => {
      const testCases = [
        { filename: 'test.png', type: FileType.IMAGE, expectedExt: '.png' },
        { filename: 'test.gif', type: FileType.IMAGE, expectedExt: '.gif' },
        { filename: 'test.wav', type: FileType.AUDIO, expectedExt: '.wav' },
        { filename: 'test.m4a', type: FileType.AUDIO, expectedExt: '.m4a' },
      ];

      for (const testCase of testCases) {
        const response = await request(app.getHttpServer())
          .post('/api/blob/presigned-url')
          .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
          .send({
            type: testCase.type,
            filename: testCase.filename,
          })
          .expect(201);

        expect(response.body.data.url).toMatch(
          new RegExp(`${testCase.expectedExt.replace('.', '\\.')}$`),
        );
      }
    });

    it('should generate unique urls for multiple requests', async () => {
      const requestData = {
        type: FileType.IMAGE,
        filename: 'test.jpg',
      };

      const response1 = await request(app.getHttpServer())
        .post('/api/blob/presigned-url')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(requestData)
        .expect(201);

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response2 = await request(app.getHttpServer())
        .post('/api/blob/presigned-url')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(requestData)
        .expect(201);

      expect(response1.body.data.url).not.toBe(response2.body.data.url);
      expect(response1.body.data.presignedUrl).not.toBe(
        response2.body.data.presignedUrl,
      );
    });

    it('should return consistent response structure', async () => {
      const requestData = {
        type: FileType.IMAGE,
        filename: 'test.jpg',
      };

      const response = await request(app.getHttpServer())
        .post('/api/blob/presigned-url')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(requestData)
        .expect(201);

      // Check all required properties exist
      expect(response.body.data).toHaveProperty('presignedUrl');
      expect(response.body.data).toHaveProperty('url');
      expect(response.body.data).toHaveProperty('expiresIn');
      expect(response.body.data).toHaveProperty('expiresAt');

      // Check types
      expect(typeof response.body.data.presignedUrl).toBe('string');
      expect(typeof response.body.data.url).toBe('string');
      expect(typeof response.body.data.expiresIn).toBe('number');
      expect(typeof response.body.data.expiresAt).toBe('string');
    });
  });
});
