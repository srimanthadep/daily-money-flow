import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Repeat } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; amount: number; notes: string; isRecurring?: boolean; recurringFrequency?: "Daily" | "Weekly" | "Monthly" }) => void;
  suggestions?: string[];
}

export function EntryDialog({
  open,
  onOpenChange,
  onSave,
  suggestions = [],
}: Props) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<"Daily" | "Weekly" | "Monthly">("Daily");

  useEffect(() => {
    if (open) {
      setName("");
      setAmount("");
      setNotes("");
      setIsRecurring(false);
      setFrequency("Daily");
    }
  }, [open]);

  const handleSave = () => {
    if (!name.trim() || !amount) return;
    onSave({
      name: name.trim(),
      amount: parseFloat(amount) || 0,
      notes: notes.trim(),
      isRecurring,
      recurringFrequency: isRecurring ? frequency : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Add Person</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Basha, Nithin..."
              className="mt-1"
              list="add-name-hints"
              autoFocus
              onKeyDown={(e) =>
                e.key === "Enter" &&
                document.getElementById("add-amount")?.focus()
              }
            />
            {suggestions.length > 0 && (
              <datalist id="add-name-hints">
                {suggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            )}
          </div>

          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Amount (₹)
            </Label>
            <Input
              id="add-amount"
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="mt-1 font-mono text-lg"
              onWheel={(e) => e.currentTarget.blur()}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Notes <span className="normal-case text-muted-foreground/60">(optional)</span>
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any details..."
              className="mt-1 resize-none"
              rows={2}
            />
          </div>

          <div className="pt-2 border-t border-slate-50 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                  <Repeat className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-700">Recurring Entry</Label>
                  <p className="text-[10px] text-slate-400">Resets to pending every day</p>
                </div>
              </div>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>

            {isRecurring && (
              <div className="mt-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Every</Label>
                <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                  <SelectTrigger className="h-8 text-xs font-bold rounded-lg border-slate-100 bg-slate-50/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-50">
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !amount}>
            Add to Ledger
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
