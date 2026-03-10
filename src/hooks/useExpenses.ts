import { useState, useEffect } from "react";
import { supabase, isConfigured } from "@/lib/supabase";
import { Expense } from "@/types/entry";
import { toast } from "sonner";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      
      if (!isConfigured) {
        const local = localStorage.getItem("expense_data");
        if (local) setExpenses(JSON.parse(local));
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
      // Backup to local
      localStorage.setItem("expense_data", JSON.stringify(data || []));
    } catch (err: any) {
      console.error("Error fetching expenses:", err.message);
      const local = localStorage.getItem("expense_data");
      if (local) setExpenses(JSON.parse(local));
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expense: Omit<Expense, "id" | "createdAt" | "updatedAt">) => {
    const localExp: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (!isConfigured) {
        const updated = [localExp, ...expenses];
        setExpenses(updated);
        localStorage.setItem("expense_data", JSON.stringify(updated));
        toast.success("Expense saved locally");
        return localExp;
      }

      const { data: user } = await supabase.auth.getUser();
      const newExp = {
        ...expense,
        user_id: user?.user?.id,
      };

      const { data, error } = await supabase
        .from("expenses")
        .insert([newExp])
        .select();

      if (error) throw error;

      const saved = data[0];
      setExpenses([saved, ...expenses]);
      toast.success("Expense added and synced");
      
      localStorage.setItem("expense_data", JSON.stringify([saved, ...expenses]));
      return saved;
    } catch (err: any) {
      toast.error("Cloud sync failed. Saved locally.");
      const updated = [localExp, ...expenses];
      setExpenses(updated);
      localStorage.setItem("expense_data", JSON.stringify(updated));
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      if (isConfigured) {
        const { error } = await supabase.from("expenses").delete().eq("id", id);
        if (error) throw error;
      }

      const updated = expenses.filter(e => e.id !== id);
      setExpenses(updated);
      localStorage.setItem("expense_data", JSON.stringify(updated));
      toast.success("Expense deleted");
    } catch (err: any) {
      toast.error("Cloud delete failed. Deleted locally.");
      const updated = expenses.filter(e => e.id !== id);
      setExpenses(updated);
      localStorage.setItem("expense_data", JSON.stringify(updated));
    }
  };

  return {
    expenses,
    loading,
    addExpense,
    deleteExpense,
    refresh: fetchExpenses,
  };
}
