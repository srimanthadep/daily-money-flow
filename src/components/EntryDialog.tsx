import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FinancialEntry, CATEGORIES } from "@/types/entry";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: Omit<FinancialEntry, "id" | "createdAt" | "updatedAt">) => void;
  initialData?: FinancialEntry;
  defaultDate: string;
  suggestions?: string[];
}

export function EntryDialog({ open, onOpenChange, onSave, initialData, defaultDate, suggestions = [] }: Props) {
  const [name, setName] = useState(initialData?.name || "");
  const [amount, setAmount] = useState(initialData?.amount?.toString() || "");
  const [category, setCategory] = useState(initialData?.category || "Other");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [date, setDate] = useState(initialData?.date || defaultDate);

  const handleSave = () => {
    if (!name.trim() || !amount) return;
    onSave({ name: name.trim(), amount: parseFloat(amount), category, notes: notes.trim(), date });
    if (!initialData) { setName(""); setAmount(""); setNotes(""); }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass">
        <DialogHeader>
          <DialogTitle className="font-semibold">{initialData ? "Edit Entry" : "New Entry"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Name / Source</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Client Payment"
              className="mt-1 font-mono"
              list="name-suggestions"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && document.getElementById("amount-input")?.focus()}
            />
            {suggestions.length > 0 && (
              <datalist id="name-suggestions">
                {suggestions.map(s => <option key={s} value={s} />)}
              </datalist>
            )}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Amount</Label>
            <Input
              id="amount-input"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1 font-mono text-lg"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 font-mono" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." className="mt-1 resize-none" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || !amount}>Save Entry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
