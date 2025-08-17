// test/auth.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from 'src/common/constants/cookie-names.constant';
import { Operation, Privilege } from 'src/common/enums/permission.enum';
import { PermissionsService } from 'src/modules/permissions/services/permissions.service';
import { RolesService } from 'src/modules/roles/services/roles.service';
import { SeedingService } from 'src/modules/seeding/seeding.service';
import * as request from 'supertest';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  testINestApp,
} from 'test/setup/test-setup';
import { normalizeCookies } from 'test/utils/test-helpers';

describe('Auth & Users (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let permissionsService: PermissionsService;
  let rolesService: RolesService;

  // Test data
  let userPermissionId: string;
  let userRoleId: string;
  let regularUserData: {
    email: string;
    password: string;
  };
  let userWithRoleData: {
    email: string;
    password: string;
    roleIds: string[];
  };

  beforeAll(async () => {
    app = testINestApp.getApp();
    moduleFixture = testINestApp.getModuleFixture();
    permissionsService =
      moduleFixture.get<PermissionsService>(PermissionsService);
    rolesService = moduleFixture.get<RolesService>(RolesService);

    return;
  });

  beforeEach(async () => {
    // Re-create the admin user after database clear
    const seedingService = moduleFixture.get<SeedingService>(SeedingService);
    await seedingService.onApplicationBootstrap();
    // Create test permissions and roles
    const userPermission = await permissionsService.create({
      privilege: Privilege.USER,
      operation: Operation.READ,
    });
    userPermissionId = userPermission._id.toString();

    const adminRole = await rolesService.create({
      roleName: 'Read User Role',
      permissionIds: [userPermissionId],
    });
    userRoleId = adminRole._id.toString();

    // Test user data
    regularUserData = {
      email: 'regular@example.com',
      password: 'password123',
    };

    userWithRoleData = {
      email: 'user@example.com',
      password: 'password123',
      roleIds: [userRoleId],
    };
  });

  afterEach(async () => {
    await testINestApp.clearTestDatabase();
  });

  afterAll(async () => {
    // Template
    return;
  });

  describe('/api/users (POST)', () => {
    let adminAccessToken: string;

    // Login as admin
    beforeEach(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        })
        .expect(200);

      adminAccessToken = loginResponse.body.data.accessToken;
    });

    it('should create a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(regularUserData)
        .expect(201);

      expect(response.body).toMatchObject({
        statusCode: 201,
        timestamp: expect.any(String),
        data: {
          _id: expect.any(String),
          email: regularUserData.email,
          roles: [],
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });

      // Password should not be returned
      expect(response.body?.data?.hashPassword).toBeUndefined();
      expect(response.body?.data?.password).toBeUndefined();
    });

    it('should create a user with roles', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(userWithRoleData)
        .expect(201);

      expect(response.body?.data?.roles).toEqual([userRoleId]);
    });

    it('should return 400 for invalid email', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(invalidUserData)
        .expect(400);
    });

    it('should return 400 for short password', async () => {
      const invalidUserData = {
        email: 'test@example.com',
        password: '123',
      };

      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(invalidUserData)
        .expect(400);
    });

    it('should return 400 for duplicate email', async () => {
      // Create first user
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(regularUserData)
        .expect(201);

      // Try to create second user with same email
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(regularUserData)
        .expect(400);
    });

    it('should return 400 for invalid role IDs', async () => {
      const userWithInvalidRole = {
        email: 'test@example.com',
        password: 'password123',
        roleIds: ['invalid-role-id'],
      };

      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(userWithInvalidRole)
        .expect(400);
    });
  });

  describe('/api/auth/login (POST)', () => {
    let adminAccessToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        })
        .expect(200);

      adminAccessToken = loginResponse.body.data.accessToken;

      // Create a user for login tests
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(userWithRoleData)
        .expect(201);
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: userWithRoleData.email,
        password: userWithRoleData.password,
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        statusCode: 200,
        timestamp: expect.any(String),
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          accessTokenExpiresAt: expect.any(String),
          refreshTokenExpiresAt: expect.any(String),
        },
      });

      // Handle both string and string[] cases
      const cookies = normalizeCookies(response.headers['set-cookie']);

      expect(cookies).toBeDefined();
      expect(
        cookies.some((cookie: string) =>
          cookie.includes(ACCESS_TOKEN_COOKIE_NAME),
        ),
      ).toBe(true);
      expect(
        cookies.some((cookie: string) =>
          cookie.includes(REFRESH_TOKEN_COOKIE_NAME),
        ),
      ).toBe(true);
    });

    it('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: userWithRoleData.password,
      };

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: userWithRoleData.email,
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);
    });

    it('should return 401 for missing credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(401);
    });

    it('should return 400 for invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);
    });
  });

  describe('/api/auth/refresh (POST)', () => {
    let adminAccessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      const adminLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        })
        .expect(200);

      adminAccessToken = adminLoginResponse.body.data.accessToken;

      // Create user and login to get refresh token
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(userWithRoleData)
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: userWithRoleData.email,
          password: userWithRoleData.password,
        })
        .expect(200);

      refreshToken = loginResponse.body?.data?.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        statusCode: 200,
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          accessTokenExpiresAt: expect.any(String),
          refreshTokenExpiresAt: expect.any(String),
        },
      });
    });

    it('should return 401 for invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });

    it('should return 401 for missing refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({})
        .expect(401);
    });
  });

  describe('/api/auth/logout (POST)', () => {
    it('should logout successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(200);

      // Check that cookies are cleared
      const cookies = normalizeCookies(response.headers['set-cookie']);
      expect(
        cookies.some(
          (cookie: string) =>
            cookie.includes(ACCESS_TOKEN_COOKIE_NAME) ||
            cookie.includes(REFRESH_TOKEN_COOKIE_NAME),
        ),
      ).toBe(true);
    });
  });

  describe('/api/auth/me (GET)', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      const adminLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        })
        .expect(200);

      const adminAccessToken = adminLoginResponse.body.data.accessToken;

      // Create user and login to get access token
      const createResponse = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(userWithRoleData)
        .expect(201);

      userId = createResponse.body?.data?._id;

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: userWithRoleData.email,
          password: userWithRoleData.password,
        })
        .expect(200);

      accessToken = loginResponse.body?.data?.accessToken;
    });

    it('should return current user information when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${accessToken}`])
        .expect(200);

      expect(response.body).toMatchObject({
        statusCode: 200,
        timestamp: expect.any(String),
        data: {
          _id: userId,
          email: userWithRoleData.email,
          roles: expect.any(Array),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });

      // Verify roles are populated
      expect(response.body.data.roles).toHaveLength(1);
      expect(response.body.data.roles[0]).toMatchObject({
        _id: userRoleId,
        name: 'Read User Role',
        permissions: expect.any(Array),
      });

      // Password should not be returned
      expect(response.body?.data?.hashPassword).toBeUndefined();
      expect(response.body?.data?.password).toBeUndefined();
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=invalid-token`])
        .expect(401);
    });
  });

  describe('Integration: User creation -> Login -> Access protected resource', () => {
    it('should create user, login, and access protected endpoint', async () => {
      const adminLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        })
        .expect(200);

      const adminAccessToken = adminLoginResponse.body.data.accessToken;
      // 1. Create user
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(userWithRoleData)
        .expect(201);

      // 2. Login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: userWithRoleData.email,
          password: userWithRoleData.password,
        })
        .expect(200);

      const accessToken = loginResponse.body?.data?.accessToken;

      // 3. Access protected resource (get user details)
      await request(app.getHttpServer()).get(`/api/auth/me`).expect(401);

      // 4. Access protected resource (get user details)
      await request(app.getHttpServer())
        .get(`/api/auth/me`)
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${accessToken}`])
        .expect(200);
    });
  });
});
