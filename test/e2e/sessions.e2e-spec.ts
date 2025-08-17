// test/e2e/sessions.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { ACCESS_TOKEN_COOKIE_NAME } from 'src/common/constants/cookie-names.constant';
import { LanguageEnum } from 'src/common/enums/language.enum';
import { SeedingService } from 'src/modules/seeding/seeding.service';
import { SessionsService } from 'src/modules/sessions/services/sessions.service';
import * as request from 'supertest';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  testINestApp,
} from 'test/setup/test-setup';

describe('Sessions (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let sessionsService: SessionsService;
  let adminAccessToken: string;

  beforeAll(async () => {
    app = testINestApp.getApp();
    moduleFixture = testINestApp.getModuleFixture();
    sessionsService = moduleFixture.get<SessionsService>(SessionsService);
  });

  beforeEach(async () => {
    // Seeding the db
    const seedingService = moduleFixture.get<SeedingService>(SeedingService);
    await seedingService.onApplicationBootstrap();

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
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

  describe('/api/sessions/templates (POST)', () => {
    it('should return 401 without authentication', async () => {
      const templateData = {
        language: LanguageEnum.EN_US,
        fields: [
          {
            id: 1,
            label: 'Patient Name',
            value: '',
            guide: 'Enter patient name',
            sample: 'John Doe',
            order: 1,
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/api/sessions/templates')
        .send(templateData)
        .expect(401);
    });

    it('should create a new session template successfully', async () => {
      const templateData = {
        language: LanguageEnum.EN_US,
        fields: [
          {
            id: 1,
            label: 'Patient Name',
            value: 'John Doe',
            guide: 'Enter patient name',
            sample: 'Jane Smith',
            order: 1,
          },
          {
            id: 2,
            label: 'Diagnosis',
            value: '',
            guide: 'Enter diagnosis',
            sample: 'Sample diagnosis',
            order: 2,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/sessions/templates')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(templateData)
        .expect(201);

      expect(response.body).toMatchObject({
        statusCode: 201,
        timestamp: expect.any(String),
        data: {
          _id: expect.any(String),
          language: LanguageEnum.EN_US,
          fields: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              label: 'Patient Name',
              value: 'John Doe',
              guide: 'Enter patient name',
              sample: 'Jane Smith',
              order: 1,
            }),
          ]),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });
    });

    it('should create template with Vietnamese language', async () => {
      const templateData = {
        language: LanguageEnum.VI_VN,
        fields: [
          {
            id: 1,
            label: 'Tên bệnh nhân',
            value: '',
            guide: 'Nhập tên bệnh nhân',
            sample: 'Nguyễn Văn A',
            order: 1,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/sessions/templates')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(templateData)
        .expect(201);

      expect(response.body.data.language).toBe(LanguageEnum.VI_VN);
    });

    it('should return 400 for invalid language', async () => {
      const templateData = {
        language: 'invalid-language',
        fields: [
          {
            id: 1,
            label: 'Patient Name',
            value: '',
            guide: 'Enter patient name',
            sample: 'John Doe',
            order: 1,
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/api/sessions/templates')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(templateData)
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      const templateData = {
        language: LanguageEnum.EN_US,
      };

      await request(app.getHttpServer())
        .post('/api/sessions/templates')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(templateData)
        .expect(400);
    });
  });

  describe('/api/sessions/templates (GET)', () => {
    beforeEach(async () => {
      // Create test templates
      await sessionsService.createTemplate({
        language: LanguageEnum.EN_US,
        fields: [
          {
            id: 1,
            label: 'Patient Name',
            value: '',
            guide: 'Enter patient name',
            sample: 'John Doe',
            order: 1,
          },
        ],
      });
      await sessionsService.createTemplate({
        language: LanguageEnum.VI_VN,
        fields: [
          {
            id: 1,
            label: 'Tên bệnh nhân',
            value: '',
            guide: 'Nhập tên bệnh nhân',
            sample: 'Nguyễn Văn A',
            order: 1,
          },
        ],
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/sessions/templates')
        .expect(401);
    });

    it('should return all templates', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/sessions/templates')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .expect(200);

      expect(response.body).toMatchObject({
        statusCode: 200,
        timestamp: expect.any(String),
        data: expect.any(Array),
      });

      expect(response.body.data).toHaveLength(2);
    });

    it('should filter templates by language', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/sessions/templates?language=en-US')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].language).toBe(LanguageEnum.EN_US);
    });

    it('should filter templates by multiple languages', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/sessions/templates?language=en-US&language=vi-VN')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .expect(200);

      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('/api/sessions/templates/:id (GET)', () => {
    it('should return 401 without authentication', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app.getHttpServer())
        .get(`/api/sessions/templates/${fakeId}`)
        .expect(401);
    });

    it('should return template by id', async () => {
      const template = await sessionsService.createTemplate({
        language: LanguageEnum.EN_US,
        fields: [
          {
            id: 1,
            label: 'Patient Name',
            value: '',
            guide: 'Enter patient name',
            sample: 'John Doe',
            order: 1,
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get(`/api/sessions/templates/${template._id.toString()}`)
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .expect(200);

      expect(response.body.data).toMatchObject({
        _id: template._id.toString(),
        language: LanguageEnum.EN_US,
        fields: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            label: 'Patient Name',
          }),
        ]),
      });
    });

    it('should return 400 for invalid id', async () => {
      await request(app.getHttpServer())
        .get('/api/sessions/templates/invalid-id')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .expect(400);
    });

    it('should return 400 for non-existent template', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app.getHttpServer())
        .get(`/api/sessions/templates/${fakeId}`)
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .expect(400);
    });
  });

  describe('/api/sessions/templates/:id (PATCH)', () => {
    it('should return 401 without authentication', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app.getHttpServer())
        .patch(`/api/sessions/templates/${fakeId}`)
        .send({ language: LanguageEnum.VI_VN })
        .expect(401);
    });

    it('should update template successfully', async () => {
      const template = await sessionsService.createTemplate({
        language: LanguageEnum.EN_US,
        fields: [
          {
            id: 1,
            label: 'Patient Name',
            value: '',
            guide: 'Enter patient name',
            sample: 'John Doe',
            order: 1,
          },
        ],
      });

      const updateData = {
        language: LanguageEnum.VI_VN,
        fields: [
          {
            id: 1,
            label: 'Tên bệnh nhân',
            value: '',
            guide: 'Nhập tên bệnh nhân',
            sample: 'Nguyễn Văn A',
            order: 1,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/sessions/templates/${template._id.toString()}`)
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(updateData)
        .expect(200);

      expect(response.body.data.language).toBe(LanguageEnum.VI_VN);
      expect(response.body.data.fields[0].label).toBe('Tên bệnh nhân');
    });

    it('should update only language', async () => {
      const template = await sessionsService.createTemplate({
        language: LanguageEnum.EN_US,
        fields: [
          {
            id: 1,
            label: 'Patient Name',
            value: '',
            guide: 'Enter patient name',
            sample: 'John Doe',
            order: 1,
          },
        ],
      });

      const updateData = {
        language: LanguageEnum.VI_VN,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/sessions/templates/${template._id.toString()}`)
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(updateData)
        .expect(200);

      expect(response.body.data.language).toBe(LanguageEnum.VI_VN);
      expect(response.body.data.fields[0].label).toBe('Patient Name');
    });

    it('should return 400 for non-existent template', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app.getHttpServer())
        .patch(`/api/sessions/templates/${fakeId}`)
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send({ language: LanguageEnum.VI_VN })
        .expect(400);
    });
  });

  describe('/api/sessions/templates/:id (DELETE)', () => {
    it('should return 401 without authentication', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app.getHttpServer())
        .delete(`/api/sessions/templates/${fakeId}`)
        .expect(401);
    });

    it('should delete template successfully', async () => {
      const template = await sessionsService.createTemplate({
        language: LanguageEnum.EN_US,
        fields: [
          {
            id: 1,
            label: 'Patient Name',
            value: '',
            guide: 'Enter patient name',
            sample: 'John Doe',
            order: 1,
          },
        ],
      });

      await request(app.getHttpServer())
        .delete(`/api/sessions/templates/${template._id.toString()}`)
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .expect(200);

      // Verify it's deleted
      await request(app.getHttpServer())
        .get(`/api/sessions/templates/${template._id.toString()}`)
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .expect(400);
    });

    it('should return 400 for non-existent template', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app.getHttpServer())
        .delete(`/api/sessions/templates/${fakeId}`)
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .expect(400);
    });
  });
});
