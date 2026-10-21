import { useState, useCallback, useMemo, useEffect } from "react";
import { format, subDays } from "date-fns";
import { supabase, isConfigured } from "@/lib/supabase";
import { toast } from "sonner";
import { useUser } from "@clerk/react";

export function checkIsDateLocked(date: string): boolean {
  // A date is locked if current time is >= (date + 1 day) at 03:00 AM
  const now = new Date();
  const dateObj = new Date(date + "T00:00:00");
  const lockTime = new Date(dateObj);
  lockTime.setDate(lockTime.getDate() + 1);
  lockTime.setHours(3, 0, 0, 0);
  return now >= lockTime;
}

export function useDateLock(viewDate: string) {
  const { user } = useUser();
  const userId = user?.id || "local";
  const UNLOCK_KEY = `unlocked:${userId}`;

  const [forceUnlocked, setForceUnlocked] = useState<Record<string, number>>(() => {
    try {
      const local = localStorage.getItem(UNLOCK_KEY);
      return local ? JSON.parse(local) : {};
    } catch {
      return {};
    }
  });

  // Sync unlocked dates from Supabase on mount
  useEffect(() => {
    if (!isConfigured || !user?.id) return;

    let isMounted = true;
    const fetchUnlockedDates = async () => {
      try {
        const { data: unlocked } = await supabase
          .from("unlocked_dates")
          .select("*")
          .eq("user_id", user.id)
          .gt("expires_at", Date.now());

        if (unlocked && isMounted) {
          const remoteMap: Record<string, number> = {};
          unlocked.forEach((u) => {
            remoteMap[u.date] = Number(u.expires_at);
          });

          setForceUnlocked((prev) => {
            const next = { ...prev, ...remoteMap };
            localStorage.setItem(UNLOCK_KEY, JSON.stringify(next));
            return next;
          });
        }
      } catch (err) {
        console.warn("Failed to sync unlocked dates from Supabase:", err);
      }
    };

    fetchUnlockedDates();
    return () => {
      isMounted = false;
    };
  }, [user?.id, UNLOCK_KEY]);

  const isLocked = useMemo(() => {
    const expiration = forceUnlocked[viewDate];
    if (expiration && Date.now() < expiration) return false;
    return checkIsDateLocked(viewDate);
  }, [viewDate, forceUnlocked]);

  const saveUnlockState = useCallback(
    async (date: string, expiresAt: number | null) => {
      setForceUnlocked((prev) => {
        const next = { ...prev };
        if (expiresAt === null) {
          delete next[date];
        } else {
          next[date] = expiresAt;
        }
        localStorage.setItem(UNLOCK_KEY, JSON.stringify(next));
        return next;
      });

      if (isConfigured && user?.id) {
        try {
          if (expiresAt === null) {
            await supabase
              .from("unlocked_dates")
              .delete()
              .eq("date", date)
              .eq("user_id", user.id);
          } else {
            const { data: existing } = await supabase
              .from("unlocked_dates")
              .select("id")
              .eq("date", date)
              .eq("user_id", user.id)
              .maybeSingle();

            if (existing) {
              await supabase
                .from("unlocked_dates")
                .update({ expires_at: expiresAt })
                .eq("date", date)
                .eq("user_id", user.id);
            } else {
              await supabase.from("unlocked_dates").insert({
                date,
                expires_at: expiresAt,
                user_id: user.id,
                username:
                  user.username || user.firstName || user.fullName || "Guest",
              });
            }
          }
        } catch (err) {
          console.error("Failed to persist unlock state to Supabase:", err);
        }
      }
    },
    [user, UNLOCK_KEY]
  );

  const unlockDate = useCallback(
    async (date: string, password?: string, hours: number = 1) => {
      const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
      if (!adminPassword) {
        toast.error("Admin password not configured in environment (VITE_ADMIN_PASSWORD)");
        return false;
      }

      if (password === adminPassword) {
        const expiration = Date.now() + hours * 3600000;
        await saveUnlockState(date, expiration);
        toast.success(`Date unlocked for ${hours} hour${hours > 1 ? "s" : ""}`);
        return true;
      } else {
        toast.error("Incorrect password");
        return false;
      }
    },
    [saveUnlockState]
  );

  const lockDate = useCallback(
    async (date: string, password?: string) => {
      const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
      if (!adminPassword) {
        toast.error("Admin password not configured in environment (VITE_ADMIN_PASSWORD)");
        return false;
      }

      if (password === adminPassword) {
        await saveUnlockState(date, null);
        toast.success("Date locked successfully");
        return true;
      } else {
        toast.error("Incorrect password");
        return false;
      }
    },
    [saveUnlockState]
  );

  return {
    isLocked,
    unlockedUntil: forceUnlocked[viewDate],
    unlockDate,
    lockDate,
  };
}
