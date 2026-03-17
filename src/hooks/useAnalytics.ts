import { useState, useEffect } from "react";
import { supabase, isConfigured } from "@/lib/supabase";
import { useUser } from "@clerk/react";
import { LedgerEntry } from "@/types/entry";

export interface DailyTotal {
  date: string;
  pending: number;
  paid: number;
  total: number;
}

export const useAnalytics = () => {
  const { user } = useUser();
  const [data, setData] = useState<DailyTotal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!isConfigured || !user) {
        setLoading(false);
        return;
      }

      try {
        const { data: snapshots, error } = await supabase
          .from("daily_snapshots")
          .select("date, data")
          .eq("user_id", user.id)
          .order("date", { ascending: true })
          .limit(30);

        if (error) throw error;

        const totals: DailyTotal[] = (snapshots || []).map(snap => {
          const entries = snap.data as LedgerEntry[];
          const pending = entries.filter(e => e.status === "Pending").reduce((s, e) => s + e.amount, 0);
          const paid = entries.filter(e => e.status === "Paid").reduce((s, e) => s + e.amount, 0);
          return {
            date: snap.date,
            pending,
            paid,
            total: pending + paid
          };
        });

        setData(totals);
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  return { data, loading };
};
