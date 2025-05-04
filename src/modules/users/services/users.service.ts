// src/modules/users/services/users.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import {
  PagingQueryOptions,
  toTypeOrmSortOrder,
} from '../../../common/dtos/page-query-options.dto';
import {
  PagingResponseMeta,
  PagingResponse,
} from '../../../common/dtos/page-response.dto';
import { TABLE_NAME } from 'src/common/enums/table-name.enum';
import { Role } from 'src/modules/roles/entities/role.entity';
import { CryptoService } from 'src/common/services/crypto.service';
import { AccessControl } from 'src/common/decorators/authorization-policy.decorator.ts';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    private cryptoService: CryptoService,
  ) {}

  async create(userData: {
    email: string;
    password: string;
    roleIds?: string[];
  }): Promise<User> {
    // Check if the user already exists
    const exist = await this.usersRepository.exists({
      where: { email: userData.email },
    });
    if (exist) {
      throw new BadRequestException(
        `User with email '${userData.email}' already exists`,
      );
    }

    const user = this.usersRepository.create({
      email: userData.email,
      hashPassword: await this.cryptoService.hashPassword(userData.password),
    });

    // If role IDs are provided, fetch and assign them
    if (userData.roleIds && userData.roleIds.length > 0) {
      const roles = await this.rolesRepository.find({
        where: { id: In(userData.roleIds) },
      });

      const foundIdsSet = new Set(roles.map((r) => r.id));
      const notFoundIds = userData.roleIds.filter((id) => !foundIdsSet.has(id));

      if (notFoundIds.length > 0) {
        throw new BadRequestException(
          `Some role IDs were not found: ${notFoundIds.join(', ')}`,
        );
      }

      user.roles = roles;
    }

    return this.usersRepository.save(user);
  }

  async findAll(
    pageOptions: PagingQueryOptions,
  ): Promise<PagingResponse<User>> {
    const queryBuilder = this.usersRepository.createQueryBuilder(
      TABLE_NAME.USER,
    );

    // Join roles
    queryBuilder.leftJoinAndSelect(`${TABLE_NAME.USER}.roles`, 'roles');

    const [sortField, sortOrder] = pageOptions.sortParams;
    queryBuilder
      .orderBy(`${TABLE_NAME.USER}.${sortField}`, toTypeOrmSortOrder(sortOrder))
      .skip(pageOptions.skip)
      .take(pageOptions.limit);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PagingResponseMeta({
      page: pageOptions.page,
      limit: pageOptions.limit,
      itemCount,
    });

    return new PagingResponse(entities, pageMetaDto);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new BadRequestException(`User with ID "${id}" not found`);
    }

    return user;
  }

  // NEEDED FOR LOCAL AUTHENTICATION STRATEGY
  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException(`User with email '${email}' not found`);
    }

    return user;
  }

  async update(
    id: string,
    userData: DeepPartial<User> & { password?: string },
    roleIds?: string[],
  ): Promise<User> {
    const user = await this.findOne(id);

    // If password is included in userData, hash it
    if (userData.password) {
      userData.hashPassword = await this.cryptoService.hashPassword(
        userData.password,
      );
    }
    delete userData.password; // Remove the plaintext password

    // Update basic user properties
    const updatedUser = this.usersRepository.merge(user, userData);

    // If role IDs are provided, update roles
    if (roleIds) {
      const roles = await this.rolesRepository.find({
        where: { id: In(roleIds) },
      });

      const foundIdsSet = new Set(roles.map((r) => r.id));
      const notFoundIds = roleIds.filter((id) => !foundIdsSet.has(id));

      if (notFoundIds.length > 0) {
        throw new BadRequestException(
          `Some role IDs were not found: ${notFoundIds.join(', ')}`,
        );
      }

      updatedUser.roles = roles;
    }

    return this.usersRepository.save(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);

    // Clear roles association before removing
    user.roles = [];
    await this.usersRepository.save(user);

    await this.usersRepository.remove(user);
  }

  async addRoles(userId: string, roleIds: string[]): Promise<User> {
    const user = await this.findOne(userId);
    const newRoles = await this.rolesRepository.find({
      where: { id: In(roleIds) },
    });

    const foundIdsSet = new Set(newRoles.map((r) => r.id));
    if (newRoles.length !== roleIds.length) {
      const notFoundIds = roleIds.filter((id) => !foundIdsSet.has(id));

      if (notFoundIds.length > 0) {
        throw new BadRequestException(
          `Some role IDs were not found: ${notFoundIds.join(', ')}`,
        );
      }
    }

    // Keep existing roles that aren't in the new set
    const existingRoles = user.roles.filter((r) => !foundIdsSet.has(r.id));

    // Combine existing roles with new ones
    user.roles = [...existingRoles, ...newRoles];
    return await this.usersRepository.save(user);
  }

  async removeRoles(userId: string, roleIds: string[]): Promise<User> {
    const user = await this.findOne(userId);

    const excludeRoleSet = new Set(roleIds);

    // Filter out the roles to be removed
    user.roles = user.roles.filter((role) => !excludeRoleSet.has(role.id));

    return await this.usersRepository.save(user);
  }

  // This function for auth service to get user permissions
  async getUserPermissions(id: string): Promise<AccessControl[]> {
    // Find the user with their roles and nested permissions
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: {
        roles: {
          permissions: true,
        },
      },
    });

    if (!user) {
      throw new BadRequestException(`User with ID "${id}" not found`);
    }

    if (!user.roles || user.roles.length === 0) {
      return [];
    }

    // Use a Set to collect unique permissions
    const uniquePermissions = new Set<string>();

    // Process each role's permissions
    user.roles.forEach((role) => {
      if (role.permissions) {
        role.permissions.forEach((permission) => {
          // Create a unique identifier for this permission
          const permKey = `${permission.privilege}:${permission.action}`;
          uniquePermissions.add(permKey);
        });
      }
    });

    // Convert the unique permissions back to RoleAction objects
    return Array.from(uniquePermissions).map((permString) => {
      const [privilege, action] = permString.split(':');
      return {
        privilege,
        action,
      } as AccessControl;
    });
  }
}
