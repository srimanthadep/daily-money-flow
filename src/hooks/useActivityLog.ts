import { useState, useCallback, useEffect } from "react";
import { supabase, isConfigured } from "@/lib/supabase";
import { useUser } from "@clerk/react";

export type ActivityAction = 
  | "LOGIN" 
  | "ENTRY_ADDED" 
  | "ENTRY_UPDATED" 
  | "ENTRY_DELETED" 
  | "ENTRY_RESTORED"
  | "ENTRY_TRASHED" 
  | "MARKED_PAID" 
  | "MARKED_PENDING" 
  | "EXPENSE_ADDED" 
  | "EXPENSE_DELETED";

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  username: string;
  action: ActivityAction;
  details: string;
  timestamp: string;
}

export function useActivityLog() {
  const { user, isLoaded } = useUser();
  const userId = user?.id;
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    // Wait for Clerk to load at least once
    if (!isLoaded) return;
    
    if (!isConfigured || !userId) {
      console.warn("Skipping fetch: Supabase not configured or User not logged in.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })
        .limit(200);
      
      if (error) throw error;
      setLogs((data as ActivityLogEntry[]) || []);
    } catch (err: any) {
      console.error("Failed to load logs from Supabase:", err.message);
    } finally {
      setLoading(false);
    }
  }, [isConfigured, userId, isLoaded]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const logActivity = useCallback(async (action: ActivityAction, details: string) => {
    if (!isLoaded || !isConfigured || !userId) {
      console.warn("Cannot log activity: User not loaded or Supabase not ready.");
      return;
    }

    const newLog = {
      user_id: userId,
      username: user?.username || user?.firstName || user?.fullName || "Guest",
      action,
      details,
      timestamp: new Date().toISOString(),
    };

    try {
      // Direct database insert
      const { error } = await supabase.from("activity_logs").insert([newLog]);
      
      if (error) {
        console.error("Supabase insert error:", error.message, error.details);
      } else {
        // Only refresh logs locally after successful server confirmation
        fetchLogs();
      }
    } catch (e) {
      console.error("Critical failure during activity logging:", e);
    }
  }, [isConfigured, userId, user, isLoaded, fetchLogs]);

  return { 
    logs, 
    logActivity, 
    loading,
    refresh: fetchLogs 
  };
}
