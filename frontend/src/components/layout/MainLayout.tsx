import { Link, useLocation } from "react-router-dom";
import { IndianRupee, CloudOff, Activity } from "lucide-react";
import InstallPromptBanner from "./InstallPromptBanner";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Show, SignIn, UserButton, useUser } from "@clerk/react";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useEffect, useRef } from "react";

function LoginLogger() {
  const { user, isLoaded } = useUser();
  const { logActivity } = useActivityLog();
  const loggedRef = useRef(false);

  useEffect(() => {
    if (isLoaded && user && !loggedRef.current) {
      const fullName = user.fullName || user.username || user.firstName || "User";
      logActivity("LOGIN", `${fullName} logged in to the dashboard`);
      loggedRef.current = true;
    }
  }, [isLoaded, user, logActivity]);

  return null;
}

interface Props {
  children: React.ReactNode;
}

export function MainLayout({ children }: Props) {
  const location = useLocation();
  const { isOnline } = useOfflineSync();
  useSupabaseSync(); // Synchronize Clerk Auth with Supabase client

  const navItems = [
    { name: "Tracker", path: "/", icon: IndianRupee },
    { name: "Activity", path: "/activity", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans relative">
      {!isOnline && (
        <div className="bg-rose-500 text-white py-1.5 px-4 text-[11px] font-bold text-center flex items-center justify-center gap-2">
          <CloudOff className="w-3.5 h-3.5" /> YOU ARE OFFLINE — DATA WILL SYNC ONCE CONNECTED
        </div>
      )}
      
      {/* Top Premium Floating Navigation - Only shown when signed in */}
      <Show when="signed-in">
        <header className="sticky top-0 z-50 w-full px-3 sm:px-6 pt-3 pb-2 sm:pt-4 sm:pb-3 pointer-events-none">
          <div className="max-w-5xl mx-auto w-full pointer-events-auto">
            <div className="bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_36px_rgb(0,0,0,0.07)] rounded-2xl sm:rounded-3xl px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 transition-all duration-300">
              {/* Brand Logo & Title */}
              <Link to="/" className="flex items-center gap-2.5 group shrink-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 group-hover:shadow-indigo-500/40 transition-all duration-300">
                  <IndianRupee className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-slate-900 text-sm sm:text-base tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                      Money Flow
                    </span>
                    <span className="hidden sm:inline-flex text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100/80 leading-none">
                      Pro
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 leading-tight">
                    Daily Ledger
                  </span>
                </div>
              </Link>

              {/* Segmented Navigation Pill Tabs */}
              <nav className="bg-slate-100/80 p-1 rounded-xl sm:rounded-2xl flex items-center gap-1 border border-slate-200/50 shadow-inner">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                        isActive
                          ? "bg-white text-slate-900 shadow-sm shadow-slate-900/10 scale-[1.02]"
                          : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${
                          isActive ? "text-indigo-600" : "text-slate-400"
                        }`}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span className="tracking-tight">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Right Section: Status Indicator & User Profile */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[11px] font-bold tracking-tight">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Sync Active</span>
                </div>

                <div className="h-5 w-px bg-slate-200/80 hidden sm:block" />

                <div className="flex items-center">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        userButtonAvatarBox:
                          "w-8 h-8 sm:w-9 sm:h-9 ring-2 ring-indigo-500/20 hover:ring-indigo-500/50 transition-all rounded-full shadow-sm hover:scale-105",
                        userButtonPopoverCard:
                          "shadow-2xl rounded-2xl border border-slate-100",
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>
      </Show>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <Show when="signed-in">
          <LoginLogger />
          <div className="h-full animate-in fade-in duration-500">
            {children}
          </div>
        </Show>

        <Show when="signed-out">
          <div className="min-h-screen w-full flex items-center justify-center p-4">
            <SignIn routing="hash" />
          </div>
        </Show>
      </main>

      <Show when="signed-in">
        <InstallPromptBanner />
      </Show>
    </div>
  );
}
