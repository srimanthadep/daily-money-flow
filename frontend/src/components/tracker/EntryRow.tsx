import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, CheckCircle2, RotateCcw, Repeat } from "lucide-react";
import { LedgerEntry } from "@/types/entry";
import { EditableCell } from "./EditableCell";

interface EntryRowProps {
  entry: LedgerEntry;
  index?: number;
  readOnly: boolean;
  onUpdate: (id: string, u: Partial<LedgerEntry>) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onMarkPending: (id: string) => void;
}

// ── Mobile Entry Card ────────────────────────────────────────────────
export function MobileEntryCard({
  entry,
  readOnly,
  onUpdate,
  onDelete,
  onMarkPaid,
  onMarkPending,
}: EntryRowProps) {
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
    zIndex: isDragging ? 50 : ("auto" as const),
  };

  const isPaid = entry.status === "Paid";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 rounded-2xl border transition-all duration-200 mb-3 block sm:hidden ${
        isPaid
          ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 opacity-80"
          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
      } ${isDragging ? "shadow-xl scale-[1.02] border-indigo-200 dark:border-indigo-800" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        {!readOnly && (
          <div
            {...attributes}
            {...listeners}
            className="mt-1 text-slate-300 dark:text-slate-600 active:text-indigo-500 touch-none cursor-grab"
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
              className="font-black text-slate-900 dark:text-white text-base"
            />
            {entry.isRecurring && (
              <span title={`Recurring: ${entry.recurringFrequency}`}>
                <Repeat className="w-3 h-3 text-indigo-500" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${
                isPaid
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                  : "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400"
              }`}
            >
              {entry.status}
            </span>
            {entry.notes && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate italic">
                "{entry.notes}"
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <EditableCell
            value={entry.amount}
            type="number"
            disabled={readOnly}
            onSave={(v) => onUpdate(entry.id, { amount: parseFloat(v) || 0 })}
            className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-lg block"
          />
        </div>
      </div>

      {!readOnly && (
        <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-end gap-5">
          {isPaid ? (
            <button
              className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-bold text-xs cursor-pointer"
              onClick={() => onMarkPending(entry.id)}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              PENDING
            </button>
          ) : (
            <button
              className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs cursor-pointer"
              onClick={() => onMarkPaid(entry.id)}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              MARK PAID
            </button>
          )}
          <button
            className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 font-bold text-xs cursor-pointer"
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

// ── Desktop Table Sortable Row ─────────────────────────────────────────
export function SortableRow({
  entry,
  index = 0,
  readOnly,
  onUpdate,
  onDelete,
  onMarkPaid,
  onMarkPending,
}: EntryRowProps) {
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
    zIndex: isDragging ? 50 : ("auto" as const),
  };

  const isPaid = entry.status === "Paid";

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hidden sm:table-row border-b border-slate-100 dark:border-slate-800/60 transition-colors group ${
        isPaid
          ? "bg-emerald-500/5 dark:bg-emerald-950/15 opacity-60"
          : "hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
      } ${isDragging ? "shadow-lg bg-white dark:bg-slate-900" : ""}`}
    >
      {/* Drag handle */}
      <td className="px-2 py-4 w-10 text-center border-l border-transparent no-print">
        {!readOnly ? (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 touch-none"
            title="Drag to reorder"
          >
            <GripVertical className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-5" />
        )}
      </td>

      {/* # */}
      <td className="px-2 py-4 w-10 text-[13px] text-slate-400 dark:text-slate-500 font-medium text-center">
        {index + 1}
      </td>

      {/* Name */}
      <td className="px-4 py-4 min-w-[140px]">
        <div className="flex items-center gap-2">
          <EditableCell
            value={entry.name}
            disabled={readOnly}
            onSave={(v) => onUpdate(entry.id, { name: v })}
            className="font-bold text-[14px] text-slate-800 dark:text-slate-100"
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
          className="font-semibold text-[14px] text-slate-700 dark:text-slate-200"
        />
      </td>

      {/* Notes */}
      <td className="px-4 py-4 hidden md:table-cell">
        <EditableCell
          value={entry.notes}
          disabled={readOnly}
          onSave={(v) => onUpdate(entry.id, { notes: v })}
          className="text-[13px] text-slate-500 dark:text-slate-400"
        />
      </td>

      {/* Status */}
      <td className="px-4 py-4 text-center hidden sm:table-cell w-[110px] no-print">
        <span
          className={`text-[11px] px-3 py-1 rounded-full font-bold inline-block tracking-tight ${
            isPaid
              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
              : "bg-[#FFF4E5] dark:bg-amber-950/40 text-[#B76E00] dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50"
          }`}
        >
          {entry.status}
        </span>
      </td>

      {/* Actions */}
      {!readOnly && (
        <td className="px-3 py-4 text-right w-[100px] no-print">
          <div className="flex gap-4 justify-end items-center">
            {isPaid ? (
              <button
                className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 transition-colors p-1 cursor-pointer"
                title="Mark Pending"
                onClick={() => onMarkPending(entry.id)}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            ) : (
              <button
                className="text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white transition-colors p-1 cursor-pointer"
                title="Mark Paid"
                onClick={() => onMarkPaid(entry.id)}
              >
                <CheckCircle2 className="w-4.5 h-4.5" />
              </button>
            )}
            <button
              className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors p-1 cursor-pointer"
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

export default SortableRow;
