export interface AdminUser {
  name: string;
  email: string;
  password: string;
}

export interface Environment {
  production: boolean;
  apiUrl: string;
  adminToken: string;
  users: AdminUser[];
}
