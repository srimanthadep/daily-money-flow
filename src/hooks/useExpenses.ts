import { useState, useEffect } from "react";
import { supabase, isConfigured } from "@/lib/supabase";
import { Expense } from "@/types/entry";
import { toast } from "sonner";
import { useUser } from "@clerk/react";

export function useExpenses() {
  const { user } = useUser();
  const userId = user?.id || 'local';
  const STORAGE_KEY = `expense_data_${userId}`;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      
      if (!isConfigured || !user) {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) setExpenses(JSON.parse(local));
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
      // Backup to local
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data || []));
    } catch (err: any) {
      console.error("Error fetching expenses:", err.message);
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) setExpenses(JSON.parse(local));
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expense: Omit<Expense, "id" | "createdAt" | "updatedAt">) => {
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const localExp: Expense = {
      ...expense,
      id: tempId,
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic Update
    const previousExpenses = [...expenses];
    setExpenses(prev => [localExp, ...prev]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([localExp, ...expenses]));

    if (!isConfigured || !user) {
      toast.success("Expense saved locally");
      return localExp;
    }

    try {
      const { data, error } = await supabase
        .from("expenses")
        .insert([{ 
          ...expense, 
          user_id: user.id,
          username: user.username || user.firstName || user.fullName || 'Guest'
        }])
        .select();

      if (error) throw error;

      const saved = data[0];
      // Replace temp entry with server entry
      setExpenses(prev => prev.map(e => e.id === tempId ? saved : e));
      localStorage.setItem(STORAGE_KEY, JSON.stringify([saved, ...previousExpenses]));
      toast.success("Expense added");
      return saved;
    } catch (err: any) {
      console.error("Supabase Save Error:", err);
      // Rollback on error
      setExpenses(previousExpenses);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(previousExpenses));
      toast.error("Sync failed. Transaction reverted.");
    }
  };

  const deleteExpense = async (id: string) => {
    const previousExpenses = [...expenses];
    setExpenses(prev => prev.filter(e => e.id !== id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses.filter(e => e.id !== id)));

    if (!isConfigured || !user) {
      toast.success("Deleted locally");
      return;
    }

    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      toast.success("Expense deleted");
    } catch (err: any) {
      console.error("Supabase Delete Error:", err);
      // Rollback on error
      setExpenses(previousExpenses);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(previousExpenses));
      toast.error("Delete failed. Reverted.");
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
