export type Role = 'admin' | 'volunteer' | 'organization';

export interface UserJWT {
  id: number;
  role: Role;
}
