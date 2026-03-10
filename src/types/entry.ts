<<<<<<< HEAD
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
=======
export interface FinancialEntry {
  id: string;
  name: string;
  amount: number;
  category: string;
  notes: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  deleted?: boolean;
}

export const CATEGORIES = [
  "Income",
  "Expense",
  "Investment",
  "Transfer",
  "Loan",
  "Savings",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];
>>>>>>> c858d41a280eb1830d0b49e066a0a7ae053c50cc
