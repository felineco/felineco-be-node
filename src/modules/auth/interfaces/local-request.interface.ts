import { User } from 'src/modules/users/entities/user.entity';

export interface RequestWithUser extends Request {
  user: User; // Or a more specific user type
}
