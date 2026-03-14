import { useState, useEffect, useCallback, useMemo } from "react";
import { LedgerEntry } from "@/types/entry";
import { format, subDays } from "date-fns";
import { SEED_DATA } from "@/lib/seedData";
import { arrayMove } from "@dnd-kit/sortable";
import { supabase, isConfigured } from "@/lib/supabase";
import { toast } from "sonner";
import { useUser } from "@clerk/react";

function getToday(): string {
  const now = new Date();
  // If current time is before 3 AM, we are still conceptually in the previous day
  if (now.getHours() < 3) {
    return format(subDays(now, 1), "yyyy-MM-dd");
  }
  return format(now, "yyyy-MM-dd");
}

function checkIsDateLocked(date: string): boolean {
  // A date is locked if current time is >= (date + 1 day) at 03:00 AM
  const now = new Date();
  const dateObj = new Date(date + "T00:00:00");
  const lockTime = new Date(dateObj);
  lockTime.setDate(lockTime.getDate() + 1);
  lockTime.setHours(3, 0, 0, 0);
  return now >= lockTime;
}

export function useEntries() {
  const { user } = useUser();
  const userId = user?.id || 'local';
  const SNAP = `snap:${userId}:`;
  const LATEST = `latest:${userId}`;
  const UNLOCK_KEY = `unlocked:${userId}`;

  const todayDate = getToday();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [trash, setTrash] = useState<LedgerEntry[]>([]);
  const [viewDate, setViewDate] = useState(todayDate);
  const [searchQuery, setSearchQuery] = useState("");
  const [snapDates, setSnapDates] = useState<string[]>([]);
  const [undoStack, setUndoStack] = useState<LedgerEntry[][]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isToday = viewDate === todayDate;

  const [forceUnlocked, setForceUnlocked] = useState<Record<string, number>>(() => {
    const local = localStorage.getItem(UNLOCK_KEY);
    return local ? JSON.parse(local) : {};
  });

  const isLocked = useMemo(() => {
    const expiration = forceUnlocked[viewDate];
    if (expiration && Date.now() < expiration) return false;
    return checkIsDateLocked(viewDate);
  }, [viewDate, forceUnlocked]);

  const saveUnlockState = async (date: string, expiresAt: number | null) => {
    setForceUnlocked(prev => {
      const next = { ...prev };
      if (expiresAt === null) {
        delete next[date];
      } else {
        next[date] = expiresAt;
      }
      localStorage.setItem(UNLOCK_KEY, JSON.stringify(next));
      return next;
    });

    if (isConfigured) {
      if (expiresAt === null) {
        await supabase.from("unlocked_dates").delete().eq("date", date).eq("user_id", user.id);
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
          await supabase
            .from("unlocked_dates")
            .insert({ date, expires_at: expiresAt, user_id: user.id });
        }
      }
    }
  };

  const unlockDate = useCallback(async (date: string, password?: string, hours: number = 1) => {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || "1234";
    if (password === adminPassword) {
      const expiration = Date.now() + (hours * 3600000);
      await saveUnlockState(date, expiration);
      toast.success(`Date unlocked for ${hours} hour${hours > 1 ? 's' : ''}`);
      return true;
    } else {
      toast.error("Incorrect password");
      return false;
    }
  }, [isConfigured]);

  const lockDate = useCallback(async (date: string, password?: string) => {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || "1234";
    if (password === adminPassword) {
      await saveUnlockState(date, null);
      toast.success("Date locked successfully");
      return true;
    } else {
      toast.error("Incorrect password");
      return false;
    }
  }, [isConfigured]);

  // ── Read / write helpers for Local Fallback ──────────────────────────────
  const readLocalSnap = (date: string): LedgerEntry[] | null => {
    const raw = localStorage.getItem(SNAP + date);
    return raw ? JSON.parse(raw) : null;
  };

  const getLocalSnapDates = (): string[] => {
    const dates: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(SNAP) && key !== LATEST) {
            dates.push(key.slice(SNAP.length));
        }
    }
    return dates;
  };

  // ── Initial Data Loading ────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      
      const loadFromStorage = async (date: string) => {
        if (isConfigured && user) {
          const { data } = await supabase
            .from("daily_snapshots")
            .select("data")
            .eq("date", date)
            .eq("user_id", user.id)
            .maybeSingle();
          
          if (data && data.data && (data.data as LedgerEntry[]).length > 0) return data.data as LedgerEntry[];

          // 1. If we don't have a snapshot, check if the Previous Day is locked
          const dateObj = new Date(date + "T00:00:00");
          const prevDateStr = format(subDays(dateObj, 1), "yyyy-MM-dd");
          const isPrevLocked = checkIsDateLocked(prevDateStr);

          // 2. If the previous day is NOT locked, this is a future or currently active date.
          if (!isPrevLocked) return [];

          // 3. Find historical data to carry over
          let sourceData: LedgerEntry[] = [];
          
          const { data: latestBefore } = await supabase
            .from("daily_snapshots")
            .select("date, data")
            .lt("date", date)
            .eq("user_id", user.id)
            .order("date", { ascending: false });
          
          if (latestBefore && latestBefore.length > 0) {
            const lockedSnap = latestBefore.find(s => checkIsDateLocked(s.date));
            if (lockedSnap && lockedSnap.data) {
              sourceData = lockedSnap.data as LedgerEntry[];
            }
          }

          if (sourceData.length === 0) {
            const localDates = getLocalSnapDates().filter(d => d < date).sort().reverse();
            for (const ld of localDates) {
              if (checkIsDateLocked(ld)) {
                const prevData = readLocalSnap(ld);
                if (prevData && prevData.length > 0) {
                  sourceData = prevData;
                  break;
                }
              }
            }
          }

          // Process recurring entries: Reset status to Pending if it's a new day
          if (sourceData.length > 0) {
            return sourceData.map(e => {
              if (e.isRecurring) {
                return { ...e, status: "Pending" as const, paidOn: undefined };
              }
              return e;
            });
          }
        }
        
        // Final Fallback
        if (date === todayDate && getLocalSnapDates().length === 0 && userId === 'local') {
          return SEED_DATA;
        }

        return [];
      };

      const result = await loadFromStorage(viewDate);
      setEntries(result);
      
      // Load snap dates once
      if (snapDates.length === 0 && isConfigured && user) {
        const { data: snaps } = await supabase
          .from("daily_snapshots")
          .select("date")
          .eq("user_id", user.id)
          .order("date", { ascending: false });
        if (snaps) setSnapDates(snaps.map(s => s.date));

        // Sync unlocked dates from Supabase
        const { data: unlocked } = await supabase
          .from("unlocked_dates")
          .select("*")
          .eq("user_id", user.id)
          .gt("expires_at", Date.now());
        
        if (unlocked) {
          const remoteMap: Record<string, number> = {};
          unlocked.forEach(u => remoteMap[u.date] = Number(u.expires_at));
          
          setForceUnlocked(prev => {
            const next = { ...prev, ...remoteMap };
            localStorage.setItem(UNLOCK_KEY, JSON.stringify(next));
            return next;
          });
        }
      } else if (snapDates.length === 0) {
        setSnapDates(Array.from(new Set([...getLocalSnapDates(), todayDate])).sort().reverse());
      }
      
      setIsLoading(false);
    };

    init();
  }, [viewDate, isConfigured]);

  // ── Sync to Cloud ───────────────────────────────────────────────────────
  const saveToCloud = async (date: string, data: LedgerEntry[]) => {
    localStorage.setItem(SNAP + date, JSON.stringify(data));
    localStorage.setItem(LATEST, date);

    if (!isConfigured || !user) return;

    try {
      // Check if a record exists first
      const { data: existing } = await supabase
        .from("daily_snapshots")
        .select("id")
        .eq("date", date)
        .eq("user_id", user.id)
        .maybeSingle();

      let error;
      if (existing) {
        // Update existing record
        ({ error } = await supabase
          .from("daily_snapshots")
          .update({ data })
          .eq("date", date)
          .eq("user_id", user.id));
      } else {
        // Insert new record
        ({ error } = await supabase
          .from("daily_snapshots")
          .insert({ date, data, user_id: user.id }));
      }

      if (error) {
        console.error("Supabase save error:", error.code, error.message, error.details, error.hint);
        toast.error(`Save failed: ${error.message}`);
        return;
      }

      if (!snapDates.includes(date)) {
        setSnapDates(prev => Array.from(new Set([...prev, date])).sort().reverse());
      }
    } catch (err) {
      console.error("Cloud save error:", err);
    }
  };

  // ── Persist entries when they change ────────────────────────────
  useEffect(() => {
    if (entries.length > 0) {
      const timer = setTimeout(() => {
        saveToCloud(viewDate, entries);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [entries, viewDate]);

  // ── Push to undo ──────────────────────────────────────────────────────
  const pushUndo = useCallback(() => {
    setUndoStack((stack) => [...stack.slice(-19), entries]);
  }, [entries]);

  // ── Filtered & sorted ─────────────────────────────────────────────────
  const sortedEntries = useMemo(() => {
    let list = [...entries].sort((a, b) => (a.order || 0) - (b.order || 0));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q))
      );
    }
    return list;
  }, [entries, searchQuery]);

  // ── CRUD ───────────────────────────────────────────────────────────────
  const addEntry = useCallback(async (data: { 
    name: string; 
    amount: number; 
    notes: string;
    isRecurring?: boolean;
    recurringFrequency?: "Daily" | "Weekly" | "Monthly";
  }) => {
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const maxOrder = entries.reduce((m, e) => Math.max(m, e.order || 0), 0);
    
    const newEntry: LedgerEntry = {
      id: tempId,
      ...data,
      status: "Pending",
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };

    const previousEntries = [...entries];
    setEntries((prev) => [...prev, newEntry]);
    
    try {
      if (isConfigured && user) {
        const { data: savedData, error } = await supabase
          .from("daily_snapshots")
          .select("data")
          .eq("date", viewDate)
          .eq("user_id", user.id)
          .maybeSingle();

        const currentData = savedData?.data ? (savedData.data as LedgerEntry[]) : previousEntries;
        const updatedData = [...currentData, newEntry];

        const { error: saveError } = await supabase
          .from("daily_snapshots")
          .upsert({ 
            date: viewDate, 
            data: updatedData, 
            user_id: user.id 
          }, { onConflict: 'date,user_id' });

        if (saveError) throw saveError;
      }
      toast.success("Added " + data.name);
    } catch (err) {
      console.error("Add error:", err);
      setEntries(previousEntries);
      toast.error("Failed to sync new entry");
    }
  }, [entries, isConfigured, user, viewDate]);

  const updateEntry = useCallback(async (id: string, updates: Partial<LedgerEntry>) => {
    const previousEntries = [...entries];
    const updatedEntries = entries.map((e) =>
      e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
    );
    setEntries(updatedEntries);

    try {
      if (isConfigured && user) {
        const { error } = await supabase
          .from("daily_snapshots")
          .upsert({ 
            date: viewDate, 
            data: updatedEntries, 
            user_id: user.id 
          }, { onConflict: 'date,user_id' });
        if (error) throw error;
      }
    } catch (err) {
      console.error("Update error:", err);
      setEntries(previousEntries);
      toast.error("Update failed to sync");
    }
  }, [entries, isConfigured, user, viewDate]);

  const deleteEntry = useCallback(async (id: string) => {
    const previousEntries = [...entries];
    const itemToDelete = entries.find(e => e.id === id);
    const updatedEntries = entries.filter((e) => e.id !== id);
    
    setEntries(updatedEntries);
    if (itemToDelete) setTrash((t) => [...t, itemToDelete]);

    try {
      if (isConfigured && user) {
        const { error } = await supabase
          .from("daily_snapshots")
          .upsert({ 
            date: viewDate, 
            data: updatedEntries, 
            user_id: user.id 
          }, { onConflict: 'date,user_id' });
        if (error) throw error;
      }
      toast.error("Entry moved to trash");
    } catch (err) {
      console.error("Delete error:", err);
      setEntries(previousEntries);
      if (itemToDelete) setTrash((t) => t.filter(x => x.id !== id));
      toast.error("Delete failed to sync");
    }
  }, [entries, isConfigured, user, viewDate]);

  const markPaid = useCallback((id: string) => {
    pushUndo();
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              status: "Paid" as const,
              paidOn: viewDate,
              updatedAt: new Date().toISOString(),
            }
          : e
      )
    );
    // Optimistic Save
    const updated = entries.map(e => 
      e.id === id ? { ...e, status: "Paid" as const, paidOn: viewDate } : e
    );
    saveToCloud(viewDate, updated);
    toast.success("Marked as Paid");
  }, [entries, pushUndo, viewDate]);

  const markPending = useCallback((id: string) => {
    pushUndo();
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              status: "Pending" as const,
              paidOn: undefined,
              updatedAt: new Date().toISOString(),
            }
          : e
      )
    );
  }, [pushUndo]);

  const restoreEntry = useCallback((id: string) => {
    setTrash((prev) => {
      const entry = prev.find((e) => e.id === id);
      if (entry) {
        setEntries((curr) => [...curr, { ...entry, status: "Pending" }]);
      }
      return prev.filter((e) => e.id !== id);
    });
    toast.success("Restored entry");
  }, []);

  const permanentDelete = useCallback((id: string) => {
    setTrash((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const reorder = useCallback((activeId: string, overId: string) => {
    pushUndo();
    setEntries((prev) => {
      const sorted = [...prev].sort((a, b) => (a.order || 0) - (b.order || 0));
      const oldIdx = sorted.findIndex((e) => e.id === activeId);
      const newIdx = sorted.findIndex((e) => e.id === overId);
      if (oldIdx === -1 || newIdx === -1) return prev;
      const moved = arrayMove(sorted, oldIdx, newIdx);
      return moved.map((e, i) => ({ ...e, order: i + 1 }));
    });
  }, [pushUndo]);

  const undo = useCallback(() => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack;
      const prev = stack[stack.length - 1];
      setEntries(prev);
      return stack.slice(0, -1);
    });
    toast.info("Action undone");
  }, []);

  // ── Stats ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const list = entries;
    const pending = list.filter((e) => e.status === "Pending");
    const paid = list.filter((e) => e.status === "Paid");
    return {
      totalPending: pending.reduce((s, e) => s + e.amount, 0),
      totalPaid: paid.reduce((s, e) => s + e.amount, 0),
      totalAll: list.reduce((s, e) => s + e.amount, 0),
      pendingCount: pending.length,
      paidCount: paid.length,
      totalCount: list.length,
      uniqueNames: [...new Set(list.map((e) => e.name))],
    };
  }, [entries]);

  return {
    entries: sortedEntries,
    trash,
    viewDate,
    setViewDate,
    todayDate,
    isToday,
    isLocked,
    unlockDate,
    lockDate,
    unlockedUntil: forceUnlocked[viewDate],
    snapDates,
    searchQuery,
    setSearchQuery,
    addEntry,
    updateEntry,
    deleteEntry,
    markPaid,
    markPending,
    restoreEntry,
    permanentDelete,
    reorder,
    undo,
    canUndo: undoStack.length > 0,
    ...stats,
    isLoading,
  };
}
