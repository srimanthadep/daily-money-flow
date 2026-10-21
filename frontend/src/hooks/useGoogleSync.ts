import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useUser } from "@clerk/react";

export function useGoogleSync() {
  const { user } = useUser();
  const [isSyncing, setIsSyncing] = useState(false);

  const syncToSheets = async (date: string) => {
    if (!user) {
      toast.error("You must be logged in to sync");
      return;
    }

    setIsSyncing(true);
    const loadingToast = toast.loading(`Syncing ${date} to Google Sheets...`);

    try {
      const { data, error } = await supabase.functions.invoke('sync-to-sheets', {
        body: { date, user_id: user.id },
      });

      if (error) {
        // Handle specific Edge Function errors
        const errorData = await error.context?.json();
        throw new Error(errorData?.error || error.message || "Unknown sync error");
      }

      toast.success(data.message, { id: loadingToast });
    } catch (err: any) {
      console.error("Sync error:", err);
      toast.error(err.message || "Failed to sync to Google Sheets", { id: loadingToast });
    } finally {
      setIsSyncing(false);
    }
  };

  return { syncToSheets, isSyncing };
}
