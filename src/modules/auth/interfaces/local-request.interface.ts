import { UserWithPopulateRoleAndPermission } from 'src/modules/users/schemas/user.schema';

export interface RequestWithUser extends Request {
  user: UserWithPopulateRoleAndPermission; // Or a more specific user type
}
