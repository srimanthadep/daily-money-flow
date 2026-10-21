import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { LedgerEntry } from "@/types/entry";
import { format, subDays } from "date-fns";
import { SEED_DATA } from "@/lib/seedData";
import { arrayMove } from "@dnd-kit/sortable";
import { supabase, isConfigured } from "@/lib/supabase";
import { toast } from "sonner";
import { useUser } from "@clerk/react";
import { useActivityLog } from "./useActivityLog";
import { useDateLock, checkIsDateLocked } from "./useDateLock";

function getToday(): string {
  const now = new Date();
  // If current time is before 3 AM, we are conceptually in the previous day
  if (now.getHours() < 3) {
    return format(subDays(now, 1), "yyyy-MM-dd");
  }
  return format(now, "yyyy-MM-dd");
}

export function useEntries() {
  const { user } = useUser();
  const userId = user?.id || "local";
  const SNAP = `snap:${userId}:`;
  const LATEST = `latest:${userId}`;

  const todayDate = getToday();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [trash, setTrash] = useState<LedgerEntry[]>([]);
  const [viewDate, setViewDate] = useState(todayDate);
  const [searchQuery, setSearchQuery] = useState("");
  const [snapDates, setSnapDates] = useState<string[]>([]);
  const [undoStack, setUndoStack] = useState<LedgerEntry[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useActivityLog();

  // Modular date locking hook
  const { isLocked, unlockedUntil, unlockDate, lockDate } = useDateLock(viewDate);

  const isToday = viewDate === todayDate;
  const isLoadedRef = useRef(false);
  const snapDatesLoadedRef = useRef(false);

  // ── Read / write helpers for Local Fallback ──────────────────────────────
  const readLocalSnap = useCallback((date: string): LedgerEntry[] | null => {
    try {
      const raw = localStorage.getItem(SNAP + date);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [SNAP]);

  const getLocalSnapDates = useCallback((): string[] => {
    const dates: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SNAP) && key !== LATEST) {
        dates.push(key.slice(SNAP.length));
      }
    }
    return dates;
  }, [SNAP, LATEST]);

  // ── Initial Data Loading ────────────────────────────────────────────────
  useEffect(() => {
    let isCancelled = false;

    const init = async () => {
      isLoadedRef.current = false;
      setIsLoading(true);

      const loadFromStorage = async (date: string): Promise<LedgerEntry[]> => {
        if (isConfigured && user) {
          const { data } = await supabase
            .from("daily_snapshots")
            .select("data")
            .eq("date", date)
            .eq("user_id", user.id)
            .maybeSingle();

          if (data && data.data && (data.data as LedgerEntry[]).length > 0) {
            return data.data as LedgerEntry[];
          }

          // 1. If we don't have a snapshot, check if previous day is locked
          const dateObj = new Date(date + "T00:00:00");
          const prevDateStr = format(subDays(dateObj, 1), "yyyy-MM-dd");
          const isPrevLocked = checkIsDateLocked(prevDateStr);

          // 2. If the previous day is NOT locked, this is a future or currently active date
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
            const lockedSnap = latestBefore.find((s) => checkIsDateLocked(s.date));
            if (lockedSnap && lockedSnap.data) {
              sourceData = lockedSnap.data as LedgerEntry[];
            }
          }

          if (sourceData.length === 0) {
            const localDates = getLocalSnapDates()
              .filter((d) => d < date)
              .sort()
              .reverse();
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
            return sourceData.map((e) => {
              if (e.isRecurring) {
                return { ...e, status: "Pending" as const, paidOn: undefined };
              }
              return e;
            });
          }
        }

        // Final Fallback for demo in development only
        if (
          date === todayDate &&
          getLocalSnapDates().length === 0 &&
          userId === "local" &&
          import.meta.env.DEV
        ) {
          return SEED_DATA;
        }

        return [];
      };

      const result = await loadFromStorage(viewDate);
      if (!isCancelled) {
        setEntries(result);

        // Load snap dates once, tracked by snapDatesLoadedRef
        if (!snapDatesLoadedRef.current && isConfigured && user) {
          const { data: snaps } = await supabase
            .from("daily_snapshots")
            .select("date")
            .eq("user_id", user.id)
            .order("date", { ascending: false });
          if (snaps) {
            setSnapDates(snaps.map((s) => s.date));
            snapDatesLoadedRef.current = true;
          }
        } else if (!snapDatesLoadedRef.current) {
          setSnapDates(
            Array.from(new Set([...getLocalSnapDates(), todayDate]))
              .sort()
              .reverse()
          );
          snapDatesLoadedRef.current = true;
        }

        setIsLoading(false);
        // Gate saveToCloud so it only triggers on actual subsequent user edits
        isLoadedRef.current = true;
      }
    };

    init();
    return () => {
      isCancelled = true;
    };
  }, [viewDate, isConfigured, user, userId, todayDate, getLocalSnapDates, readLocalSnap]);

  // ── Sync to Cloud ───────────────────────────────────────────────────────
  const saveToCloud = useCallback(
    async (date: string, data: LedgerEntry[]) => {
      localStorage.setItem(SNAP + date, JSON.stringify(data));
      localStorage.setItem(LATEST, date);

      if (!isConfigured || !user) return;

      try {
        const { error } = await supabase.from("daily_snapshots").upsert(
          {
            date,
            data,
            user_id: user.id,
            username:
              user.username || user.firstName || user.fullName || "Guest",
          },
          { onConflict: "date,user_id" }
        );

        if (error) {
          console.error("Supabase save error:", error.message);
          toast.error(`Save failed: ${error.message}`);
          return;
        }

        setSnapDates((prev) =>
          prev.includes(date) ? prev : Array.from(new Set([...prev, date])).sort().reverse()
        );
      } catch (err) {
        console.error("Cloud save error:", err);
      }
    },
    [SNAP, LATEST, user]
  );

  // ── Persist entries ONLY when user changes them (not on mount) ───────────
  useEffect(() => {
    if (!isLoadedRef.current) return; // Prevent double-write bug on load
    if (entries.length > 0) {
      const timer = setTimeout(() => {
        saveToCloud(viewDate, entries);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [entries, viewDate, saveToCloud]);

  // ── Push to undo ──────────────────────────────────────────────────────
  const pushUndo = useCallback(() => {
    setUndoStack((stack) => [...stack.slice(-19), entries]);
  }, [entries]);

  // ── Filtered & sorted ─────────────────────────────────────────────────
  const sortedEntries = useMemo(() => {
    const list = [...entries].sort((a, b) => (a.order || 0) - (b.order || 0));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q))
      );
    }
    return list;
  }, [entries, searchQuery]);

  // ── CRUD ───────────────────────────────────────────────────────────────
  const addEntry = useCallback(
    async (data: {
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
      const updatedData = [...entries, newEntry];
      setEntries(updatedData);

      try {
        if (isConfigured && user) {
          const { error: saveError } = await supabase.from("daily_snapshots").upsert(
            {
              date: viewDate,
              data: updatedData,
              user_id: user.id,
              username:
                user.username || user.firstName || user.fullName || "Guest",
            },
            { onConflict: "date,user_id" }
          );

          if (saveError) throw saveError;
        }
        toast.success("Added " + data.name);
        logActivity(
          "ENTRY_ADDED",
          `Added ${data.name} with amount ₹${data.amount}`
        );
      } catch (err) {
        console.error("Add error:", err);
        setEntries(previousEntries);
        toast.error("Failed to sync new entry");
      }
    },
    [entries, user, viewDate, logActivity]
  );

  const updateEntry = useCallback(
    async (id: string, updates: Partial<LedgerEntry>) => {
      const previousEntries = [...entries];
      const prevEntry = entries.find((e) => e.id === id);
      const updatedEntries = entries.map((e) =>
        e.id === id
          ? { ...e, ...updates, updatedAt: new Date().toISOString() }
          : e
      );
      setEntries(updatedEntries);

      try {
        if (isConfigured && user) {
          const { error } = await supabase.from("daily_snapshots").upsert(
            {
              date: viewDate,
              data: updatedEntries,
              user_id: user.id,
              username:
                user.username || user.firstName || user.fullName || "Guest",
            },
            { onConflict: "date,user_id" }
          );
          if (error) throw error;
        }
        const updatedEntry = updatedEntries.find((e) => e.id === id);
        if (updatedEntry && prevEntry) {
          if (
            updates.amount !== undefined &&
            prevEntry.amount !== updates.amount
          ) {
            logActivity(
              "ENTRY_UPDATED",
              `Updated ${updatedEntry.name}'s amount: ₹${prevEntry.amount} → ₹${updates.amount}`
            );
          } else {
            logActivity("ENTRY_UPDATED", `Updated entry: ${updatedEntry.name}`);
          }
        }
      } catch (err) {
        console.error("Update error:", err);
        setEntries(previousEntries);
        toast.error("Update failed to sync");
      }
    },
    [entries, user, viewDate, logActivity]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const previousEntries = [...entries];
      const itemToDelete = entries.find((e) => e.id === id);
      const updatedEntries = entries.filter((e) => e.id !== id);

      setEntries(updatedEntries);
      if (itemToDelete) setTrash((t) => [...t, itemToDelete]);

      try {
        if (isConfigured && user) {
          const { error } = await supabase.from("daily_snapshots").upsert(
            {
              date: viewDate,
              data: updatedEntries,
              user_id: user.id,
              username:
                user.username || user.firstName || user.fullName || "Guest",
            },
            { onConflict: "date,user_id" }
          );
          if (error) throw error;
        }
        toast.error("Entry moved to trash");
        if (itemToDelete) {
          logActivity("ENTRY_TRASHED", `Moved ${itemToDelete.name} to trash`);
        }
      } catch (err) {
        console.error("Delete error:", err);
        setEntries(previousEntries);
        if (itemToDelete) setTrash((t) => t.filter((x) => x.id !== id));
        toast.error("Delete failed to sync");
      }
    },
    [entries, user, viewDate, logActivity]
  );

  const markPaid = useCallback(
    (id: string) => {
      pushUndo();
      const updated = entries.map((e) =>
        e.id === id
          ? {
              ...e,
              status: "Paid" as const,
              paidOn: viewDate,
              updatedAt: new Date().toISOString(),
            }
          : e
      );
      setEntries(updated);
      saveToCloud(viewDate, updated);
      toast.success("Marked as Paid");
      const item = entries.find((e) => e.id === id);
      if (item) logActivity("MARKED_PAID", `Marked ${item.name} as Paid`);
    },
    [entries, pushUndo, viewDate, saveToCloud, logActivity]
  );

  const markPending = useCallback(
    (id: string) => {
      pushUndo();
      const updated = entries.map((e) =>
        e.id === id
          ? {
              ...e,
              status: "Pending" as const,
              paidOn: undefined,
              updatedAt: new Date().toISOString(),
            }
          : e
      );
      setEntries(updated);
      saveToCloud(viewDate, updated);
      toast.success("Marked as Pending");
      const item = entries.find((e) => e.id === id);
      if (item) logActivity("MARKED_PENDING", `Marked ${item.name} as Pending`);
    },
    [entries, pushUndo, viewDate, saveToCloud, logActivity]
  );

  const restoreEntry = useCallback(
    (id: string) => {
      const item = trash.find((e) => e.id === id);
      if (item) {
        setEntries((curr) => [...curr, { ...item, status: "Pending" }]);
        setTrash((prev) => prev.filter((e) => e.id !== id));
        toast.success("Restored entry");
        logActivity("ENTRY_RESTORED", `Restored ${item.name} from trash`);
      }
    },
    [trash, logActivity]
  );

  const permanentDelete = useCallback(
    (id: string) => {
      const item = trash.find((e) => e.id === id);
      setTrash((prev) => prev.filter((e) => e.id !== id));
      if (item) {
        logActivity("ENTRY_DELETED", `Permanently deleted ${item.name}`);
      }
    },
    [trash, logActivity]
  );

  const reorder = useCallback(
    (activeId: string, overId: string) => {
      pushUndo();
      const sorted = [...entries].sort((a, b) => (a.order || 0) - (b.order || 0));
      const oldIdx = sorted.findIndex((e) => e.id === activeId);
      const newIdx = sorted.findIndex((e) => e.id === overId);

      if (oldIdx === -1 || newIdx === -1) return;

      const moved = arrayMove(sorted, oldIdx, newIdx);
      const updated = moved.map((e, i) => ({ ...e, order: i + 1 }));

      setEntries(updated);
      saveToCloud(viewDate, updated);
    },
    [entries, pushUndo, viewDate, saveToCloud]
  );

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
    unlockedUntil,
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
