import { useState, useRef, useEffect } from "react";
import { LedgerEntry } from "@/types/entry";
import {
  DndContext,
  closestCenter,
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
import { GripVertical, Trash2, CheckCircle2, RotateCcw } from "lucide-react";
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

// ── Sortable row ──────────────────────────────────────────────────────
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
      className={`border-b border-border/30 transition-colors group ${
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
        <EditableCell
          value={entry.name}
          disabled={readOnly}
          onSave={(v) => onUpdate(entry.id, { name: v })}
          className="font-bold text-[14px] text-slate-800"
        />
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
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
        </DndContext>
      </div>
    </div>
  );
}
