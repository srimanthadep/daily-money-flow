import { ChevronLeft, ChevronRight, CalendarDays, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, subDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  viewDate: string;
  onDateChange: (date: string) => void;
  todayDate: string;
  snapDates: string[];
}

export function DateNavigator({
  viewDate,
  onDateChange,
  todayDate,
  snapDates,
}: Props) {
  const date = parseISO(viewDate);
  const isToday = viewDate === todayDate;
  const hasSnap = snapDates.includes(viewDate);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onDateChange(format(subDays(date, 1), "yyyy-MM-dd"))}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[190px] gap-2 h-9 text-sm">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono">
              {format(date, "EEE, dd MMM yyyy")}
            </span>
            {isToday && (
              <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold uppercase">
                today
              </span>
            )}
            {!isToday && hasSnap && (
              <History className="w-3 h-3 text-amber-500" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && onDateChange(format(d, "yyyy-MM-dd"))}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
          {snapDates.length > 0 && (
            <div className="px-3 pb-3 border-t border-border/50 pt-2">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
                Saved Snapshots
              </p>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {snapDates.slice(0, 15).map((d) => (
                  <button
                    key={d}
                    onClick={() => onDateChange(d)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      d === viewDate
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary/50 hover:text-primary"
                    }`}
                  >
                    {format(parseISO(d), "dd MMM")}
                  </button>
                ))}
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onDateChange(format(addDays(date, 1), "yyyy-MM-dd"))}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      {!isToday && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDateChange(todayDate)}
          className="text-xs h-8 text-primary border-primary/30"
        >
          ← Back to Today
        </Button>
      )}
    </div>
  );
}
