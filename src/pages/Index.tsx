import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Download, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardSummary } from "@/components/DashboardSummary";
import { DateNavigator } from "@/components/DateNavigator";
import { EntryDialog } from "@/components/EntryDialog";
import { EntryTable } from "@/components/EntryTable";
import { SearchFilter } from "@/components/SearchFilter";
import { TrashDialog } from "@/components/TrashDialog";
import { PasswordPrompt } from "@/components/PasswordPrompt";
import { useEntries } from "@/hooks/useEntries";
import { useExpenses } from "@/hooks/useExpenses";
import { exportToCSV, exportToExcel } from "@/lib/export";

const Index = () => {
  const {
    entries,
    filteredEntries,
    trash,
    viewDate,
    setViewDate,
    todayDate,
    isLocked,
    unlockDate,
    unlockedUntil,
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
    canUndo,
    totalPending,
    totalPaid,
    totalAll,
    pendingCount,
    paidCount,
    totalCount,
    uniqueNames,
    isLoading,
  } = useEntries();

  const { expenses, loading: expensesLoading } = useExpenses();
  const expensesTotal = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (!unlockedUntil) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const remaining = unlockedUntil - Date.now();
      if (remaining <= 0) {
        setTimeRemaining(null);
        return;
      }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [unlockedUntil]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setFilterStatus("all");
  }, [setSearchQuery, setFilterStatus]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      // N = new entry
      if ((e.key === "n" || e.key === "N") && !isLocked) {
        e.preventDefault();
        setAddDialogOpen(true);
      }
      // Ctrl+Z = undo
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && canUndo && !isLocked) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canUndo, undo, isLocked]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <main className="container py-8 space-y-6 max-w-5xl animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Welcome, Upender!</h1>
              {isLocked ? (
                <button 
                  onClick={() => setPasswordDialogOpen(true)}
                  className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors group cursor-pointer" 
                  title="This day is locked for editing. Click to unlock."
                >
                  <svg className="group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Locked</span>
                </button>
              ) : unlockedUntil && timeRemaining ? (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700" title={`Unlocked for editing. Time remaining: ${timeRemaining}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Unlocked ({timeRemaining})</span>
                </div>
              ) : null}
            </div>
            <p className="text-sm text-slate-500">Here is your money flow overview</p>
          </div>

          <div className="flex items-center gap-2">
            {canUndo && !isLocked && (
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                className="gap-2 h-9 bg-white text-slate-600 border-slate-200"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
                Undo
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9 bg-white text-slate-600 border-slate-200">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-xl border-slate-100 shadow-xl">
                <DropdownMenuItem onClick={() => exportToCSV(entries)}>CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToExcel(entries)}>Excel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {!isLocked && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTrashOpen(true)}
                className="gap-2 h-9 bg-white text-slate-600 border-slate-200"
              >
                <Trash2 className="w-4 h-4" />
                {trash.length > 0 && <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">{trash.length}</span>}
              </Button>
            )}
          </div>
        </div>

        {/* Summary */}
        <DashboardSummary
          totalPending={totalPending}
          totalPaid={totalPaid}
          totalAll={totalAll}
          pendingCount={pendingCount}
          paidCount={paidCount}
          totalCount={totalCount}
          expensesTotal={expensesTotal}
        />

        {/* Search + Filter */}
        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          onClear={clearFilters}
          entryCount={totalCount}
          filteredCount={filteredEntries.length}
        />

        {/* Date nav + Add button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <DateNavigator
            viewDate={viewDate}
            onDateChange={setViewDate}
            todayDate={todayDate}
            snapDates={snapDates}
          />

          {!isLocked && (
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="gap-2 h-9"
            >
              <Plus className="w-4 h-4" />
              Add Person
              <kbd className="hidden sm:inline text-[10px] bg-primary-foreground/20 px-1.5 py-0.5 rounded ml-1">
                N
              </kbd>
            </Button>
          )}
        </div>

        {/* Table */}
        <EntryTable
          entries={filteredEntries}
          readOnly={isLocked}
          onUpdate={updateEntry}
          onDelete={deleteEntry}
          onMarkPaid={markPaid}
          onMarkPending={markPending}
          onReorder={reorder}
        />
      </main>

      {/* Dialogs */}
      <EntryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSave={addEntry}
        suggestions={uniqueNames}
      />
      <TrashDialog
        open={trashOpen}
        onOpenChange={setTrashOpen}
        trash={trash}
        onRestore={restoreEntry}
        onPermanentDelete={permanentDelete}
      />
      <PasswordPrompt
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        onConfirm={(pass, h) => unlockDate(viewDate, pass, h)}
      />
    </div>
  );
};

export default Index;
