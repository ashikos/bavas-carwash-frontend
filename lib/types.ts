export interface Customer {
  id: number;
  name: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export type CustomerInput = Omit<Customer, "id" | "created_at" | "updated_at">;

export interface CarEntry {
  id: number;
  date: string;
  car_model: string;
  reg_no: string;
  phone: string;
  service_type: string;
  amount_paid: string;
  amount_pending: string;
  created_at: string;
  updated_at: string;
}

export type CarEntryInput = Omit<CarEntry, "id" | "created_at" | "updated_at">;

export interface InvoiceItem {
  id: number;
  description: string;
  amount: string;
}

export type InvoiceItemInput = Omit<InvoiceItem, "id">;

export interface Invoice {
  id: number;
  date: string;
  customer_name: string;
  items: InvoiceItem[];
  total: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceInput {
  date: string;
  customer_name: string;
  items: InvoiceItemInput[];
}

export interface Expense {
  id: number;
  date: string;
  description: string;
  amount: string;
  created_at: string;
}

export type ExpenseInput = Omit<Expense, "id" | "created_at">;

export interface PucEntry {
  id: number;
  date: string;
  collection_amount: string;
  discount: string;
  created_at: string;
  updated_at: string;
}

export type PucEntryInput = Omit<PucEntry, "id" | "created_at" | "updated_at">;
