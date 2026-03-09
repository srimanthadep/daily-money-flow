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
