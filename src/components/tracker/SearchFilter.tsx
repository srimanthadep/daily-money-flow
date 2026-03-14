import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterStatus: string;
  onStatusChange: (s: string) => void;
  onClear: () => void;
  entryCount: number;
  filteredCount: number;
}

export function SearchFilter({
  searchQuery,
  onSearchChange,
  filterStatus,
  onStatusChange,
  onClear,
  entryCount,
  filteredCount,
}: Props) {
  const hasFilters = searchQuery || filterStatus !== "all";

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-2 md:p-3 shadow-sm animate-fade-in">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or notes..."
            className="pl-9 text-sm h-10 md:h-9 bg-slate-50/50 border-slate-100 focus:bg-white transition-all rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="flex-1 sm:w-[140px] h-10 md:h-9 bg-slate-50/50 border-slate-100 rounded-xl">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Pending">⏳ Pending</SelectItem>
              <SelectItem value="Paid">✅ Paid</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-10 md:h-9 px-3 rounded-xl"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
          )}
        </div>

        {hasFilters && (
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center sm:text-left">
            {filteredCount} results
          </span>
        )}
      </div>
    </div>
  );
}
