import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, subDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function DateNavigator({ selectedDate, onDateChange }: Props) {
  const date = parseISO(selectedDate);
  const today = format(new Date(), "yyyy-MM-dd");
  const isToday = selectedDate === today;

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={() => onDateChange(format(subDays(date, 1), "yyyy-MM-dd"))}>
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[180px] gap-2">
            <CalendarDays className="w-4 h-4" />
            <span className="font-mono text-sm">{format(date, "EEE, MMM dd yyyy")}</span>
            {isToday && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium">TODAY</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && onDateChange(format(d, "yyyy-MM-dd"))}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <Button variant="ghost" size="icon" onClick={() => onDateChange(format(addDays(date, 1), "yyyy-MM-dd"))}>
        <ChevronRight className="w-4 h-4" />
      </Button>

      {!isToday && (
        <Button variant="ghost" size="sm" onClick={() => onDateChange(today)} className="text-xs text-muted-foreground">
          Go to Today
        </Button>
      )}
    </div>
  );
}
