import { useState } from "react";
import { FinancialEntry } from "@/types/entry";
import { Pencil, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/types/entry";

interface Props {
  entries: FinancialEntry[];
  total: number;
  onUpdate: (id: string, updates: Partial<FinancialEntry>) => void;
  onDelete: (id: string) => void;
  onEdit: (entry: FinancialEntry) => void;
}

export function EntryTable({ entries, total, onUpdate, onDelete, onEdit }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<FinancialEntry>>({});

  const startEdit = (entry: FinancialEntry) => {
    setEditingId(entry.id);
    setEditValues({ name: entry.name, amount: entry.amount, category: entry.category, notes: entry.notes });
  };

  const saveEdit = (id: string) => {
    onUpdate(id, editValues);
    setEditingId(null);
    setEditValues({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  if (entries.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center animate-fade-in">
        <p className="text-muted-foreground">No entries for this date. Press <kbd className="px-2 py-1 bg-secondary rounded text-xs font-mono mx-1">N</kbd> to add one.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Notes</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors group">
                {editingId === entry.id ? (
                  <>
                    <td className="px-4 py-2">
                      <Input value={editValues.name || ""} onChange={(e) => setEditValues(v => ({ ...v, name: e.target.value }))} className="table-cell-edit h-8" />
                    </td>
                    <td className="px-4 py-2">
                      <Input type="number" step="0.01" value={editValues.amount || ""} onChange={(e) => setEditValues(v => ({ ...v, amount: parseFloat(e.target.value) }))} className="table-cell-edit h-8 text-right" onKeyDown={(e) => e.key === "Enter" && saveEdit(entry.id)} />
                    </td>
                    <td className="px-4 py-2 hidden sm:table-cell">
                      <Select value={editValues.category || "Other"} onValueChange={(v) => setEditValues(ev => ({ ...ev, category: v }))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-2 hidden md:table-cell">
                      <Input value={editValues.notes || ""} onChange={(e) => setEditValues(v => ({ ...v, notes: e.target.value }))} className="table-cell-edit h-8" />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-accent" onClick={() => saveEdit(entry.id)}><Save className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit}><X className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-sm">{entry.name}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold">${entry.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground">{entry.category}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{entry.notes || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(entry)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(entry.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-secondary/30">
              <td className="px-4 py-3 font-semibold text-sm">Total</td>
              <td className="px-4 py-3 text-right font-mono font-bold text-primary text-lg">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              <td className="hidden sm:table-cell" />
              <td className="hidden md:table-cell" />
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
