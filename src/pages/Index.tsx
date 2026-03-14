import { useState, useEffect, useCallback, useMemo } from "react";
import { addDays, subDays } from "date-fns";
import { Plus, Download, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@clerk/react";
import { DashboardSummary } from "@/components/tracker/DashboardSummary";
import { DateNavigator } from "@/components/tracker/DateNavigator";
import { EntryDialog } from "@/components/tracker/EntryDialog";
import { EntryTable } from "@/components/tracker/EntryTable";
import { SearchFilter } from "@/components/tracker/SearchFilter";
import { TrashDialog } from "@/components/tracker/TrashDialog";
import { PasswordPrompt } from "@/components/auth/PasswordPrompt";
import { TableSkeleton } from "@/components/tracker/TableSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { useEntries } from "@/hooks/useEntries";
import { useExpenses } from "@/hooks/useExpenses";
import { exportToCSV, exportToExcel } from "@/lib/export";
import GradientText from "@/components/ui/GradientText";

const Index = () => {
  const { user } = useUser();
  const {
    entries,
    trash,
    viewDate,
    setViewDate,
    todayDate,
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
  const [passwordDialogMode, setPasswordDialogMode] = useState<'unlock' | 'lock'>('unlock');
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
  }, [setSearchQuery]);


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

      // Left Arrow = Previous Day
      if (e.key === "ArrowLeft") {
        setViewDate(prev => subDays(new Date(prev), 1).toISOString().split('T')[0]);
      }
      // Right Arrow = Next Day
      if (e.key === "ArrowRight") {
        setViewDate(prev => addDays(new Date(prev), 1).toISOString().split('T')[0]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canUndo, undo, isLocked]);

  if (isLoading) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <main className="container py-8 space-y-6 max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <TableSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <main className="container py-4 md:py-8 px-4 md:px-8 space-y-4 md:space-y-6 max-w-5xl animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight flex items-center gap-2">
                Welcome,{" "}
                <GradientText
                  colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
                  animationSpeed={4}
                  showBorder={false}
                  className="inline-block"
                >
                  {user?.firstName || user?.username || "Guest"}
                </GradientText>
                !
              </h1>
              {isLocked ? (
                <button 
                  onClick={() => {
                    setPasswordDialogMode('unlock');
                    setPasswordDialogOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors group cursor-pointer" 
                  title="This day is locked for editing. Click to unlock."
                >
                  <svg className="group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Locked</span>
                </button>
              ) : unlockedUntil && timeRemaining ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700" title={`Unlocked for editing. Time remaining: ${timeRemaining}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Unlocked ({timeRemaining})</span>
                  </div>
                  <button 
                    onClick={() => {
                      setPasswordDialogMode('lock');
                      setPasswordDialogOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors text-[10px] font-bold uppercase tracking-wider"
                    title="Click to lock this date now."
                  >
                    Lock Now
                  </button>
                </div>
              ) : null}
            </div>
            <p className="text-sm text-slate-500">Here is your money flow overview</p>
          </div>
          
          <div className="flex items-center md:items-end gap-2 shrink-0 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {canUndo && !isLocked && (
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                className="gap-2 h-10 md:h-9 bg-white text-slate-600 border-slate-100 rounded-xl shadow-sm"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
                <span className="hidden md:inline">Undo</span>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-10 md:h-9 bg-white text-slate-600 border-slate-100 rounded-xl shadow-sm">
                  <Download className="w-4 h-4" />
                  <span className="hidden md:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-2xl border-slate-100 shadow-2xl p-1">
                <DropdownMenuItem className="rounded-xl font-bold text-xs" onClick={() => exportToCSV(entries)}>CSV REPORT</DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl font-bold text-xs" onClick={() => exportToExcel(entries)}>EXCEL SHEET</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {!isLocked && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTrashOpen(true)}
                className="gap-2 h-10 md:h-9 bg-white text-slate-600 border-slate-100 rounded-xl shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                {trash.length > 0 && <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-lg text-[10px] font-black">{trash.length}</span>}
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

        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClear={clearFilters}
        />


        {/* Date nav + Add button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 sm:gap-3">
          <DateNavigator
            viewDate={viewDate}
            onDateChange={setViewDate}
            todayDate={todayDate}
            snapDates={snapDates}
          />

          {!isLocked && (
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="h-14 sm:h-10 rounded-[1.25rem] bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 font-black text-sm tracking-tight gap-2"
            >
              <Plus className="w-5 h-5" />
              ADD NEW PERSON
              <kbd className="hidden sm:inline text-[10px] bg-white/20 px-1.5 py-0.5 rounded-lg ml-1">
                N
              </kbd>
            </Button>
          )}
        </div>

        {/* Table */}
        <EntryTable
          entries={entries}
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
        mode={passwordDialogMode}
        onConfirm={(pass, h) => {
          if (passwordDialogMode === 'unlock') {
            return unlockDate(viewDate, pass, h);
          } else {
            return lockDate(viewDate, pass);
          }
        }}
      />
    </div>
  );
};

export default Index;
