export interface JwtPayload {
  sub: string;
  email: string;
  role: 'admin' | 'student';
  isActive: boolean;
  iat?: number;
  exp?: number;
  hmac?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'admin' | 'student';
  isActive: boolean;
}
