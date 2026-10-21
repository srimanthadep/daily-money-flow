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
  isRecurring?: boolean;
  recurringFrequency?: "Daily" | "Weekly" | "Monthly";
}

export type DaySnapshot = {
  date: string;
  entries: LedgerEntry[];
  savedAt: string;
};

export const CATEGORIES = ["Pending", "Paid"] as const;
