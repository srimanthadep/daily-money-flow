import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/types/entry";

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
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
        )}
      </div>
    </div>
  );
}
