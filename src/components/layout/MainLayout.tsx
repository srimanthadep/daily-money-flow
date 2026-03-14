import { Link, useLocation } from "react-router-dom";
import { ReceiptText, IndianRupee, CloudOff, Database } from "lucide-react";
import InstallPromptBanner from "./InstallPromptBanner";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";

interface Props {
  children: React.ReactNode;
}

export function MainLayout({ children }: Props) {
  const location = useLocation();
  const { isOnline } = useOfflineSync();

  const navItems = [
    { name: "Tracker", path: "/", icon: IndianRupee },
    { name: "Expenses", path: "/expenses", icon: ReceiptText },
    { name: "SQL Console", path: "/sql-console", icon: Database },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans relative">
      {!isOnline && (
        <div className="bg-rose-500 text-white py-1.5 px-4 text-[11px] font-bold text-center flex items-center justify-center gap-2">
          <CloudOff className="w-3.5 h-3.5" /> YOU ARE OFFLINE — DATA WILL SYNC ONCE CONNECTED
        </div>
      )}
      
      {/* Top Navigation - Only visible when signed in */}
      <Show when="signed-in">
        <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-6 h-20 flex items-center shadow-sm backdrop-blur-md bg-white/90">
          <div className="container max-w-5xl mx-auto flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[15px] font-semibold transition-all duration-200 ${
                    isActive 
                      ? "bg-[#4338CA] text-white shadow-lg shadow-indigo-100" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-[18px] h-[18px] ${isActive ? "text-white" : "text-slate-400"}`} />
                  {item.name}
                </Link>
              );
            })}
            
            {/* Clerk Auth Integration */}
            <div className="ml-auto flex items-center gap-2">
              <UserButton />
            </div>
          </div>
        </header>
      </Show>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <Show when="signed-in">
          <div className="h-full animate-in fade-in duration-500">
            {children}
          </div>
        </Show>

        <Show when="signed-out">
          <div className="h-screen w-full flex items-center justify-center p-4 bg-[#fafaff] relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60" />
            
            <div className="max-w-sm w-full relative z-10">
              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-white p-6 md:p-8 text-center space-y-5 animate-in zoom-in fade-in duration-700">
                {/* Logo Area */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-indigo-600 blur-2xl opacity-20" />
                  <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center mx-auto">
                    <IndianRupee className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Smart Money <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
                      Flow Control
                    </span>
                  </h1>
                </div>
                
                <div className="flex flex-col gap-3">
                  <SignInButton mode="modal">
                    <button className="h-14 bg-slate-900 hover:bg-black text-white text-base font-bold rounded-2xl shadow-xl shadow-slate-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                      Sign In
                      <span className="text-white/30">→</span>
                    </button>
                  </SignInButton>
                  
                  <SignUpButton mode="modal">
                    <button className="h-14 bg-white hover:bg-slate-50 text-slate-600 text-base font-bold rounded-2xl border-2 border-slate-100 transition-all active:scale-[0.98]">
                      Create Account
                    </button>
                  </SignUpButton>
                </div>

                <div className="pt-2 flex items-center justify-center gap-4 opacity-30">
                  <div className="flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    <span className="text-[8px] font-bold tracking-widest uppercase">Safe</span>
                  </div>
                  <div className="h-2 w-px bg-slate-200" />
                  <div className="flex items-center gap-1">
                    <CloudOff className="w-3 h-3" />
                    <span className="text-[8px] font-bold tracking-widest uppercase">Sync</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </main>

      <Show when="signed-in">
        <InstallPromptBanner />
      </Show>
    </div>
  );
}
