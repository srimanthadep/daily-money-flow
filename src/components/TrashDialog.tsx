import { FinancialEntry } from "@/types/entry";
import { Undo2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trash: FinancialEntry[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

export function TrashDialog({ open, onOpenChange, trash, onRestore, onPermanentDelete }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg glass">
        <DialogHeader>
          <DialogTitle>Trash ({trash.length})</DialogTitle>
        </DialogHeader>
        {trash.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Trash is empty.</p>
        ) : (
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {trash.map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <span className="font-medium text-sm">{entry.name}</span>
                  <span className="text-muted-foreground text-xs ml-2">${entry.amount.toFixed(2)} · {entry.date}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-accent" onClick={() => onRestore(entry.id)}><Undo2 className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onPermanentDelete(entry.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
