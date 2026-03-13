import { useState } from "react";
import { supabase, isConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Play, Database, AlertCircle, Table as TableIcon, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function SQLConsole() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || "1234";
    if (password === adminPassword) {
      setIsAuthenticated(true);
      toast.success("Authenticated successfully");
    } else {
      toast.error("Incorrect password");
    }
  };

  const runQuery = async () => {
    if (!query.trim()) return;
    if (!isConfigured) {
      toast.error("Supabase is not configured.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setColumns([]);

    try {
      const { data, error: pgError } = await supabase.rpc("exec_sql", {
        sql_query: query,
      });

      if (pgError) throw pgError;

      if (data && Array.isArray(data)) {
        if (data.length > 0) {
          setColumns(Object.keys(data[0]));
          setResults(data);
          toast.success(`Query successful - ${data.length} rows returned`);
        } else {
          toast.success("Query successful - No rows returned");
        }
      } else {
        toast.success("Command executed successfully");
      }
    } catch (err: any) {
      console.error("SQL Error:", err);
      setError(err.message || "An error occurred while running the query.");
      toast.error("Query failed");
    } finally {
      setIsLoading(false);
    }
  };

  const exportResults = () => {
    if (results.length === 0) return;
    const csvContent = [
      columns.join(","),
      ...results.map(row => columns.map(col => `"${row[col] || ""}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `query_results_${new Date().toISOString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full animate-in fade-in zoom-in duration-300">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col items-center text-center space-y-6">
            <div className="p-4 bg-indigo-50 rounded-2xl">
              <Database className="w-8 h-8 text-indigo-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">Console Locked</h1>
              <p className="text-slate-500 text-sm">Please enter the administrator password to access the SQL console.</p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="pass" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Password</Label>
                <Input 
                  id="pass"
                  type="password" 
                  autoFocus
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border-slate-200 h-11 focus:ring-indigo-500"
                />
              </div>
              <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-100">
                Unlock Console
              </Button>
            </form>
            
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Direct database access requires authorization.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <main className="container py-8 space-y-6 max-w-5xl animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <Database className="w-5 h-5 text-indigo-600" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">SQL Console</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">Run raw SQL queries against your database</p>
          </div>
        </div>

        {/* Editor Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sql-query" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Query Editor (PostgreSQL)
            </Label>
            <textarea
              id="sql-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SELECT * FROM daily_snapshots LIMIT 10;"
              className="w-full h-48 p-4 font-mono text-sm bg-slate-900 text-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" />
              Only admins should run destructive commands (DELETE, DROP, etc.)
            </div>
            <Button 
              onClick={runQuery} 
              disabled={isLoading || !query.trim()}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 px-6 rounded-xl"
            >
              <Play className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
              {isLoading ? "Running..." : "Run Query"}
            </Button>
          </div>
        </div>

        {/* Results Card */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 text-rose-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-mono whitespace-pre-wrap">{error}</div>
          </div>
        )}

        {(results.length > 0 || columns.length > 0) && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Results ({results.length})</span>
              </div>
              <Button variant="ghost" size="sm" onClick={exportResults} className="text-slate-500 gap-2 hover:bg-white rounded-lg">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
            
            <div className="overflow-x-auto max-h-[500px]">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col} className="text-[11px] font-bold uppercase tracking-wider text-slate-500 py-4 px-6 border-none">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((row, i) => (
                    <TableRow key={i} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                      {columns.map((col) => {
                        const val = row[col];
                        const isObject = val !== null && typeof val === 'object';
                        return (
                          <TableCell key={col} className="px-6 py-4 text-sm text-slate-600 font-medium">
                            {isObject ? (
                              <pre className="text-[11px] bg-slate-50 p-2 rounded-lg max-w-xs overflow-hidden text-ellipsis">
                                {JSON.stringify(val, null, 2)}
                              </pre>
                            ) : (
                              String(val ?? "NULL")
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!error && results.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="p-4 bg-slate-50 rounded-full mb-4">
              <TableIcon className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-slate-600 font-semibold text-lg">No results yet</h3>
            <p className="text-slate-400 text-sm">Write a query above and click "Run Query" to see data</p>
          </div>
        )}
      </main>
    </div>
  );
}
