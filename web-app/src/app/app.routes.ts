import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PersonsComponent } from './features/persons/persons.component';
import { PersonDetailComponent } from './features/persons/person-detail.component';
import { PurchaseComponent } from './features/purchases/purchase.component';
import { PaymentComponent } from './features/payments/payment.component';

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
    path: 'person/:id',
    component: PersonDetailComponent
  },
  {
    path: 'purchase',
    component: PurchaseComponent
  },
  {
    path: 'payment/:id',
    component: PaymentComponent
  }
];
