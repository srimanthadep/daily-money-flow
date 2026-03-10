import { useState, useMemo } from "react";
import { Plus, Search, Filter, Trash2, Loader2, IndianRupee, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXPENSE_CATEGORIES } from "@/types/entry";
import { format } from "date-fns";
import { useExpenses } from "@/hooks/useExpenses";

const ExpensesPage = () => {
  const { expenses, loading, addExpense, deleteExpense } = useExpenses();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    category: "Other",
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  const handleAddExpense = async () => {
    if (!newExpense.title || !newExpense.amount) return;
    
    await addExpense({
      title: newExpense.title,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      date: newExpense.date,
      notes: newExpense.notes,
    });

    setIsDialogOpen(false);
    setNewExpense({
      title: "",
      amount: "",
      category: "Other",
      date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    });
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = filterCategory === "all" || e.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, filterCategory]);

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="container py-6 space-y-6 max-w-5xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Expenses</h1>
            <p className="text-sm text-slate-500">Total control over your spending</p>
          </div>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Add Expense
        </Button>
      </div>

      {/* Summary Stat */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Spent</div>
          <div className="text-3xl font-black text-slate-900">₹{totalAmount.toLocaleString("en-IN")}</div>
          <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase">{filteredExpenses.length} TRANSACTIONS</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <Input 
            placeholder="Search descriptions..." 
            className="pl-9 h-11 border-transparent bg-slate-50/50 focus:bg-white focus:ring-0 transition-all rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px] h-11 border-transparent bg-slate-50/50 rounded-xl focus:ring-0">
            <Filter className="w-3.5 h-3.5 mr-2 text-slate-400" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-100 shadow-xl">
            <SelectItem value="all">All Categories</SelectItem>
            {EXPENSE_CATEGORIES.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/30 border-b border-slate-50">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-left">Date</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-left">Description</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-left">Category</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-slate-400 mt-2 font-medium">Loading your expenses...</p>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ReceiptText className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-medium text-sm">No expenses match your search.</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-5 text-[13px] text-slate-400 font-bold whitespace-nowrap">
                      {format(new Date(e.date), "dd/MM/yyyy")}
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-[14px] text-slate-800">{e.title}</div>
                      {e.notes && <div className="text-[12px] text-slate-400 font-medium">{e.notes}</div>}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[11px] px-3 py-1 rounded-full bg-slate-100 text-slate-500 font-black uppercase tracking-tight">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-[15px] text-slate-800">
                      ₹{e.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => deleteExpense(e.id)}
                        className="text-slate-300 hover:text-red-500 transition-all p-1.5 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">New Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400" htmlFor="title">Reason / Title</Label>
              <Input 
                id="title" 
                placeholder="What did you spend on?" 
                className="rounded-xl border-slate-100 h-11"
                value={newExpense.title}
                onChange={(e) => setNewExpense({...newExpense, title: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400" htmlFor="amount">Amount (₹)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  placeholder="0" 
                  className="rounded-xl border-slate-100 h-11 font-bold"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400" htmlFor="category">Category</Label>
                <Select 
                  value={newExpense.category} 
                  onValueChange={(v) => setNewExpense({...newExpense, category: v})}
                >
                  <SelectTrigger className="rounded-xl border-slate-100 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {EXPENSE_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400" htmlFor="date">Date</Label>
              <Input 
                id="date" 
                type="date" 
                className="rounded-xl border-slate-100 h-11"
                value={newExpense.date}
                onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400" htmlFor="notes">Notes (Optional)</Label>
              <Input 
                id="notes" 
                placeholder="Any details?" 
                className="rounded-xl border-slate-100 h-11"
                value={newExpense.notes}
                onChange={(e) => setNewExpense({...newExpense, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="rounded-xl h-11 px-6 font-bold text-slate-400" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddExpense} className="rounded-xl h-11 px-8 font-bold shadow-lg shadow-primary/20">Record Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesPage;
