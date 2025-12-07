import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { Register } from './register/register';
import { DashboardComponent } from './dashboard/dashboard';
import { AuthGuard } from './guards/auth.guard';
import { Process } from './process/process';
import { Subprocess } from './subprocess/subprocess';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/login', 
    pathMatch: 'full' 
  },

  { 
    path: 'login', 
    component: LoginComponent,
    data: { title: 'Login' }   // 👈 ADDED
  },

  { 
    path: 'register', 
    component: Register,
    data: { title: 'Create Account' }  // 👈 ADDED
  },

   { path: 'dashboard',
     component: DashboardComponent,
     canActivate: [AuthGuard],
    data: { title: 'DashBoard' }
   },

  { path: 'process',
    component: Process, 
    canActivate: [AuthGuard],
    data: { title: 'Process Management' }
  },
  { path: 'subprocess', 
    component: Subprocess, 
    canActivate: [AuthGuard],
    data: { title: 'Process Management' }}
];

