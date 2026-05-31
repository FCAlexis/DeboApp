import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PersonsComponent } from './features/persons/persons.component';
import { PersonDetailComponent } from './features/persons/person-detail.component';
import { PurchaseComponent } from './features/purchases/purchase.component';
import { PaymentComponent } from './features/payments/payment.component';
import { PlaceholderComponent } from './core/components/placeholder.component';
import { BackupComponent } from './features/backup/backup.component';
import { DebtsComponent } from './features/debts/debts.component';
import { PaymentsListComponent } from './features/payments/payments-list.component';

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
  },
  {
    path: 'backup',
    component: BackupComponent
  },
  // Rutas en Desarrollo (Placeholder)
  {
    path: 'debts',
    component: DebtsComponent
  },
  {
    path: 'payments',
    component: PaymentsListComponent
  },
  { path: 'calendar', component: PlaceholderComponent },
  { path: 'reports', component: PlaceholderComponent },
  { path: 'settings', component: PlaceholderComponent },
  { path: 'help', component: PlaceholderComponent },
];
