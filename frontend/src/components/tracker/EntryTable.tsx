import { useState, useEffect } from "react";
import { LedgerEntry } from "@/types/entry";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { fmt } from "./EditableCell";
import { SortableRow, MobileEntryCard } from "./EntryRow";

interface Props {
  entries: LedgerEntry[];
  readOnly?: boolean;
  onUpdate: (id: string, updates: Partial<LedgerEntry>) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onMarkPending: (id: string) => void;
  onReorder: (activeId: string, overId: string) => void;
}

export function EntryTable({
  entries,
  readOnly,
  onUpdate,
  onDelete,
  onMarkPaid,
  onMarkPending,
  onReorder,
}: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const total = entries.reduce((s, e) => s + e.amount, 0);
  const pendingTotal = entries
    .filter((e) => e.status === "Pending")
    .reduce((s, e) => s + e.amount, 0);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-10 text-center animate-fade-in shadow-sm">
        <p className="text-slate-600 dark:text-slate-300 font-medium">No entries found.</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {readOnly ? "No saved data for this date." : "Click + Add Person to get started."}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in relative">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        {isMobile ? (
          /* Mobile View */
          <div className="space-y-3">
            <SortableContext
              items={entries.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              {entries.map((entry) => (
                <MobileEntryCard
                  key={entry.id}
                  entry={entry}
                  readOnly={!!readOnly}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onMarkPaid={onMarkPaid}
                  onMarkPending={onMarkPending}
                />
              ))}
            </SortableContext>

            {/* Mobile Footer (Totals) */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Total Members
                </span>
                <span className="block font-black text-slate-900 dark:text-white text-lg">
                  {entries.length}
                </span>
              </div>
              <div className="text-right space-y-0.5">
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Total Amount
                </span>
                <span className="block font-black text-indigo-600 dark:text-indigo-400 text-xl leading-none">
                  {fmt(total)}
                </span>
                {pendingTotal !== total && (
                  <span className="block text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-tight mt-1">
                    ({fmt(pendingTotal)} pending)
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Desktop Table */
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <th className="px-2 py-4 w-10 no-print" />
                    <th className="px-2 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest w-10 text-center">
                      #
                    </th>
                    <th className="px-4 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-left">
                      Name
                    </th>
                    <th className="px-4 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">
                      Amount
                    </th>
                    <th className="px-4 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-left hidden md:table-cell">
                      Notes
                    </th>
                    <th className="px-4 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center hidden sm:table-cell w-[110px] no-print">
                      Status
                    </th>
                    {!readOnly && (
                      <th className="px-3 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right w-[100px] no-print">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <SortableContext
                  items={entries.map((e) => e.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody>
                    {entries.map((entry, idx) => (
                      <SortableRow
                        key={entry.id}
                        entry={entry}
                        index={idx}
                        readOnly={!!readOnly}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        onMarkPaid={onMarkPaid}
                        onMarkPending={onMarkPending}
                      />
                    ))}
                  </tbody>
                </SortableContext>

                <tfoot className="no-print">
                  <tr className="bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                    <td className="no-print" />
                    <td className="px-2 py-5" />
                    <td className="px-4 py-5">
                      <span className="font-bold text-sm text-slate-500 dark:text-slate-400">
                        {entries.length} people
                      </span>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-base">
                        {fmt(total)}
                      </div>
                      {pendingTotal !== total && (
                        <div className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-tight">
                          {fmt(pendingTotal)} pending
                        </div>
                      )}
                    </td>
                    <td className="hidden md:table-cell" />
                    <td className="hidden sm:table-cell no-print" />
                    {!readOnly && <td className="no-print" />}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </DndContext>

      {/* Print-only Total Row */}
      <div className="print-only mt-0 border-t-2 border-slate-200 pt-4">
        <div className="flex justify-between items-center px-4 py-2 bg-slate-50/50 rounded-lg">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Total Members
            </span>
            <span className="font-black text-slate-900 text-lg">
              {entries.length} members
            </span>
          </div>
          <div className="text-right flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Final Total
            </span>
            <span className="font-black text-indigo-600 text-2xl tracking-tight">
              {fmt(total)}
            </span>
            {pendingTotal !== total && (
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-tight">
                ({fmt(pendingTotal)} pending)
              </span>
            )}
          </div>
        </div>
        <div className="mt-8 text-center border-t border-slate-100 pt-4">
          <p className="text-[10px] text-slate-400 font-medium">
            End of Money Flow Report • Generated on {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default EntryTable;
