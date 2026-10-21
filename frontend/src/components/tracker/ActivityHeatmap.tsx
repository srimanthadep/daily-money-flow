import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { ActivityLogEntry } from "@/hooks/useActivityLog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/react";
import { supabase, isConfigured } from "@/lib/supabase";

interface ActivityHeatmapProps {
  logs?: ActivityLogEntry[];
  onSelectDate?: (dateStr: string) => void;
  selectedDate?: string;
}

interface DayActivityInfo {
  count: number;
  actions: string[];
  details: string[];
}

export function ActivityHeatmap({
  logs = [],
  onSelectDate,
  selectedDate,
}: ActivityHeatmapProps) {
  const { user } = useUser();
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return new Date().getFullYear();
  });

  // State to hold all real database activity dates (snapshots & all historical logs)
  const [snapshotDates, setSnapshotDates] = useState<string[]>([]);
  const [remoteLogDates, setRemoteLogDates] = useState<
    Map<string, { count: number; actions: string[]; details: string[] }>
  >(new Map());

  // Fetch real activities from Supabase for this user
  useEffect(() => {
    let isCancelled = false;

    const fetchRealData = async () => {
      if (!isConfigured || !user?.id) return;

      try {
        // 1. Fetch real ledger snapshot dates (days where entries exist)
        const { data: snaps, error: snapErr } = await supabase
          .from("daily_snapshots")
          .select("date")
          .eq("user_id", user.id);

        if (!snapErr && snaps && !isCancelled) {
          setSnapshotDates(snaps.map((s) => s.date));
        }

        // 2. Fetch all real activity log records for this user
        const { data: logRecords, error: logErr } = await supabase
          .from("activity_logs")
          .select("timestamp, action, details")
          .eq("user_id", user.id);

        if (!logErr && logRecords && !isCancelled) {
          const map = new Map<
            string,
            { count: number; actions: string[]; details: string[] }
          >();
          logRecords.forEach((row) => {
            try {
              const dateStr = format(new Date(row.timestamp), "yyyy-MM-dd");
              const current = map.get(dateStr) || {
                count: 0,
                actions: [],
                details: [],
              };
              current.count += 1;
              if (row.action && !current.actions.includes(row.action)) {
                current.actions.push(row.action);
              }
              if (row.details && !current.details.includes(row.details)) {
                current.details.push(row.details);
              }
              map.set(dateStr, current);
            } catch {}
          });
          setRemoteLogDates(map);
        }
      } catch (err) {
        console.warn("Error fetching real activity dates:", err);
      }
    };

    fetchRealData();
    return () => {
      isCancelled = true;
    };
  }, [user?.id]);

  // Aggregate only 100% REAL activities (ZERO mock / seed data)
  const { activityMap, totalActiveDays } = useMemo(() => {
    const map = new Map<string, DayActivityInfo>();

    const recordActivity = (dateStr: string, actionName: string, detailText?: string) => {
      if (!dateStr.startsWith(String(selectedYear))) return;
      const existing = map.get(dateStr) || {
        count: 0,
        actions: [],
        details: [],
      };
      existing.count += 1;
      if (actionName && !existing.actions.includes(actionName)) {
        existing.actions.push(actionName);
      }
      if (detailText && !existing.details.includes(detailText)) {
        existing.details.push(detailText);
      }
      map.set(dateStr, existing);
    };

    // 1. Incorporate remote activity logs from Supabase
    remoteLogDates.forEach((info, dateStr) => {
      if (dateStr.startsWith(String(selectedYear))) {
        const existing = map.get(dateStr) || {
          count: 0,
          actions: [],
          details: [],
        };
        existing.count += info.count;
        info.actions.forEach((a) => {
          if (!existing.actions.includes(a)) existing.actions.push(a);
        });
        info.details.forEach((d) => {
          if (!existing.details.includes(d)) existing.details.push(d);
        });
        map.set(dateStr, existing);
      }
    });

    // 2. Incorporate live logs from props
    logs.forEach((log) => {
      try {
        const dateStr = format(new Date(log.timestamp), "yyyy-MM-dd");
        recordActivity(dateStr, log.action, log.details);
      } catch {}
    });

    // 3. Incorporate real ledger snapshot dates (when user entered daily records)
    snapshotDates.forEach((d) => {
      recordActivity(d, "LEDGER_ENTRY", "Daily Ledger Active");
    });

    // 4. Incorporate real local storage snapshot dates
    const prefix = `snap:${user?.id || "local"}:`;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        const dateStr = k.slice(prefix.length);
        recordActivity(dateStr, "LEDGER_ENTRY", "Daily Ledger Active");
      }
    }

    // 5. Incorporate Clerk user sign-in and creation dates
    if (user?.createdAt) {
      try {
        const createDate = format(new Date(user.createdAt), "yyyy-MM-dd");
        recordActivity(createDate, "ACCOUNT_CREATED", "Account Created");
      } catch {}
    }
    if (user?.lastSignInAt) {
      try {
        const signDate = format(new Date(user.lastSignInAt), "yyyy-MM-dd");
        recordActivity(signDate, "LOGIN", "Signed in via Clerk");
      } catch {}
    }

    return {
      activityMap: map,
      totalActiveDays: map.size,
    };
  }, [logs, remoteLogDates, snapshotDates, selectedYear, user]);

  // Construct 53 columns (weeks 0 to 52) with 7 rows (Sunday=0 to Saturday=6)
  const { weeks, monthHeaders } = useMemo(() => {
    const jan1 = new Date(selectedYear, 0, 1);
    const startSunday = new Date(jan1);
    // Sunday on or before Jan 1
    startSunday.setDate(jan1.getDate() - jan1.getDay());

    const generatedWeeks: Array<
      Array<{
        date: Date;
        dateStr: string;
        isCurrentYear: boolean;
        formattedDate: string;
      }>
    > = [];

    for (let w = 0; w < 53; w++) {
      const colDays: Array<{
        date: Date;
        dateStr: string;
        isCurrentYear: boolean;
        formattedDate: string;
      }> = [];

      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(startSunday);
        cellDate.setDate(startSunday.getDate() + w * 7 + d);
        const dateStr = format(cellDate, "yyyy-MM-dd");
        colDays.push({
          date: cellDate,
          dateStr,
          isCurrentYear: cellDate.getFullYear() === selectedYear,
          formattedDate: format(cellDate, "EEE, MMM d, yyyy"),
        });
      }
      generatedWeeks.push(colDays);
    }

    // Determine month starting column indexes for the bottom labels
    const monthColMap: Record<number, string> = {};
    for (let m = 0; m < 12; m++) {
      const firstOfMonth = new Date(selectedYear, m, 1);
      const diffDays = Math.floor(
        (firstOfMonth.getTime() - startSunday.getTime()) / 86400000
      );
      const colIndex = Math.max(0, Math.floor(diffDays / 7));
      if (!monthColMap[colIndex]) {
        monthColMap[colIndex] = firstOfMonth.toLocaleString("en-US", {
          month: "short",
        });
      }
    }

    return {
      weeks: generatedWeeks,
      monthHeaders: monthColMap,
    };
  }, [selectedYear]);

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="w-full bg-[#0E0E11] border border-white/[0.08] shadow-2xl rounded-2xl md:rounded-3xl p-4 sm:p-6 text-white no-print transition-all">
      {/* Top Header: Title + Year Selector */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-white text-base sm:text-lg font-bold tracking-tight">
            User activity
          </h2>
          <span className="text-[11px] font-semibold text-zinc-400 bg-white/[0.06] border border-white/[0.08] px-2.5 py-0.5 rounded-md">
            {totalActiveDays} active {totalActiveDays === 1 ? "day" : "days"}
          </span>
        </div>

        <Select
          value={String(selectedYear)}
          onValueChange={(val) => setSelectedYear(Number(val))}
        >
          <SelectTrigger className="h-8 w-auto gap-2 bg-[#1B1B1F] hover:bg-[#25252B] border-white/10 text-white rounded-lg px-3 py-1 text-xs font-semibold focus:ring-0 focus:ring-offset-0 transition-colors shadow-sm cursor-pointer">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent className="bg-[#18181B] border-white/10 text-white rounded-xl shadow-2xl z-50">
            <SelectItem
              value="2026"
              className="text-xs font-medium focus:bg-[#27272A] focus:text-white rounded-lg cursor-pointer"
            >
              2026
            </SelectItem>
            <SelectItem
              value="2025"
              className="text-xs font-medium focus:bg-[#27272A] focus:text-white rounded-lg cursor-pointer"
            >
              2025
            </SelectItem>
            <SelectItem
              value="2024"
              className="text-xs font-medium focus:bg-[#27272A] focus:text-white rounded-lg cursor-pointer"
            >
              2024
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Heatmap Matrix: 100% Fluid Width with NO horizontal scrolling */}
      <div className="w-full bg-[#131316] border border-white/[0.04] rounded-xl sm:rounded-2xl p-3 sm:p-5 overflow-hidden">
        {/* Day Labels + 53 Fluid Week Columns */}
        <div className="w-full flex items-center gap-1.5 sm:gap-2">
          {/* Day of Week Labels (S, M, T, W, T, F, S) matching cell heights exactly */}
          <div className="flex flex-col gap-[2px] sm:gap-[3px] shrink-0 w-3 sm:w-3.5 select-none">
            {dayLabels.map((label, idx) => (
              <div
                key={idx}
                className="w-full aspect-square flex items-center justify-center text-[9px] sm:text-[10px] font-semibold text-zinc-500 leading-none"
              >
                {label}
              </div>
            ))}
          </div>

          {/* 53 Columns spanning 100% of container width */}
          <div className="flex-1 min-w-0 grid grid-cols-[repeat(53,minmax(0,1fr))] gap-[2px] sm:gap-[3px]">
            {weeks.map((colDays, colIdx) => (
              <div
                key={colIdx}
                className="flex flex-col gap-[2px] sm:gap-[3px] min-w-0"
              >
                {colDays.map((cell) => {
                  const activity = activityMap.get(cell.dateStr);
                  const isActive = Boolean(activity);
                  const isSelected = selectedDate === cell.dateStr;

                  return (
                    <Tooltip key={cell.dateStr} delayDuration={30}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => onSelectDate?.(cell.dateStr)}
                          aria-label={`${cell.formattedDate}: ${
                            isActive ? "Active" : "No activity"
                          }`}
                          className={cn(
                            "w-full aspect-square rounded-[2px] sm:rounded-[3px] transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-white cursor-pointer relative",
                            isActive
                              ? "bg-[#7C5CFC] hover:bg-[#8F75FF] hover:scale-125 hover:shadow-[0_0_10px_rgba(124,92,252,0.7)] z-10"
                              : "bg-[#1C1C22] hover:bg-[#2A2A33]",
                            isSelected && "ring-2 ring-white scale-125 z-20",
                            !cell.isCurrentYear && "opacity-20"
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        sideOffset={6}
                        className="bg-black/95 text-white border border-zinc-800 rounded-lg px-3 py-1.5 shadow-2xl text-center pointer-events-none z-50 animate-in fade-in-50 zoom-in-95 duration-100"
                      >
                        <p className="font-bold text-xs text-white leading-tight">
                          {isActive ? "Active" : "No activity"}
                        </p>
                        <p className="text-[11px] text-zinc-400 font-normal leading-tight mt-0.5">
                          {cell.formattedDate}
                        </p>
                        {activity && activity.count > 0 && (
                          <div className="mt-1 pt-1 border-t border-zinc-800/80 text-[10px] space-y-0.5">
                            <p className="text-indigo-400 font-semibold">
                              {activity.count}{" "}
                              {activity.count === 1
                                ? "activity"
                                : "activities"}
                            </p>
                            {activity.details.length > 0 && (
                              <p className="text-zinc-300 max-w-[180px] truncate">
                                {activity.details[0]}
                              </p>
                            )}
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Month Labels aligned directly with the 53 columns */}
        <div className="w-full flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-2.5">
          {/* Spacer matching Day labels width */}
          <div className="shrink-0 w-3 sm:w-3.5" />

          {/* 53 Month Slots */}
          <div className="flex-1 min-w-0 grid grid-cols-[repeat(53,minmax(0,1fr))] gap-[2px] sm:gap-[3px]">
            {weeks.map((_, colIdx) => (
              <div key={colIdx} className="relative h-4 min-w-0">
                {monthHeaders[colIdx] ? (
                  <span className="text-[9px] sm:text-[10px] font-medium text-zinc-500 whitespace-nowrap absolute left-0 top-0 select-none pointer-events-none">
                    {monthHeaders[colIdx]}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityHeatmap;
