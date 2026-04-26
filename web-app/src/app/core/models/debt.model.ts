export interface Person {
  id: string;
  name: string;
  closingDay: number; // Día del mes de cierre (1-31)
  dueDay: number;     // Día del mes de vencimiento (1-31)
}

export interface Purchase {
  id: string;
  personId: string;
  description: string;
  totalCents: number;
  installmentCount: number;
  createdAt: Date;
}

export interface Installment {
  id: string;
  purchaseId: string;
  personId: string;
  number: number;
  amountCents: number;
  dueDate: Date;
}

export interface Payment {
  id: string;
  personId: string;
  amountCents: number;
  paymentDate: Date;
}

export interface PersonWithBalance extends Person {
  balance: number;
}
