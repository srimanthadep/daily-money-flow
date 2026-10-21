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
import { Lock } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (password: string, hours: number) => boolean | Promise<boolean>;
  mode?: 'unlock' | 'lock';
}

export function PasswordPrompt({
  open,
  onOpenChange,
  onConfirm,
  mode = 'unlock',
}: Props) {
  const [password, setPassword] = useState("");
  const [hours, setHours] = useState("1");

  useEffect(() => {
    if (open) {
      setPassword("");
      setHours("1");
    }
  }, [open]);

  const handleConfirm = async () => {
    const success = await onConfirm(password, parseFloat(hours) || 1);
    if (success) {
      onOpenChange(false);
    }
  };

  const isUnlock = mode === 'unlock';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-full">
              <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
              {isUnlock ? "Authentication Required" : "Confirm Re-lock"}
            </DialogTitle>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isUnlock 
              ? "This date is locked. Please enter the administrator password and choose unlock duration."
              : "Are you sure you want to lock this date now? Enter password to confirm."}
          </p>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password-input" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Admin Password
            </Label>
            <Input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••"
              className="font-mono text-center text-xl tracking-widest h-12 dark:bg-slate-800/60 dark:border-slate-700 dark:text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (isUnlock) {
                    document.getElementById("duration-input")?.focus();
                  } else {
                    handleConfirm();
                  }
                }
              }}
            />
          </div>

          {isUnlock && (
            <div className="space-y-2">
              <Label htmlFor="duration-input" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Unlock Duration (Hours)
              </Label>
              <Input
                id="duration-input"
                type="number"
                min="1"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="1"
                className="text-center font-bold dark:bg-slate-800/60 dark:border-slate-700 dark:text-white"
                onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              />
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="px-6">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className={`px-8 shadow-lg font-bold ${isUnlock ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none' : 'bg-slate-900 hover:bg-black text-white shadow-slate-200 dark:shadow-none'}`}>
            {isUnlock ? "Unlock Date" : "Lock Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
