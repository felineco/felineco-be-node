// src/modules/roles/entities/role.entity.ts
import { TABLE_NAME } from 'src/common/enums/table-name.enum';
import { Permission } from 'src/modules/permissions/entities/permission.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity({ name: TABLE_NAME.ROLE })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  roleName: string;

  @ManyToMany(() => Permission, (permission) => permission.roles, {
    eager: true, // Set this to false for better performance
  })
  @JoinTable({
    name: TABLE_NAME.ROLE_PERMISSION_JOIN,
    joinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'permission_id',
      referencedColumnName: 'id',
    },
  })
  permissions: Permission[];

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
