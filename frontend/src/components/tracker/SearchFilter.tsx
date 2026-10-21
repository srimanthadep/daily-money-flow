import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onClear: () => void;
}

export function SearchFilter({
  searchQuery,
  onSearchChange,
  onClear,
}: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-2 md:p-3 shadow-sm animate-fade-in w-full">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or notes..."
            className="pl-9 text-sm h-10 md:h-9 bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/60 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all rounded-xl"
          />
        </div>

        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-10 md:h-9 px-3 rounded-xl"
          >
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}
