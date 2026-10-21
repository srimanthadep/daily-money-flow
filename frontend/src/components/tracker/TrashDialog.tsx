import { LedgerEntry } from "@/types/entry";
import { Undo2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trash: LedgerEntry[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function TrashDialog({
  open,
  onOpenChange,
  trash,
  onRestore,
  onPermanentDelete,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">
            Deleted ({trash.length})
          </DialogTitle>
        </DialogHeader>

        {trash.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center">
            No deleted entries.
          </p>
        ) : (
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {trash.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800"
              >
                <div>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{entry.name}</span>
                  <span className="text-slate-400 dark:text-slate-500 text-xs ml-2 font-mono">
                    {fmt(entry.amount)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-accent"
                    title="Restore"
                    onClick={() => onRestore(entry.id)}
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    title="Permanently Delete"
                    onClick={() => onPermanentDelete(entry.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
