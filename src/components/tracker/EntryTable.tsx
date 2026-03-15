import { useState, useRef, useEffect } from "react";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, CheckCircle2, RotateCcw, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── helpers ────────────────────────────────────────────────────────────
function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

// ── Inline editable cell ──────────────────────────────────────────────
function EditableCell({
  value,
  type = "text",
  disabled,
  onSave,
  className = "",
}: {
  value: string | number;
  type?: "text" | "number";
  disabled?: boolean;
  onSave: (val: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== String(value)) {
      onSave(trimmed);
    } else {
      setDraft(String(value));
    }
  };

  if (disabled) {
    return (
      <span className={className}>
        {type === "number" ? fmt(Number(value)) : value || "—"}
      </span>
    );
  }

  if (!editing) {
    return (
      <span
        className={`cursor-pointer hover:bg-secondary/60 rounded px-1.5 py-0.5 -mx-1.5 transition-colors ${className}`}
        onClick={() => setEditing(true)}
        title="Click to edit"
      >
        {type === "number" ? fmt(Number(value)) : value || "—"}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type={type}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onWheel={(e) => e.currentTarget.blur()}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
          setDraft(String(value));
          setEditing(false);
        }
      }}
      className={`bg-secondary/80 border border-primary/30 rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-primary/50 w-full font-mono text-sm ${className}`}
    />
  );
}

// ── Mobile Entry Card ────────────────────────────────────────────────
function MobileEntryCard({
  entry,
  readOnly,
  onUpdate,
  onDelete,
  onMarkPaid,
  onMarkPending,
}: {
  entry: LedgerEntry;
  readOnly: boolean;
  onUpdate: (id: string, u: Partial<LedgerEntry>) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onMarkPending: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id, disabled: readOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto" as const,
  };

  const isPaid = entry.status === "Paid";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 rounded-2xl border transition-all duration-200 mb-3 block sm:hidden ${
        isPaid 
          ? "bg-emerald-50/40 border-emerald-100 opacity-80" 
          : "bg-white border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
      } ${isDragging ? "shadow-xl scale-[1.02] border-indigo-200" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        {!readOnly && (
          <div 
            {...attributes} 
            {...listeners} 
            className="mt-1 text-slate-300 active:text-indigo-500 touch-none"
          >
            <GripVertical className="w-5 h-5" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <EditableCell
                value={entry.name}
                disabled={readOnly}
                onSave={(v) => onUpdate(entry.id, { name: v })}
                className="font-black text-slate-900 text-base"
              />
              {entry.isRecurring && (
                <span title={`Recurring: ${entry.recurringFrequency}`}>
                  <Repeat className="w-3 h-3 text-indigo-500" />
                </span>
              )}
            </div>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${
              isPaid ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
            }`}>
              {entry.status}
            </span>
            {entry.notes && (
              <span className="text-[11px] text-slate-400 truncate italic">"{entry.notes}"</span>
            )}
          </div>
        </div>

        <div className="text-right">
          <EditableCell
            value={entry.amount}
            type="number"
            disabled={readOnly}
            onSave={(v) => onUpdate(entry.id, { amount: parseFloat(v) || 0 })}
            className="font-mono font-black text-indigo-600 text-lg block"
          />
        </div>
      </div>

      {!readOnly && (
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-end gap-5">
           {isPaid ? (
            <button
              className="flex items-center gap-1.5 text-orange-600 font-bold text-xs"
              onClick={() => onMarkPending(entry.id)}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              PENDING
            </button>
          ) : (
            <button
              className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs"
              onClick={() => onMarkPaid(entry.id)}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              MARK PAID
            </button>
          )}
          <button
            className="flex items-center gap-1.5 text-rose-500 font-bold text-xs"
            onClick={() => onDelete(entry.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
            DELETE
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sortable row (Desktop Table) ──────────────────────────────────────
function SortableRow({
  entry,
  index,
  readOnly,
  onUpdate,
  onDelete,
  onMarkPaid,
  onMarkPending,
}: {
  entry: LedgerEntry;
  index: number;
  readOnly: boolean;
  onUpdate: (id: string, u: Partial<LedgerEntry>) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onMarkPending: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id, disabled: readOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto" as const,
  };

  const isPaid = entry.status === "Paid";

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hidden sm:table-row border-b border-border/30 transition-colors group ${
        isPaid ? "bg-emerald-500/5 opacity-60" : "hover:bg-secondary/30"
      } ${isDragging ? "shadow-lg bg-background" : ""}`}
    >
      {/* Drag handle */}
      <td className="px-2 py-4 w-10 text-center border-l border-transparent">
        {!readOnly ? (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1 touch-none"
            title="Drag to reorder"
          >
            <GripVertical className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-5" />
        )}
      </td>

      {/* # */}
      <td className="px-2 py-4 w-10 text-[13px] text-slate-400 font-medium text-center">
        {index + 1}
      </td>

      {/* Name */}
      <td className="px-4 py-4 min-w-[140px]">
        <div className="flex items-center gap-2">
          <EditableCell
            value={entry.name}
            disabled={readOnly}
            onSave={(v) => onUpdate(entry.id, { name: v })}
            className="font-bold text-[14px] text-slate-800"
          />
          {entry.isRecurring && (
            <span title={`Recurring: ${entry.recurringFrequency}`}>
              <Repeat className="w-3 h-3 text-indigo-500" />
            </span>
          )}
        </div>
      </td>

      {/* Amount */}
      <td className="px-4 py-4 w-[120px] text-center">
        <EditableCell
          value={entry.amount}
          type="number"
          disabled={readOnly}
          onSave={(v) => onUpdate(entry.id, { amount: parseFloat(v) || 0 })}
          className="font-semibold text-[14px] text-slate-700"
        />
      </td>

      {/* Notes */}
      <td className="px-4 py-4 hidden md:table-cell">
        <EditableCell
          value={entry.notes}
          disabled={readOnly}
          onSave={(v) => onUpdate(entry.id, { notes: v })}
          className="text-[13px] text-slate-500"
        />
      </td>

      {/* Status */}
      <td className="px-4 py-4 text-center hidden sm:table-cell w-[110px]">
        <span
          className={`text-[11px] px-3 py-1 rounded-full font-bold inline-block tracking-tight ${
            isPaid
              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
              : "bg-[#FFF4E5] text-[#B76E00]" // Matching reference image 1 Pending color
          }`}
        >
          {entry.status}
        </span>
      </td>

      {/* Actions */}
      {!readOnly && (
        <td className="px-3 py-4 text-right w-[100px]">
          <div className="flex gap-4 justify-end items-center">
            {isPaid ? (
              <button
                className="text-orange-600 hover:text-orange-800 transition-colors p-1"
                title="Mark Pending"
                onClick={() => onMarkPending(entry.id)}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            ) : (
              <button
                className="text-slate-800 hover:text-black transition-colors p-1"
                title="Mark Paid"
                onClick={() => onMarkPaid(entry.id)}
              >
                <CheckCircle2 className="w-4.5 h-4.5" />
              </button>
            )}
            <button
              className="text-red-500 hover:text-red-700 transition-colors p-1"
              title="Delete"
              onClick={() => onDelete(entry.id)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

// ── Main table ────────────────────────────────────────────────────────
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
      <div className="glass rounded-xl p-10 text-center animate-fade-in">
        <p className="text-muted-foreground font-medium">No entries found.</p>
        <p className="text-xs text-muted-foreground mt-1">
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
            <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Members</span>
                <span className="block font-black text-slate-900 text-lg">{entries.length}</span>
              </div>
              <div className="text-right space-y-0.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</span>
                <span className="block font-black text-indigo-600 text-xl leading-none">{fmt(total)}</span>
                {pendingTotal !== total && (
                  <span className="block text-[10px] font-bold text-orange-600 uppercase tracking-tight mt-1">
                    ({fmt(pendingTotal)} pending)
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Desktop Table */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/30">
                    <th className="px-2 py-4 w-10" />
                    <th className="px-2 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest w-10 text-center">
                      #
                    </th>
                    <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-left">
                      Name
                    </th>
                    <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">
                      Amount
                    </th>
                    <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-left hidden md:table-cell">
                      Notes
                    </th>
                    <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center hidden sm:table-cell w-[110px]">
                      Status
                    </th>
                    {!readOnly && (
                      <th className="px-3 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right w-[100px]">
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

                <tfoot>
                  <tr className="bg-slate-50/20 border-t border-slate-100">
                    <td />
                    <td className="px-2 py-5" />
                    <td className="px-4 py-5">
                      <span className="font-bold text-sm text-slate-500">{entries.length} people</span>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <div className="font-bold text-slate-800 text-base">
                        {fmt(total)}
                      </div>
                      {pendingTotal !== total && (
                        <div className="text-[10px] text-orange-600 font-bold uppercase tracking-tight">
                          {fmt(pendingTotal)} pending
                        </div>
                      )}
                    </td>
                    <td className="hidden md:table-cell" />
                    <td className="hidden sm:table-cell" />
                    {!readOnly && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </DndContext>
    </div>
  );
}
