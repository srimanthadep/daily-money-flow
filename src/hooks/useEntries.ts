import { useState, useEffect, useCallback, useMemo } from "react";
import { FinancialEntry } from "@/types/entry";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";

const STORAGE_KEY = "rotation-entries";
const TRASH_KEY = "rotation-trash";

function loadEntries(): FinancialEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

function saveEntries(entries: FinancialEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function loadTrash(): FinancialEntry[] {
  try {
    return JSON.parse(localStorage.getItem(TRASH_KEY) || "[]");
  } catch { return []; }
}

function saveTrash(trash: FinancialEntry[]) {
  localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
}

export function useEntries() {
  const [entries, setEntries] = useState<FinancialEntry[]>(loadEntries);
  const [trash, setTrash] = useState<FinancialEntry[]>(loadTrash);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterName, setFilterName] = useState("");
  const [dateRangeFrom, setDateRangeFrom] = useState("");
  const [dateRangeTo, setDateRangeTo] = useState("");

  useEffect(() => { saveEntries(entries); }, [entries]);
  useEffect(() => { saveTrash(trash); }, [trash]);

  const addEntry = useCallback((entry: Omit<FinancialEntry, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    setEntries(prev => [...prev, { ...entry, id: crypto.randomUUID(), createdAt: now, updatedAt: now }]);
  }, []);

  const updateEntry = useCallback((id: string, updates: Partial<FinancialEntry>) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e));
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => {
      const entry = prev.find(e => e.id === id);
      if (entry) setTrash(t => [...t, { ...entry, deleted: true }]);
      return prev.filter(e => e.id !== id);
    });
  }, []);

  const restoreEntry = useCallback((id: string) => {
    setTrash(prev => {
      const entry = prev.find(e => e.id === id);
      if (entry) {
        const { deleted, ...rest } = entry;
        setEntries(e => [...e, rest]);
      }
      return prev.filter(e => e.id !== id);
    });
  }, []);

  const permanentDelete = useCallback((id: string) => {
    setTrash(prev => prev.filter(e => e.id !== id));
  }, []);

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => e.name.toLowerCase().includes(q) || e.notes.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
    }
    if (filterCategory && filterCategory !== "all") {
      result = result.filter(e => e.category === filterCategory);
    }
    if (filterName) {
      result = result.filter(e => e.name.toLowerCase().includes(filterName.toLowerCase()));
    }
    if (dateRangeFrom && dateRangeTo) {
      result = result.filter(e => {
        const d = parseISO(e.date);
        return isWithinInterval(d, { start: parseISO(dateRangeFrom), end: parseISO(dateRangeTo) });
      });
    }
    return result;
  }, [entries, searchQuery, filterCategory, filterName, dateRangeFrom, dateRangeTo]);

  const dateEntries = useMemo(() => filteredEntries.filter(e => e.date === selectedDate), [filteredEntries, selectedDate]);

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  const todayTotal = useMemo(() => entries.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0), [entries, today]);
  const yesterdayTotal = useMemo(() => entries.filter(e => e.date === yesterday).reduce((s, e) => s + e.amount, 0), [entries, yesterday]);
  const selectedDateTotal = useMemo(() => dateEntries.reduce((s, e) => s + e.amount, 0), [dateEntries]);

  const weeklyTotal = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    return entries.filter(e => { const d = parseISO(e.date); return isWithinInterval(d, { start, end }); }).reduce((s, e) => s + e.amount, 0);
  }, [entries]);

  const monthlyTotal = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return entries.filter(e => { const d = parseISO(e.date); return isWithinInterval(d, { start, end }); }).reduce((s, e) => s + e.amount, 0);
  }, [entries]);

  const uniqueNames = useMemo(() => [...new Set(entries.map(e => e.name))], [entries]);

  const dailyChartData = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach(e => map.set(e.date, (map.get(e.date) || 0) + e.amount));
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-30).map(([date, total]) => ({ date: format(parseISO(date), "MMM dd"), total }));
  }, [entries]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach(e => map.set(e.category || "Other", (map.get(e.category || "Other") || 0) + e.amount));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [entries]);

  return {
    entries, filteredEntries, dateEntries, trash,
    selectedDate, setSelectedDate,
    searchQuery, setSearchQuery,
    filterCategory, setFilterCategory,
    filterName, setFilterName,
    dateRangeFrom, setDateRangeFrom,
    dateRangeTo, setDateRangeTo,
    addEntry, updateEntry, deleteEntry, restoreEntry, permanentDelete,
    todayTotal, yesterdayTotal, selectedDateTotal, weeklyTotal, monthlyTotal,
    uniqueNames, dailyChartData, categoryData,
    totalEntries: entries.length,
  };
}
