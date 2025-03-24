import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MapComponent } from './components/map/map.component';
import { ReportsComponent } from './components/reports/reports.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { AuthGuard } from './services/auth.guard';
import { StatusComponent } from './components/status/status.component';
import { ConfirmEmailComponent } from './components/confirmation-email/confirm-email.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'status', component: StatusComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, },
  { path: 'map', component: MapComponent, },
  { path: 'reports', component: ReportsComponent, },
  { path: 'user-profile', component: UserProfileComponent },
  { path: 'register', component: SignupComponent },
  { path: 'confirm', component: ConfirmEmailComponent },
  { path: '**', redirectTo: '/login' }
];