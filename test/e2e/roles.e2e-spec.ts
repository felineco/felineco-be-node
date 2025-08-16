// test/e2e/roles.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { Operation, Privilege } from 'src/common/enums/permission.enum';
import { PermissionsService } from 'src/modules/permissions/services/permissions.service';
import { RolesService } from 'src/modules/roles/services/roles.service';
import * as request from 'supertest';
import { testINestApp } from 'test/setup/test-setup';

describe('Roles (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let permissionsService: PermissionsService;
  let rolesService: RolesService;

  // Test data
  let userPermissionId: string;
  let managePermissionId: string;

  beforeAll(async () => {
    app = testINestApp.getApp();
    moduleFixture = testINestApp.getModuleFixture();
    permissionsService =
      moduleFixture.get<PermissionsService>(PermissionsService);
    rolesService = moduleFixture.get<RolesService>(RolesService);
  });

  beforeEach(async () => {
    // Create test permissions
    const userPermission = await permissionsService.create({
      privilege: Privilege.USER,
      operation: Operation.READ,
    });
    userPermissionId = userPermission._id.toString();

    const managePermission = await permissionsService.create({
      privilege: Privilege.USER,
      operation: Operation.MANAGE,
    });
    managePermissionId = managePermission._id.toString();
  });

  afterEach(async () => {
    await testINestApp.clearTestDatabase();
  });

  afterAll(async () => {
    return;
  });

  describe('/api/roles (POST)', () => {
    it('should create a new role successfully', async () => {
      const roleData = {
        roleName: 'Admin',
        permissionIds: [userPermissionId],
      };

      const response = await request(app.getHttpServer())
        .post('/api/roles')
        .send(roleData)
        .expect(201);

      expect(response.body).toMatchObject({
        statusCode: 201,
        timestamp: expect.any(String),
        data: {
          _id: expect.any(String),
          name: 'Admin',
          permissions: [userPermissionId],
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });
    });

    it('should create role without permissions', async () => {
      const roleData = {
        roleName: 'Basic User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/roles')
        .send(roleData)
        .expect(201);

      expect(response.body.data.permissions).toEqual([]);
    });

    it('should return 400 for duplicate role name', async () => {
      const roleData = {
        roleName: 'Admin',
      };

      // Create first role
      await request(app.getHttpServer())
        .post('/api/roles')
        .send(roleData)
        .expect(201);

      // Try to create duplicate
      await request(app.getHttpServer())
        .post('/api/roles')
        .send(roleData)
        .expect(400);
    });

    it('should return 400 for invalid permission IDs', async () => {
      const roleData = {
        roleName: 'Admin',
        permissionIds: ['invalid-permission-id'],
      };

      await request(app.getHttpServer())
        .post('/api/roles')
        .send(roleData)
        .expect(400);
    });

    it('should return 400 for missing role name', async () => {
      await request(app.getHttpServer())
        .post('/api/roles')
        .send({})
        .expect(400);
    });
  });

  describe('/api/roles (GET)', () => {
    beforeEach(async () => {
      // Create test roles
      await rolesService.create({
        roleName: 'Admin',
        permissionIds: [userPermissionId, managePermissionId],
      });
      await rolesService.create({
        roleName: 'User',
        permissionIds: [userPermissionId],
      });
    });

    it('should return paginated roles', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/roles')
        .expect(200);

      expect(response.body).toMatchObject({
        statusCode: 200,
        timestamp: expect.any(String),
        data: expect.any(Array),
        meta: {
          page: 1,
          limit: 10,
          itemCount: 2,
          pageCount: 1,
        },
      });

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].permissions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: expect.any(String),
            object: Privilege.USER,
            action: expect.any(String),
          }),
        ]),
      );
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/roles?page=1&limit=1')
        .expect(200);

      expect(response.body.meta.itemCount).toBe(2);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('/api/roles/:id (GET)', () => {
    it('should return a role by id', async () => {
      const role = await rolesService.create({
        roleName: 'Admin',
        permissionIds: [userPermissionId],
      });

      const response = await request(app.getHttpServer())
        .get(`/api/roles/${role._id.toString()}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        _id: role._id.toString(),
        name: 'Admin',
        permissions: expect.arrayContaining([
          expect.objectContaining({
            _id: userPermissionId,
            object: Privilege.USER,
            operation: Operation.READ,
          }),
        ]),
      });
    });

    it('should return 400 for invalid id', async () => {
      await request(app.getHttpServer())
        .get('/api/roles/invalid-id')
        .expect(400);
    });

    it('should return 400 for non-existent role', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app.getHttpServer())
        .get(`/api/roles/${fakeId}`)
        .expect(400);
    });
  });

  describe('/api/roles/:id (PATCH)', () => {
    it('should update a role', async () => {
      const role = await rolesService.create({
        roleName: 'Admin',
        permissionIds: [userPermissionId],
      });

      const updateData = {
        roleName: 'Super Admin',
        permissionIds: [managePermissionId],
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/roles/${role._id.toString()}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name).toBe('Super Admin');
      expect(response.body.data.permissions).toHaveLength(1);
      expect(response.body.data.permissions[0]._id).toBe(managePermissionId);
    });

    it('should return 400 for duplicate role name', async () => {
      await rolesService.create({ roleName: 'Admin' });
      const role2 = await rolesService.create({ roleName: 'User' });

      await request(app.getHttpServer())
        .patch(`/api/roles/${role2._id.toString()}`)
        .send({ roleName: 'Admin' })
        .expect(400);
    });
  });

  describe('/api/roles/:id (DELETE)', () => {
    it('should delete a role', async () => {
      const role = await rolesService.create({ roleName: 'Admin' });

      await request(app.getHttpServer())
        .delete(`/api/roles/${role._id.toString()}`)
        .expect(200);

      // Verify it's deleted
      await request(app.getHttpServer())
        .get(`/api/roles/${role._id.toString()}`)
        .expect(400);
    });
  });

  describe('/api/roles/:id/permissions (POST)', () => {
    it('should add permissions to a role', async () => {
      const role = await rolesService.create({
        roleName: 'Admin',
        permissionIds: [userPermissionId],
      });

      const response = await request(app.getHttpServer())
        .post(`/api/roles/${role._id.toString()}/permissions`)
        .send({ permissionIds: [managePermissionId] })
        .expect(201);

      expect(response.body.data.permissions).toHaveLength(2);
    });

    it('should not add duplicate permissions', async () => {
      const role = await rolesService.create({
        roleName: 'Admin',
        permissionIds: [userPermissionId],
      });

      const response = await request(app.getHttpServer())
        .post(`/api/roles/${role._id.toString()}/permissions`)
        .send({ permissionIds: [userPermissionId] })
        .expect(201);

      expect(response.body.data.permissions).toHaveLength(1);
    });
  });

  describe('/api/roles/:id/permissions (DELETE)', () => {
    it('should remove permissions from a role', async () => {
      const role = await rolesService.create({
        roleName: 'Admin',
        permissionIds: [userPermissionId, managePermissionId],
      });

      const response = await request(app.getHttpServer())
        .delete(`/api/roles/${role._id.toString()}/permissions`)
        .send({ permissionIds: [managePermissionId] })
        .expect(200);

      expect(response.body.data.permissions).toHaveLength(1);
      expect(response.body.data.permissions[0]._id).toBe(userPermissionId);
    });
  });
});
