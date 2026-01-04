import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DeployComponent } from './pages/deploy/deploy.component';
// ... imports ...
import { authGuard } from './guards/auth.guard';
import { ContainersComponent } from './pages/containers/containers.component';
import { MetricsComponent } from './pages/metrics/metrics.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  
  // Rutas protegidas
  { path: 'deploy', component: DeployComponent, canActivate: [authGuard] },
  { path: 'containers', component: ContainersComponent, canActivate: [authGuard] },
  { path: 'metrics', component: MetricsComponent, canActivate: [authGuard] },
  
  { path: '', redirectTo: 'deploy', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];