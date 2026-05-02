import { Environment } from './environment.interface';

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:7211/api',
  bypassAuth: true,   // solo desarrollo: permite acceder a /admin sin login
  adminToken: 'wonderwall-dev-token-2026'  // Token de admin para desarrollo local
};
