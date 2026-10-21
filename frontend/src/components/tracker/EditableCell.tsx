import { useState, useRef, useEffect } from "react";

export function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

interface EditableCellProps {
  value: string | number;
  type?: "text" | "number";
  disabled?: boolean;
  onSave: (val: string) => void;
  className?: string;
}

export function EditableCell({
  value,
  type = "text",
  disabled,
  onSave,
  className = "",
}: EditableCellProps) {
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
        className={`cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded px-1.5 py-0.5 -mx-1.5 transition-colors ${className}`}
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
      className={`bg-slate-100 dark:bg-slate-800 border border-indigo-400/50 dark:border-indigo-500/50 text-slate-900 dark:text-slate-100 rounded px-2 py-0.5 outline-none focus:ring-2 focus:ring-indigo-500/30 w-full font-mono text-sm ${className}`}
    />
  );
}

export default EditableCell;
