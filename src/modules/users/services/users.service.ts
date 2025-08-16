// src/modules/users/services/users.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { AccessControl } from 'src/common/decorators/authorization-policy.decorator.ts';
import { Operation, Privilege } from 'src/common/enums/permission.enum';
import { CryptoService } from 'src/common/services/crypto.service';
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';
import {
  Role,
  RoleDocument,
  RoleWWithPopulatePermission,
} from 'src/modules/roles/schemas/role.schema';
import { PagingQueryOptions } from '../../../common/dtos/page-query-options.dto';
import {
  PagingResponse,
  PagingResponseMeta,
} from '../../../common/dtos/page-response.dto';
import {
  User,
  UserDocument,
  UserWithPopulateRoleAndPermission,
} from '../schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Role.name)
    private roleModel: Model<RoleDocument>,
    private cryptoService: CryptoService,
  ) {}

  async create(userData: {
    email: string;
    password: string;
    roleIds?: string[];
  }): Promise<User> {
    // Check if the user already exists
    const existingUser = await this.userModel
      .findOne({
        email: userData.email,
      })
      .exec();

    if (existingUser) {
      throw new BadRequestException(
        `User with email '${userData.email}' already exists`,
      );
    }

    // Validate role IDs if provided
    if (userData.roleIds && userData.roleIds.length > 0) {
      const roles = await this.roleModel
        .find({ _id: { $in: userData.roleIds } })
        .exec();

      if (roles.length !== userData.roleIds.length) {
        const foundIds = roles.map((r) => r._id.toString());
        const notFoundIds = userData.roleIds.filter(
          (id) => !foundIds.includes(id),
        );
        throw new BadRequestException(
          `Some role IDs were not found: ${notFoundIds.join(', ')}`,
        );
      }
    }

    const user = new this.userModel({
      email: userData.email,
      hashPassword: await this.cryptoService.hashPassword(userData.password),
      roles: userData.roleIds ?? [],
    });

    return await user.save();
  }

  async findAll(
    pageOptions: PagingQueryOptions,
  ): Promise<PagingResponse<UserWithPopulateRoleAndPermission>> {
    const [sortField, sortOrder] = pageOptions.mongoSortParams;

    const [users, itemCount] = await Promise.all([
      this.userModel
        .find()
        .populate<{ roles: RoleWWithPopulatePermission[] }>({
          path: 'roles',
          populate: {
            path: 'permissions',
          },
        })
        .sort({ [sortField]: sortOrder })
        .skip(pageOptions.skip)
        .limit(pageOptions.limit)
        .exec(),
      this.userModel.countDocuments().exec(),
    ]);

    const pageMetaDto = new PagingResponseMeta({
      page: pageOptions.page,
      limit: pageOptions.limit,
      itemCount,
    });

    return new PagingResponse(users, pageMetaDto);
  }

  async findOne(id: string): Promise<UserWithPopulateRoleAndPermission> {
    const user = await this.userModel
      .findById(id)
      .populate<{ roles: RoleWWithPopulatePermission[] }>({
        path: 'roles',
        populate: {
          path: 'permissions',
        },
      })
      .exec();

    if (!user) {
      throw new BadRequestException(`User with ID "${id}" not found`);
    }

    return user;
  }

  // NEEDED FOR LOCAL AUTHENTICATION STRATEGY
  async findByEmail(email: string): Promise<UserWithPopulateRoleAndPermission> {
    const user = await this.userModel
      .findOne({ email })
      .populate<{ roles: RoleWWithPopulatePermission[] }>({
        path: 'roles',
        populate: {
          path: 'permissions',
        },
      })
      .exec();

    if (!user) {
      throw new BadRequestException(`User with email '${email}' not found`);
    }

    return user;
  }

  async update(
    id: string,
    userData: Partial<User> & { password?: string },
    roleIds?: string[],
  ): Promise<UserWithPopulateRoleAndPermission> {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new BadRequestException(`User with ID "${id}" not found`);
    }

    // If password is included in userData, hash it
    if (userData.password !== undefined) {
      userData.hashPassword = await this.cryptoService.hashPassword(
        userData.password,
      );
    }
    delete userData.password; // Remove the plaintext password

    // Validate role IDs if provided
    if (roleIds) {
      const roles = await this.roleModel.find({ _id: { $in: roleIds } }).exec();

      if (roles.length !== roleIds.length) {
        const foundIds = roles.map((r) => r._id.toString());
        const notFoundIds = roleIds.filter((id) => !foundIds.includes(id));
        throw new BadRequestException(
          `Some role IDs were not found: ${notFoundIds.join(', ')}`,
        );
      }

      userData.roles = roleIds.map((id) => new mongoose.Types.ObjectId(id));
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, userData, { new: true })
      .populate<{ roles: RoleWWithPopulatePermission[] }>({
        path: 'roles',
        populate: {
          path: 'permissions',
        },
      })
      .exec();

    if (!updatedUser) {
      throw new BadRequestException(`User with ID "${id}" not found`);
    }

    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new BadRequestException(`User with ID "${id}" not found`);
    }
  }

  async addRoles(
    userId: string,
    roleIds: string[],
  ): Promise<UserWithPopulateRoleAndPermission> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new BadRequestException(`User with ID "${userId}" not found`);
    }

    // Validate role IDs
    const roles = await this.roleModel.find({ _id: { $in: roleIds } }).exec();

    if (roles.length !== roleIds.length) {
      const foundIds = roles.map((r) => r._id.toString());
      const notFoundIds = roleIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(
        `Some role IDs were not found: ${notFoundIds.join(', ')}`,
      );
    }

    // Add new roles (avoiding duplicates)
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $addToSet: { roles: { $each: roleIds } } },
        { new: true },
      )
      .populate<{ roles: RoleWWithPopulatePermission[] }>({
        path: 'roles',
        populate: {
          path: 'permissions',
        },
      })
      .exec();
    if (!updatedUser) {
      throw new BadRequestException(`User with ID "${userId}" not found`);
    }
    return updatedUser;
  }

  async removeRoles(
    userId: string,
    roleIds: string[],
  ): Promise<UserWithPopulateRoleAndPermission> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { roles: { $in: roleIds } } },
        { new: true },
      )
      .populate<{ roles: RoleWWithPopulatePermission[] }>({
        path: 'roles',
        populate: {
          path: 'permissions',
        },
      })
      .exec();

    if (!updatedUser) {
      throw new BadRequestException(`User with ID "${userId}" not found`);
    }

    return updatedUser;
  }

  // This function for auth service to get user permissions
  async getUserJwtPayload(id: string): Promise<JwtPayload> {
    const user = await this.userModel
      .findById(id)
      .populate<{ roles: RoleWWithPopulatePermission[] }>({
        path: 'roles',
        populate: {
          path: 'permissions',
        },
      })
      .exec();

    if (!user) {
      throw new BadRequestException(`User with ID "${id}" not found`);
    }

    if (user.roles.length === 0) {
      return {
        sub: user._id.toString(),
        permissions: [],
      };
    }

    // Use a Set to collect unique permissions
    const uniquePermissions = new Set<string>();

    // Process each role's permissions
    user.roles.forEach((role) => {
      if (role.permissions.length > 0) {
        role.permissions.forEach((permission) => {
          // Create a unique identifier for this permission
          const permKey = `${permission.privilege}:${permission.operation}`;
          uniquePermissions.add(permKey);
        });
      }
    });

    const permissions: AccessControl[] = Array.from(uniquePermissions).map(
      (permString) => {
        const [privilege, operation] = permString.split(':');
        const accessControl: AccessControl = {
          privilege: privilege as Privilege,
          operation: operation as Operation,
        };
        return accessControl;
      },
    );

    // Convert the unique permissions back to AccessControl objects
    return {
      sub: user._id.toString(),
      permissions,
    };
  }
}
