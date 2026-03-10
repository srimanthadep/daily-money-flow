<<<<<<< HEAD
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
=======
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/types/entry";
>>>>>>> c858d41a280eb1830d0b49e066a0a7ae053c50cc

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
<<<<<<< HEAD
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
=======
  filterCategory: string;
  onCategoryChange: (c: string) => void;
  filterName: string;
  onNameChange: (n: string) => void;
  dateRangeFrom: string;
  onDateFromChange: (d: string) => void;
  dateRangeTo: string;
  onDateToChange: (d: string) => void;
  onClear: () => void;
}

export function SearchFilter({ searchQuery, onSearchChange, filterCategory, onCategoryChange, filterName, onNameChange, dateRangeFrom, onDateFromChange, dateRangeTo, onDateToChange, onClear }: Props) {
  const hasFilters = searchQuery || filterCategory !== "all" || filterName || dateRangeFrom || dateRangeTo;

  return (
    <div className="glass rounded-xl p-4 animate-fade-in">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
>>>>>>> c858d41a280eb1830d0b49e066a0a7ae053c50cc
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
<<<<<<< HEAD
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
=======
            placeholder="Search entries..."
            className="pl-9 font-mono text-sm"
          />
        </div>
        <Select value={filterCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[140px]">
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          value={filterName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Filter by name"
          className="w-[150px] text-sm"
        />
        <Input type="date" value={dateRangeFrom} onChange={(e) => onDateFromChange(e.target.value)} className="w-[140px] font-mono text-xs" />
        <span className="text-muted-foreground text-xs">to</span>
        <Input type="date" value={dateRangeTo} onChange={(e) => onDateToChange(e.target.value)} className="w-[140px] font-mono text-xs" />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear} className="text-xs text-muted-foreground">
            <X className="w-3 h-3 mr-1" /> Clear
          </Button>
>>>>>>> c858d41a280eb1830d0b49e066a0a7ae053c50cc
        )}
      </div>
    </div>
  );
}
