import { useState, useEffect, useCallback, useMemo } from "react";
import { LedgerEntry } from "@/types/entry";
import { format } from "date-fns";
import { SEED_DATA } from "@/lib/seedData";
import { arrayMove } from "@dnd-kit/sortable";
import { supabase, isConfigured } from "@/lib/supabase";
import { toast } from "sonner";

const SNAP = "snap:";
const LATEST = "snap:latest";
const TRASH_KEY = "ledger-trash";

function getToday(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function useEntries() {
  const todayDate = getToday();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [trash, setTrash] = useState<LedgerEntry[]>([]);
  const [viewDate, setViewDate] = useState(todayDate);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [snapDates, setSnapDates] = useState<string[]>([]);
  const [undoStack, setUndoStack] = useState<LedgerEntry[][]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isToday = viewDate === todayDate;

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
        if (isConfigured) {
          const { data } = await supabase
            .from("daily_snapshots")
            .select("data")
            .eq("date", date)
            .maybeSingle();
          
          if (data) return data.data as LedgerEntry[];

          // Try most recent before
          const { data: latestBefore } = await supabase
            .from("daily_snapshots")
            .select("data")
            .lt("date", date)
            .order("date", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (latestBefore) return latestBefore.data as LedgerEntry[];
        }

        const local = readLocalSnap(date);
        if (local) return local;

        const localDates = getLocalSnapDates().filter(d => d < date).sort().reverse();
        if (localDates.length > 0) return readLocalSnap(localDates[0]) || SEED_DATA;

        return SEED_DATA;
      };

      const result = await loadFromStorage(viewDate);
      setEntries(result);
      
      // Load snap dates once
      if (snapDates.length === 0 && isConfigured) {
        const { data: snaps } = await supabase
          .from("daily_snapshots")
          .select("date")
          .order("date", { ascending: false });
        if (snaps) setSnapDates(snaps.map(s => s.date));
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

    if (!isConfigured) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      await supabase
        .from("daily_snapshots")
        .upsert({
          date,
          data,
          user_id: user?.user?.id,
        }, { onConflict: 'date' });
      
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
  const filteredEntries = useMemo(() => {
    let list = [...entries].sort((a, b) => (a.order || 0) - (b.order || 0));
    if (filterStatus && filterStatus !== "all") {
      list = list.filter((e) => e.status === filterStatus);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q))
      );
    }
    return list;
  }, [entries, filterStatus, searchQuery]);

  // ── CRUD ───────────────────────────────────────────────────────────────
  const addEntry = useCallback((data: { name: string; amount: number; notes: string }) => {
    pushUndo();
    const now = new Date().toISOString();
    const maxOrder = entries.reduce((m, e) => Math.max(m, e.order || 0), 0);
    setEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: data.name,
        amount: data.amount,
        notes: data.notes,
        status: "Pending",
        order: maxOrder + 1,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    toast.success("Added " + data.name);
  }, [entries, pushUndo]);

  const updateEntry = useCallback((id: string, updates: Partial<LedgerEntry>) => {
    pushUndo();
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
      )
    );
  }, [pushUndo]);

  const deleteEntry = useCallback((id: string) => {
    pushUndo();
    setEntries((prev) => {
      const entry = prev.find((e) => e.id === id);
      if (entry) setTrash((t) => [...t, entry]);
      return prev.filter((e) => e.id !== id);
    });
    toast.error("Entry moved to trash");
  }, [pushUndo]);

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
    toast.success("Marked as Paid");
  }, [pushUndo, viewDate]);

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
    entries: entries,
    filteredEntries,
    trash,
    viewDate,
    setViewDate,
    todayDate,
    isToday,
    snapDates,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
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
