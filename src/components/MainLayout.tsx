import { Link, useLocation } from "react-router-dom";
import { ReceiptText, IndianRupee, CloudOff } from "lucide-react";
import InstallPromptBanner from "./InstallPromptBanner";
import { useOfflineSync } from "@/hooks/useOfflineSync";

interface Props {
  children: React.ReactNode;
}

export function MainLayout({ children }: Props) {
  const location = useLocation();
  const { isOnline } = useOfflineSync();

  const navItems = [
    { name: "Tracker", path: "/", icon: IndianRupee },
    { name: "Expenses", path: "/expenses", icon: ReceiptText },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans relative">
      {!isOnline && (
        <div className="bg-rose-500 text-white py-1.5 px-4 text-[11px] font-bold text-center flex items-center justify-center gap-2">
          <CloudOff className="w-3.5 h-3.5" /> YOU ARE OFFLINE — DATA WILL SYNC ONCE CONNECTED
        </div>
      )}
      
      {/* Top Navigation */}
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
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      <InstallPromptBanner />
    </div>
  );
}
