import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/formulario/formulario.component').then(m => m.FormularioComponent),
    title: 'Registrar Pedido'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then(m => m.LoginComponent),
    title: 'Iniciar sesión'
  },
  {
    path: 'registro-cliente',
    loadComponent: () =>
      import('./features/registro-cliente/registro-cliente.component').then(m => m.RegistroClienteComponent),
    title: 'Registrar datos de cliente'
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard'
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./features/pedidos/pedidos.component').then(m => m.PedidosComponent),
        title: 'Gestión de Pedidos'
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/clientes/clientes.component').then(m => m.ClientesComponent),
        title: 'Clientes'
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
