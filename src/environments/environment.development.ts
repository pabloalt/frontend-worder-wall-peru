import { Environment } from './environment.interface';

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:7211/api',
  adminToken: 'wonderwall-dev-token-2026',
  users: [
    { name: 'Pedro Cumpa',      email: 'cumpaatoche.pedro@gmail.com',          password: 'Torta@Pedro1' },
    { name: 'Diana Fuster',     email: 'dfuster.guerra@gmail.com',              password: 'Torta@Juanca123' },
    { name: 'Pablo Altamirano', email: 'pabloenriquealtamirano.28@gmail.com',   password: 'Torta@Pablo1' },
    { name: 'Admin Wonderwall', email: 'somos.wonderwall@gmail.com',            password: 'Torta@Admin1' },
  ]
};
