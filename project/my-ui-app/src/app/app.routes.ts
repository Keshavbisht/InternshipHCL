import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { Register } from './register/register';
import { DashboardComponent } from './dashboard/dashboard';
import { AuthGuard } from './guards/auth.guard';
import { Process } from './process/process';
import { Subprocess } from './subprocess/subprocess';
import { LayoutComponent } from './layout/layout'; // 👈 Import Layout
import { AssignedComponent } from './assigned/assigned';
import { ObjectiveComponent } from './objective/objective';

export const routes: Routes = [
  // Default redirect
  { 
    path: '', 
    redirectTo: '/login', 
    pathMatch: 'full' 
  },

  // Routes WITHOUT sidebar (Login & Register)
  { 
    path: 'login', 
    component: LoginComponent,
    data: { title: 'Login' }
  },

  { 
    path: 'register', 
    component: Register,
    data: { title: 'Create Account' }
  },

  // Routes WITH sidebar (Wrapped in Layout Component)
  {
    path: '',
    component: LayoutComponent,  // 👈 Layout wrapper
    canActivate: [AuthGuard],    // 👈 Protect all child routes
    children: [
      { 
        path: 'dashboard',
        component: DashboardComponent,
        data: { title: 'Dashboard' }
      },
      { 
        path: 'process',
        component: Process,
        data: { title: 'Process Management' }
      },
      { 
        path: 'subprocess',
        component: Subprocess,
        data: { title: 'SubProcess Management' }
      },
      { 
        path: 'objective',
        component: ObjectiveComponent,
        data: { title: 'Objective Management' }
      },
      { path: 'assigned', component: AssignedComponent ,
        data: { title: 'Assigned SOP' }
      }
    ]
  },

  // Fallback route
  { 
    path: '**', 
    redirectTo: '/login' 
  }
];