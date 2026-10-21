import { useState, useMemo } from "react";
import { useActivityLog, ActivityAction } from "@/hooks/useActivityLog";
import { format } from "date-fns";
import { 
  Activity, 
  LogIn, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  RefreshCcw, 
  CheckCircle, 
  Clock, 
  FileX,
  Search,
  Filter
} from "lucide-react";
import { TableSkeleton } from "@/components/tracker/TableSkeleton";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ActivityHeatmap } from "@/components/tracker/ActivityHeatmap";
import { X } from "lucide-react";

export default function ActivityLog() {
  const { logs, loading, refresh } = useActivityLog();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("");

  const getActionIcon = (action: string) => {
    switch (action) {
      case "LOGIN":
        return <LogIn className="w-5 h-5 text-blue-500" />;
      case "ENTRY_ADDED":
        return <PlusCircle className="w-5 h-5 text-emerald-500" />;
      case "ENTRY_UPDATED":
        return <Edit3 className="w-5 h-5 text-amber-500" />;
      case "ENTRY_DELETED":
        return <Trash2 className="w-5 h-5 text-rose-500" />;
      case "ENTRY_RESTORED":
        return <RefreshCcw className="w-5 h-5 text-indigo-500" />;
      case "ENTRY_TRASHED":
        return <FileX className="w-5 h-5 text-rose-400" />;
      case "MARKED_PAID":
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case "MARKED_PENDING":
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <Activity className="w-5 h-5 text-slate-500" />;
    }
  };

  const getActionBg = (action: string) => {
    switch (action) {
      case "LOGIN": return "bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-300";
      case "ENTRY_ADDED":
      case "MARKED_PAID": return "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300";
      case "ENTRY_UPDATED":
      case "MARKED_PENDING": return "bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50 text-amber-700 dark:text-amber-300";
      case "ENTRY_DELETED":
      case "ENTRY_TRASHED": return "bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50 text-rose-700 dark:text-rose-300";
      case "ENTRY_RESTORED": return "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300";
      default: return "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300";
    }
  };

  const formatActionName = (action: string) => {
    return action.replace(/_/g, " ");
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.details.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            log.action.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterAction === "ALL" || log.action === filterAction;
      const matchesDate = !selectedDateFilter || log.timestamp.startsWith(selectedDateFilter);
      return matchesSearch && matchesFilter && matchesDate;
    });
  }, [logs, searchQuery, filterAction, selectedDateFilter]);

  const uniqueActions = useMemo(() => {
    const actions = Array.from(new Set(logs.map(log => log.action)));
    return ["ALL", ...actions];
  }, [logs]);

  return (
    <div className="container py-6 space-y-6 max-w-4xl animate-fade-in px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-100 dark:shadow-none">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">Live Activity Log</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Synced with cloud database</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refresh()} 
          className="rounded-xl font-bold text-slate-600 dark:text-slate-300 gap-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
          disabled={loading}
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Clerk User Activity Heatmap at the very top */}
      <ActivityHeatmap
        logs={logs}
        selectedDate={selectedDateFilter}
        onSelectDate={(dateStr) => {
          setSelectedDateFilter((prev) => (prev === dateStr ? "" : dateStr));
        }}
      />

      {/* Active Date Filter Pill if a cell is clicked */}
      {selectedDateFilter && (
        <div className="flex items-center justify-between bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/60 px-4 py-2.5 rounded-2xl text-xs text-indigo-900 dark:text-indigo-200 font-medium no-print animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7C5CFC]" />
            <span>
              Showing logs for{" "}
              <strong className="font-bold text-indigo-950 dark:text-white">
                {format(new Date(selectedDateFilter + "T00:00:00"), "EEE, MMM d, yyyy")}
              </strong>
            </span>
          </div>
          <button
            onClick={() => setSelectedDateFilter("")}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-white dark:bg-slate-900 border border-indigo-200/60 dark:border-indigo-800/60 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
            <span>Clear filter</span>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm no-print">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600" />
          <Input 
            placeholder="Search action or details..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-slate-50/50 dark:bg-slate-800/50 dark:text-slate-100 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:ring-0 rounded-2xl transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-400 shrink-0 hidden md:block" />
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="h-12 bg-slate-50/50 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 rounded-2xl transition-all font-bold text-slate-600 dark:text-slate-300">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              {uniqueActions.map(action => (
                <SelectItem key={action} value={action} className="rounded-xl font-bold uppercase text-[11px] tracking-widest py-3 text-slate-700 dark:text-slate-300">
                  {action === "ALL" ? "All Categories" : formatActionName(action)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-4 md:p-10 min-h-[500px]">
        {loading ? (
          <div className="space-y-8">
            <div className="space-y-4">
              <TableSkeleton />
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-200 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No activity results found</h3>
            <p className="text-slate-400 dark:text-slate-500 mt-2 font-medium">Try clearing your filters or adding some data.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-50 dark:border-slate-800 ml-4 md:ml-6 space-y-10 pb-4">
            {filteredLogs.map((log) => (
              <div key={log.id} className="relative pl-8 md:pl-12 group">
                {/* Timeline dot */}
                <div 
                  className={`absolute -left-[17px] top-1.5 w-8 h-8 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center bg-white dark:bg-slate-900 ${getActionBg(log.action)} shadow-md group-hover:scale-125 transition-all duration-300 z-10`}
                >
                  {getActionIcon(log.action)}
                </div>
                
                <div className="bg-slate-50/30 dark:bg-slate-800/40 p-4 md:p-6 rounded-[2rem] border border-transparent hover:border-slate-100 dark:hover:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800/80 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-slate-100/50 dark:group-hover:shadow-black/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${getActionBg(log.action)}`}>
                        {formatActionName(log.action)}
                      </span>
                      <span className="text-xs font-bold text-indigo-500/80 dark:text-indigo-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" />
                        {log.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {format(new Date(log.timestamp), "MMM d")}
                        </span>
                        <span className="text-[10px] font-medium text-slate-300 dark:text-slate-600">
                          {format(new Date(log.timestamp), "h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-bold text-base md:text-lg leading-relaxed">
                    {log.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
