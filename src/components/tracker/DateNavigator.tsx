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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
      <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-slate-400 hover:text-indigo-600 rounded-xl"
          onClick={() => onDateChange(format(subDays(date, 1), "yyyy-MM-dd"))}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="flex-1 sm:min-w-[190px] gap-2 h-9 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl">
              <CalendarDays className="w-4 h-4 text-indigo-500" />
              <span className="font-mono">
                {format(date, "EEE, dd MMM yyyy")}
              </span>
              {isToday && (
                <span className="text-[9px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                  today
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-slate-100 overflow-hidden" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && onDateChange(format(d, "yyyy-MM-dd"))}
              initialFocus
              className={cn("p-3")}
            />
            {snapDates.length > 0 && (
              <div className="px-3 pb-3 border-t border-slate-50 pt-3 bg-slate-50/50">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">
                  History
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {snapDates.slice(0, 15).map((d) => (
                    <button
                      key={d}
                      onClick={() => onDateChange(d)}
                      className={`text-[10px] px-3 py-1 rounded-full border shadow-sm transition-all ${
                        d === viewDate
                          ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                          : "bg-white border-slate-100 text-slate-600 hover:border-indigo-400 font-medium"
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
          className="h-9 w-9 text-slate-400 hover:text-indigo-600 rounded-xl"
          onClick={() => onDateChange(format(addDays(date, 1), "yyyy-MM-dd"))}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {!isToday && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDateChange(todayDate)}
          className="h-10 sm:h-9 text-[10px] font-black uppercase tracking-widest border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-2xl"
        >
          ← Current Day
        </Button>
      )}
    </div>
  );
}
