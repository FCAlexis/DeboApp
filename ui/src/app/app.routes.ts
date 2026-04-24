import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PersonsComponent } from './features/persons/persons.component';
import { PurchaseComponent } from './features/purchases/purchase.component';
import { PersonDetailComponent } from './features/persons/person-detail.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'persons',
    component: PersonsComponent
  },
  {
    path: 'purchase',
    component: PurchaseComponent
  },
  {
    path: 'person/:id',
    component: PersonDetailComponent
  }
];
