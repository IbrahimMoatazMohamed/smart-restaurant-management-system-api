import { Request } from 'express';

export interface UserPayload {
  userId: number;
  email: string;
  role: string;
}

export interface RequestWithUser extends Request {
  user: UserPayload;
}
