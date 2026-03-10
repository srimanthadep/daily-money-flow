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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; amount: number; notes: string }) => void;
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

  useEffect(() => {
    if (open) {
      setName("");
      setAmount("");
      setNotes("");
    }
  }, [open]);

  const handleSave = () => {
    if (!name.trim() || !amount) return;
    onSave({
      name: name.trim(),
      amount: parseFloat(amount) || 0,
      notes: notes.trim(),
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
