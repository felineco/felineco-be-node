// src/modules/permissions/entities/permission.entity.ts
import { Action, Privilege } from 'src/common/enums/permission.enum';
import { TABLE_NAME } from 'src/common/enums/table-name.enum';
import { Role } from 'src/modules/roles/entities/role.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';

@Entity({ name: TABLE_NAME.PERMISSION })
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: Privilege,
  })
  privilege: Privilege; // The resource/entity being protected (e.g., 'user', 'article')

  @Column({
    type: 'enum',
    enum: Action,
  })
  action: Action; // The action being performed on the privilege

  @ManyToMany(() => Role, (role) => role.permissions)
  roles?: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
