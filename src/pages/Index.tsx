import { useState, useEffect, useCallback } from "react";
import { Plus, Download, Trash2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DashboardSummary } from "@/components/DashboardSummary";
import { DateNavigator } from "@/components/DateNavigator";
import { EntryDialog } from "@/components/EntryDialog";
import { EntryTable } from "@/components/EntryTable";
import { RotationCharts } from "@/components/RotationCharts";
import { SearchFilter } from "@/components/SearchFilter";
import { TrashDialog } from "@/components/TrashDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEntries } from "@/hooks/useEntries";
import { exportToCSV, exportToExcel } from "@/lib/export";
import { FinancialEntry } from "@/types/entry";

const Index = () => {
  const {
    entries, filteredEntries, dateEntries, trash,
    selectedDate, setSelectedDate,
    searchQuery, setSearchQuery,
    filterCategory, setFilterCategory,
    filterName, setFilterName,
    dateRangeFrom, setDateRangeFrom,
    dateRangeTo, setDateRangeTo,
    addEntry, updateEntry, deleteEntry, restoreEntry, permanentDelete,
    todayTotal, yesterdayTotal, selectedDateTotal, weeklyTotal, monthlyTotal,
    uniqueNames, dailyChartData, categoryData, totalEntries,
  } = useEntries();

  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | undefined>();
  const [trashOpen, setTrashOpen] = useState(false);
  const [showCharts, setShowCharts] = useState(true);

  const handleSave = useCallback((data: Omit<FinancialEntry, "id" | "createdAt" | "updatedAt">) => {
    if (editingEntry) {
      updateEntry(editingEntry.id, data);
      setEditingEntry(undefined);
    } else {
      addEntry(data);
    }
  }, [editingEntry, updateEntry, addEntry]);

  const openEditDialog = useCallback((entry: FinancialEntry) => {
    setEditingEntry(entry);
    setEntryDialogOpen(true);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setFilterCategory("all");
    setFilterName("");
    setDateRangeFrom("");
    setDateRangeTo("");
  }, [setSearchQuery, setFilterCategory, setFilterName, setDateRangeFrom, setDateRangeTo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setEditingEntry(undefined); setEntryDialogOpen(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="gradient-text">Rotation</span>
            <span className="text-muted-foreground font-normal ml-1.5 text-sm">Manager</span>
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCharts(!showCharts)} className="gap-1.5 text-xs">
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{showCharts ? "Hide" : "Show"} Charts</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportToCSV(filteredEntries)}>Export CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToExcel(filteredEntries)}>Export Excel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" onClick={() => setTrashOpen(true)} className="gap-1.5 text-xs">
              <Trash2 className="w-3.5 h-3.5" />
              {trash.length > 0 && <span className="text-destructive">{trash.length}</span>}
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-5">
        {/* Summary Cards */}
        <DashboardSummary
          todayTotal={todayTotal}
          yesterdayTotal={yesterdayTotal}
          weeklyTotal={weeklyTotal}
          monthlyTotal={monthlyTotal}
          totalEntries={totalEntries}
          selectedDateTotal={selectedDateTotal}
          selectedDate={selectedDate}
        />

        {/* Search & Filters */}
        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterCategory={filterCategory}
          onCategoryChange={setFilterCategory}
          filterName={filterName}
          onNameChange={setFilterName}
          dateRangeFrom={dateRangeFrom}
          onDateFromChange={setDateRangeFrom}
          dateRangeTo={dateRangeTo}
          onDateToChange={setDateRangeTo}
          onClear={clearFilters}
        />

        {/* Date Navigation + Add Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />
          <Button onClick={() => { setEditingEntry(undefined); setEntryDialogOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> New Entry
            <kbd className="hidden sm:inline text-[10px] bg-primary-foreground/20 px-1.5 py-0.5 rounded ml-1">N</kbd>
          </Button>
        </div>

        {/* Table */}
        <EntryTable
          entries={dateEntries}
          total={selectedDateTotal}
          onUpdate={updateEntry}
          onDelete={deleteEntry}
          onEdit={openEditDialog}
        />

        {/* Charts */}
        {showCharts && <RotationCharts dailyData={dailyChartData} categoryData={categoryData} />}
      </main>

      {/* Dialogs */}
      <EntryDialog
        open={entryDialogOpen}
        onOpenChange={(open) => { setEntryDialogOpen(open); if (!open) setEditingEntry(undefined); }}
        onSave={handleSave}
        initialData={editingEntry}
        defaultDate={selectedDate}
        suggestions={uniqueNames}
      />
      <TrashDialog
        open={trashOpen}
        onOpenChange={setTrashOpen}
        trash={trash}
        onRestore={restoreEntry}
        onPermanentDelete={permanentDelete}
      />
    </div>
  );
};

export default Index;
