import { JwtPayload } from './jwt-payload.interface';

export interface RequestWithJwtPayload extends Request {
  user: JwtPayload; // Or a more specific user type
}
