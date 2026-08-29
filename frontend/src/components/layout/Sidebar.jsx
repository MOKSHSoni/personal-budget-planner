import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart,
  Target,
  BarChart3,
  Settings,
  Plus,
  Moon,
  Sun,
  ShieldCheck,
  Lock,
  TrendingUp,
  Calendar,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";

const GROUPS = [
  {
    title: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
    ],
  },
  {
    title: "Money",
    items: [
      { to: "/income", label: "Income", icon: ArrowDownLeft },
      { to: "/expenses", label: "Expenses", icon: ArrowUpRight },
      { to: "/fixed-commitments", label: "Fixed Commitments", icon: Lock },
      { to: "/budgets", label: "Budgets", icon: PieChart },
    ],
  },
  {
    title: "Planning",
    items: [
      { to: "/calendar", label: "Bill Calendar", icon: Calendar },
      { to: "/investments", label: "Investments", icon: TrendingUp },
      { to: "/goals", label: "Goals", icon: Target },
      { to: "/reports", label: "Reports", icon: BarChart3 },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar({ open, onNavigate, onQuickAdd }) {
  const { user, currency } = useAuth();

  return (
    <aside
      className={`${
        open ? "block" : "hidden"
      } fixed inset-y-0 left-0 z-40 w-64 shrink-0 flex-col justify-between border-r border-slate-200/80 bg-white p-4 transition-all duration-200 dark:border-slate-800/80 dark:bg-slate-900 md:static md:flex md:w-64`}
    >
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm ring-2 ring-brand-500/20">
            <ShieldCheck className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              Budget Planner
            </h2>
            <p className="text-[11px] font-medium text-slate-400">Personal Finance</p>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="px-1">
          <NavLink
            to="/expenses"
            onClick={onNavigate}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow active:scale-[0.98] dark:bg-brand-600 dark:hover:bg-brand-500"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" strokeWidth={2.5} />
            <span>+ Add Transaction</span>
          </NavLink>
        </div>

        {/* Grouped Navigation */}
        <nav className="space-y-5">
          {GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150 ${
                          isActive
                            ? "bg-brand-50/80 font-semibold text-brand-700 shadow-subtle dark:bg-brand-950/60 dark:text-brand-300"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={`h-4 w-4 shrink-0 transition-colors ${
                              isActive
                                ? "text-brand-600 dark:text-brand-400"
                                : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                            }`}
                            strokeWidth={isActive ? 2.25 : 1.75}
                          />
                          <span>{item.label}</span>
                          {isActive && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-600 dark:bg-brand-400" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User Profile Compact Footer */}
      <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800 dark:bg-brand-900/60 dark:text-brand-200">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
              {user?.name || "User"}
            </p>
            <p className="truncate text-[11px] text-slate-400">
              {currency} · {user?.email}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

