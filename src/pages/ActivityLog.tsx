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
  Receipt,
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

export default function ActivityLog() {
  const { logs, loading, refresh } = useActivityLog();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("ALL");

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
      case "EXPENSE_ADDED":
        return <Receipt className="w-5 h-5 text-emerald-500" />;
      case "EXPENSE_DELETED":
        return <Trash2 className="w-5 h-5 text-rose-500" />;
      default:
        return <Activity className="w-5 h-5 text-slate-500" />;
    }
  };

  const getActionBg = (action: string) => {
    switch (action) {
      case "LOGIN": return "bg-blue-50 border-blue-100";
      case "ENTRY_ADDED":
      case "EXPENSE_ADDED":
      case "MARKED_PAID": return "bg-emerald-50 border-emerald-100";
      case "ENTRY_UPDATED":
      case "MARKED_PENDING": return "bg-amber-50 border-amber-100";
      case "ENTRY_DELETED":
      case "ENTRY_TRASHED":
      case "EXPENSE_DELETED": return "bg-rose-50 border-rose-100";
      case "ENTRY_RESTORED": return "bg-indigo-50 border-indigo-100";
      default: return "bg-slate-50 border-slate-100";
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
      return matchesSearch && matchesFilter;
    });
  }, [logs, searchQuery, filterAction]);

  const uniqueActions = useMemo(() => {
    const actions = Array.from(new Set(logs.map(log => log.action)));
    return ["ALL", ...actions];
  }, [logs]);

  return (
    <div className="container py-6 space-y-6 max-w-4xl animate-fade-in px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 shadow-sm shadow-indigo-100">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Live Activity Log</h1>
            <p className="text-sm text-slate-500 font-medium">Synced with cloud database</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refresh()} 
          className="rounded-xl font-bold text-slate-600 gap-2 border-slate-100"
          disabled={loading}
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm no-print">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <Input 
            placeholder="Search action or details..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-slate-50/50 border-transparent focus:bg-white focus:ring-0 rounded-2xl transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-400 shrink-0 hidden md:block" />
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="h-12 bg-slate-50/50 border-transparent focus:bg-white rounded-2xl transition-all font-bold text-slate-600">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-100">
              {uniqueActions.map(action => (
                <SelectItem key={action} value={action} className="rounded-xl font-bold uppercase text-[11px] tracking-widest py-3">
                  {action === "ALL" ? "All Categories" : formatActionName(action)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-4 md:p-10 min-h-[500px]">
        {loading ? (
          <div className="space-y-8">
            <div className="space-y-4">
              <TableSkeleton />
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-700">No activity results found</h3>
            <p className="text-slate-400 mt-2 font-medium">Try clearing your filters or adding some data.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-50 ml-4 md:ml-6 space-y-10 pb-4">
            {filteredLogs.map((log) => (
              <div key={log.id} className="relative pl-8 md:pl-12 group">
                {/* Timeline dot */}
                <div 
                  className={`absolute -left-[17px] top-1.5 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center bg-white ${getActionBg(log.action)} shadow-md group-hover:scale-125 transition-all duration-300 z-10`}
                >
                  {getActionIcon(log.action)}
                </div>
                
                <div className="bg-slate-50/30 p-4 md:p-6 rounded-[2rem] border border-transparent hover:border-slate-100 hover:bg-white transition-all duration-300 group-hover:shadow-xl group-hover:shadow-slate-100/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${getActionBg(log.action)}`}>
                        {formatActionName(log.action)}
                      </span>
                      <span className="text-xs font-bold text-indigo-500/60 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/30" />
                        {log.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500">
                          {format(new Date(log.timestamp), "MMM d")}
                        </span>
                        <span className="text-[10px] font-medium text-slate-300">
                          {format(new Date(log.timestamp), "h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-800 font-bold text-base md:text-lg leading-relaxed">
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
