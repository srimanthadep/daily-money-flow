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
    <div className="glass rounded-xl p-3 animate-fade-in">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or notes..."
            className="pl-9 text-sm h-9"
          />
        </div>

        <Select value={filterStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[140px] h-9">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Pending">⏳ Pending</SelectItem>
            <SelectItem value="Paid">✅ Paid</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <>
            <span className="text-xs text-muted-foreground">
              {filteredCount} of {entryCount}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-xs text-muted-foreground h-8"
            >
              <X className="w-3 h-3 mr-1" /> Clear
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
