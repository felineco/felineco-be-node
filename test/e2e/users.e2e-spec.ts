// test/e2e/users.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { ACCESS_TOKEN_COOKIE_NAME } from 'src/common/constants/cookie-names.constant';
import { RolesService } from 'src/modules/roles/services/roles.service';
import { SeedingService } from 'src/modules/seeding/seeding.service';
import * as request from 'supertest';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  testINestApp,
} from 'test/setup/test-setup';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let rolesService: RolesService;

  let userRoleId: string;
  let adminAccessToken: string;

  beforeAll(async () => {
    app = testINestApp.getApp();
    moduleFixture = testINestApp.getModuleFixture();
    rolesService = moduleFixture.get<RolesService>(RolesService);
  });

  beforeEach(async () => {
    // Seeding the db
    const seedingService = moduleFixture.get<SeedingService>(SeedingService);
    await seedingService.onApplicationBootstrap();

    const userRole = await rolesService.create({
      roleName: 'User',
    });
    userRoleId = userRole._id.toString();

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      })
      .expect(200);

    adminAccessToken = loginResponse.body.data.accessToken;

    // const loginResponse = await request(app.getHttpServer())
    //   .post('/api/auth/login')
    //   .send({
    //     email: 'admin@example.com',
    //     password: 'password123',
    //   })
    //   .expect(200);

    // adminAccessToken = loginResponse.body.data.accessToken;
  });

  afterEach(async () => {
    await testINestApp.clearTestDatabase();
  });

  afterAll(async () => {
    return;
  });

  describe('/api/users (POST)', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        roleIds: [userRoleId],
      };

      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        statusCode: 201,
        timestamp: expect.any(String),
        data: {
          _id: expect.any(String),
          email: 'test@example.com',
          roles: [userRoleId],
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });

      // Password should not be returned
      expect(response.body.data.hashPassword).toBeUndefined();
      expect(response.body.data.password).toBeUndefined();
    });

    it('should create user without roles', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(userData)
        .expect(201);

      expect(response.body.data.roles).toEqual([]);
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(userData)
        .expect(400);
    });

    it('should return 400 for short password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
      };

      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(userData)
        .expect(400);
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Create first user
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(userData)
        .expect(201);

      // Try to create duplicate
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(userData)
        .expect(400);
    });

    it('should return 400 for invalid role IDs', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        roleIds: ['invalid-role-id'],
      };

      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
        .send(userData)
        .expect(400);
    });
  });

  // describe('/api/users (GET)', () => {
  //   beforeEach(async () => {
  //     // Create test users
  //     await usersService.create({
  //       email: 'user1@example.com',
  //       password: 'password123',
  //       roleIds: [userRoleId],
  //     });
  //     await usersService.create({
  //       email: 'user2@example.com',
  //       password: 'password123',
  //     });
  //   });

  //   it('should return 401 without authentication', async () => {
  //     await request(app.getHttpServer()).get('/api/users').expect(401);
  //   });

  //   it('should return paginated users with authentication', async () => {
  //     const response = await request(app.getHttpServer())
  //       .get('/api/users')
  //       .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
  //       .expect(200);

  //     expect(response.body).toMatchObject({
  //       statusCode: 200,
  //       timestamp: expect.any(String),
  //       data: expect.any(Array),
  //       meta: {
  //         page: 1,
  //         limit: 10,
  //         itemCount: 3, // Including admin user
  //         pageCount: 1,
  //       },
  //     });

  //     expect(response.body.data).toHaveLength(3);
  //     // Check that passwords are not returned
  //     response.body.data.forEach((user: any) => {
  //       expect(user.hashPassword).toBeUndefined();
  //       expect(user.password).toBeUndefined();
  //     });
  //   });

  //   it('should support pagination', async () => {
  //     const response = await request(app.getHttpServer())
  //       .get('/api/users?page=1&limit=2')
  //       .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
  //       .expect(200);

  //     expect(response.body.meta.itemCount).toBe(3);
  //     expect(response.body.data).toHaveLength(2);
  //   });
  // });

  // describe('/api/users/:id (GET)', () => {
  //   it('should return 401 without authentication', async () => {
  //     const fakeId = '507f1f77bcf86cd799439011';
  //     await request(app.getHttpServer())
  //       .get(`/api/users/${fakeId}`)
  //       .expect(401);
  //   });

  //   it('should return a user by id with authentication', async () => {
  //     const user = await usersService.create({
  //       email: 'test@example.com',
  //       password: 'password123',
  //       roleIds: [userRoleId],
  //     });

  //     const response = await request(app.getHttpServer())
  //       .get(`/api/users/${user._id.toString()}`)
  //       .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
  //       .expect(200);

  //     expect(response.body.data).toMatchObject({
  //       _id: user._id.toString(),
  //       email: 'test@example.com',
  //       roles: expect.arrayContaining([
  //         expect.objectContaining({
  //           _id: userRoleId,
  //           name: 'User',
  //           permissions: expect.any(Array),
  //         }),
  //       ]),
  //     });

  //     // Password should not be returned
  //     expect(response.body.data.hashPassword).toBeUndefined();
  //   });

  //   it('should return 400 for invalid id', async () => {
  //     await request(app.getHttpServer())
  //       .get('/api/users/invalid-id')
  //       .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
  //       .expect(400);
  //   });
  // });

  // describe('/api/users/:id (PATCH)', () => {
  //   it('should update a user', async () => {
  //     const user = await usersService.create({
  //       email: 'test@example.com',
  //       password: 'password123',
  //     });

  //     const updateData = {
  //       email: 'updated@example.com',
  //       roleIds: [userRoleId],
  //     };

  //     const response = await request(app.getHttpServer())
  //       .patch(`/api/users/${user._id.toString()}`)
  //       .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
  //       .send(updateData)
  //       .expect(200);

  //     expect(response.body.data.email).toBe('updated@example.com');
  //     expect(response.body.data.roles).toHaveLength(1);
  //   });

  //   it('should return 401 without authentication', async () => {
  //     const fakeId = '507f1f77bcf86cd799439011';
  //     await request(app.getHttpServer())
  //       .patch(`/api/users/${fakeId}`)
  //       .send({ email: 'test@example.com' })
  //       .expect(401);
  //   });
  // });

  // describe('/api/users/:id (DELETE)', () => {
  //   it('should delete a user', async () => {
  //     const user = await usersService.create({
  //       email: 'test@example.com',
  //       password: 'password123',
  //     });

  //     await request(app.getHttpServer())
  //       .delete(`/api/users/${user._id.toString()}`)
  //       .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
  //       .expect(200);

  //     // Verify it's deleted
  //     await request(app.getHttpServer())
  //       .get(`/api/users/${user._id.toString()}`)
  //       .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
  //       .expect(400);
  //   });

  //   it('should return 401 without authentication', async () => {
  //     const fakeId = '507f1f77bcf86cd799439011';
  //     await request(app.getHttpServer())
  //       .delete(`/api/users/${fakeId}`)
  //       .expect(401);
  //   });
  // });

  // describe('/api/users/:id/roles (POST)', () => {
  //   it('should add roles to a user', async () => {
  //     const user = await usersService.create({
  //       email: 'test@example.com',
  //       password: 'password123',
  //     });

  //     const response = await request(app.getHttpServer())
  //       .post(`/api/users/${user._id.toString()}/roles`)
  //       .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
  //       .send({ roleIds: [userRoleId] })
  //       .expect(201);

  //     expect(response.body.data.roles).toHaveLength(1);
  //     expect(response.body.data.roles[0]._id).toBe(userRoleId);
  //   });

  //   it('should not add duplicate roles', async () => {
  //     const user = await usersService.create({
  //       email: 'test@example.com',
  //       password: 'password123',
  //       roleIds: [userRoleId],
  //     });

  //     const response = await request(app.getHttpServer())
  //       .post(`/api/users/${user._id.toString()}/roles`)
  //       .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
  //       .send({ roleIds: [userRoleId] })
  //       .expect(201);

  //     expect(response.body.data.roles).toHaveLength(1);
  //   });
  // });

  // describe('/api/users/:id/roles (DELETE)', () => {
  //   it('should remove roles from a user', async () => {
  //     const user = await usersService.create({
  //       email: 'test@example.com',
  //       password: 'password123',
  //       roleIds: [userRoleId, adminRoleId],
  //     });

  //     const response = await request(app.getHttpServer())
  //       .delete(`/api/users/${user._id.toString()}/roles`)
  //       .set('Cookie', [`${ACCESS_TOKEN_COOKIE_NAME}=${adminAccessToken}`])
  //       .send({ roleIds: [adminRoleId] })
  //       .expect(200);

  //     expect(response.body.data.roles).toHaveLength(1);
  //     expect(response.body.data.roles[0]._id).toBe(userRoleId);
  //   });
  // });
});
