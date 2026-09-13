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
  quantity: number;
  amount: string;
}

export type InvoiceItemInput = Omit<InvoiceItem, "id">;

export interface Invoice {
  id: number;
  date: string;
  customer_name: string;
  amount_received: string;
  items: InvoiceItem[];
  total: string;
  balance: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceInput {
  date: string;
  customer_name: string;
  amount_received: string;
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

export interface ImportResult {
  batch_id: number;
  year: number;
  month: number;
  filename: string;
  days_created: number;
  days_updated: number;
  days_unchanged: number;
  car_entries_written: number;
  expenses_written: number;
  puc_entries_written: number;
  day_closings_written: number;
  skipped_credit_rows: number;
  notes: string[];
}

export interface ImportBatch {
  id: number;
  year: number;
  month: number;
  filename: string;
  days_created: number;
  days_updated: number;
  days_unchanged: number;
  created_at: string;
}

export interface LabelCount {
  label: string;
  count: number;
}

export interface DayCount {
  date: string;
  count: number;
}

export interface MonthCount {
  month: number;
  count: number | null;
}

export interface DashboardSummary {
  year: number;
  month: number;
  jobs: number;
  days_recorded: number;
  jobs_per_day: number;
  vehicles: number;
  unspecified_services: number;
  busiest: DayCount | null;
  quietest: DayCount | null;
  monthly: MonthCount[];
  daily: DayCount[];
  services: LabelCount[];
  weekday: LabelCount[];
  top_vehicles: LabelCount[];
  accounts: LabelCount[];
  repeat_visits: LabelCount[];
  available_months: string[];
  restricted: boolean;
}

export interface CarEntryPage {
  items: CarEntry[];
  total: number;
  has_more: boolean;
}
