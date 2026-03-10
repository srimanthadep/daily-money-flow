export interface LedgerEntry {
  id: string;
  name: string;
  amount: number;
  status: "Pending" | "Paid";
  notes: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  paidOn?: string;
  user_id?: string; // For Supabase
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user_id?: string; // For Supabase
}

export type DaySnapshot = {
  date: string;
  entries: LedgerEntry[];
  savedAt: string;
};

export const CATEGORIES = ["Pending", "Paid"] as const;
export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Other",
] as const;
