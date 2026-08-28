import { Link } from "react-router-dom";
import { Menu, Sun, Moon, LogOut, ShieldCheck } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import Button from "../common/Button";

export default function Navbar({ onToggleSidebar, sidebarOpen }) {
  const { user, logout, currency, updateUser } = useAuth();

  const isDarkMode = user?.theme === "dark" || document.documentElement.classList.contains("dark");

  const toggleTheme = () => {
    const nextTheme = isDarkMode ? "light" : "dark";
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    if (user) {
      updateUser({ ...user, theme: nextTheme });
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 md:hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>

        <Link to="/" className="flex items-center gap-2.5 md:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2} />
            <ShieldCheck className="h-5 w-5" strokeWidth={2} />
          </div>
          <span className="text-base font-bold text-slate-900 dark:text-white">
            Budget Planner
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Currency Pill */}
        <div className="hidden items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold tracking-wide text-slate-600 dark:border-slate-700/80 dark:bg-slate-800 dark:text-slate-300 sm:flex">
          {currency}
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4 text-amber-400" strokeWidth={2} />
          ) : (
            <Moon className="h-4 w-4 text-slate-600" strokeWidth={2} />
          )}
        </button>

        {/* User Badge & Avatar */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-sm ring-2 ring-brand-500/20">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <span className="hidden text-xs font-semibold text-slate-700 dark:text-slate-200 sm:inline">
            {user?.name}
          </span>
        </div>

        {/* Logout Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={logout}
          className="ml-1 text-xs"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}

