import { useCallback, useEffect, useState } from "react";
import {
  TrendingUp,
  Plus,
  PieChart as PieIcon,
  Search,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Coins,
  Building,
  Landmark,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Percent,
  Wallet,
  Sparkles,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import useAuth from "../hooks/useAuth";
import investmentService from "../services/investmentService";
import { getErrorMessage } from "../services/api";
import {
  currentMonth,
  formatCurrency,
  formatDate,
  formatMonth,
  toDateInput,
} from "../utils/formatCurrency";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import CountUp from "../components/common/CountUp";
import { MetricSkeleton, ChartSkeleton, TransactionRowSkeleton } from "../components/common/Skeleton";

const ASSET_COLORS = {
  "Mutual Funds / SIP": "#3b82f6",
  "Stocks / Equities": "#10b981",
  "Fixed Deposit / RD": "#f59e0b",
  "Gold / SGB": "#eab308",
  "PPF / EPF / NPS": "#8b5cf6",
  "Real Estate / REITs": "#ec4899",
  "Cryptocurrency": "#06b6d4",
  "Other Investments": "#64748b",
};

function getAssetIcon(type = "") {
  const lower = type.toLowerCase();
  if (lower.includes("mutual") || lower.includes("sip")) return TrendingUp;
  if (lower.includes("stock") || lower.includes("equit")) return ArrowUpRight;
  if (lower.includes("deposit") || lower.includes("rd") || lower.includes("fd")) return Landmark;
  if (lower.includes("gold") || lower.includes("sgb")) return Coins;
  if (lower.includes("ppf") || lower.includes("nps") || lower.includes("provident")) return ShieldCheck;
  if (lower.includes("estate") || lower.includes("reit")) return Building;
  return Layers;
}

export default function Investments() {
  const { currency } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [selectedType, setSelectedType] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [data, setData] = useState({
    investments: [],
    total: 0,
    total_current_value: 0,
    total_gain: 0,
    types: [],
  });
  const [summary, setSummary] = useState(null);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "Mutual Funds / SIP",
    amount: "",
    current_value: "",
    date: toDateInput(new Date()),
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const filters = {};
      if (month) filters.month = month;
      if (selectedType) filters.type = selectedType;
      if (search) filters.search = search;

      const [listRes, sumRes] = await Promise.all([
        investmentService.list(filters),
        investmentService.summary(month),
      ]);
      setData(listRes);
      setSummary(sumRes);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [month, selectedType, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      type: "Mutual Funds / SIP",
      amount: "",
      current_value: "",
      date: toDateInput(new Date()),
      notes: "",
    });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      name: item.name,
      type: item.type,
      amount: String(item.amount),
      current_value: String(item.current_value || item.amount),
      date: toDateInput(item.date),
      notes: item.notes || "",
    });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return setFormError("Please enter an investment name");
    if (!(Number(form.amount) > 0)) return setFormError("Amount must be greater than zero");

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        amount: Number(form.amount),
        current_value: form.current_value ? Number(form.current_value) : Number(form.amount),
        date: form.date,
        notes: form.notes,
      };

      if (editing) {
        await investmentService.update(editing.id, payload);
      } else {
        await investmentService.create(payload);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete investment "${item.name}"?`)) return;
    try {
      await investmentService.remove(item.id);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  // Chart data for distribution
  const chartData = (summary?.distribution_all_time || []).map((d) => ({
    name: d.type,
    value: d.total_invested,
    color: ASSET_COLORS[d.type] || "#64748b",
  }));

  const allTimeStats = summary?.all_time || {
    total_invested: 0,
    current_value: 0,
    total_gain: 0,
    gain_percent: 0,
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Investments Portfolio
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <TrendingUp className="h-3 w-3" />
              Wealth Building
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Track Mutual Funds/SIP, Stocks, Gold, PPF, FDs and long-term assets for {formatMonth(month)}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="field w-auto font-medium"
          />
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            <span>Add Investment</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Top 4 Portfolio Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading && !summary ? (
          <>
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </>
        ) : (
          <>
            <div className="card-interactive flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Invested (All-Time)
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  <CountUp value={allTimeStats.total_invested} currency={currency} isCurrency={true} />
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">Principal capital</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <Layers className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>

            <div className="card-interactive flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Current Portfolio Value
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-brand-600 dark:text-brand-400">
                  <CountUp value={allTimeStats.current_value} currency={currency} isCurrency={true} />
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">Latest asset valuation</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                <Wallet className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>

            <div className="card-interactive flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Overall Returns / Gain
                </p>
                <p
                  className={`mt-1 text-2xl font-bold tabular-nums ${
                    allTimeStats.total_gain >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {allTimeStats.total_gain >= 0 ? "+" : ""}
                  <CountUp value={allTimeStats.total_gain} currency={currency} isCurrency={true} />
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {allTimeStats.gain_percent >= 0 ? "+" : ""}
                  {allTimeStats.gain_percent.toFixed(2)}% ROI
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <TrendingUp className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>

            <div className="card-interactive flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {formatMonth(month)} Contributions
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-purple-600 dark:text-purple-400">
                  <CountUp value={summary?.month_total || 0} currency={currency} isCurrency={true} />
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">Invested this month</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                <Coins className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Asset Distribution Chart & Summary */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="card lg:col-span-7 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Asset Class Allocation
            </h2>
            <p className="text-xs text-slate-400">
              Distribution across mutual funds, equities, fixed income & commodities
            </p>
          </div>

          {chartData.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No investment allocations recorded yet.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 items-center gap-4 pt-4">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => formatCurrency(val, currency)}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {chartData.map((item) => {
                  const percent =
                    allTimeStats.total_invested > 0
                      ? ((item.value / allTimeStats.total_invested) * 100).toFixed(1)
                      : 0;
                  return (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right shrink-0 pl-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(item.value, currency)}
                        </span>{" "}
                        <span className="text-[11px] text-slate-400">({percent}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Investment Options Supported Card */}
        <div className="card lg:col-span-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Supported Asset Classes
            </h2>
            <p className="text-xs text-slate-400">
              Diversify your portfolio across multiple wealth vehicles
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {Object.entries(ASSET_COLORS).map(([name, color]) => {
              const Icon = getAssetIcon(name);
              return (
                <div
                  key={name}
                  onClick={() => setSelectedType(selectedType === name ? "" : name)}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 cursor-pointer transition ${
                    selectedType === name
                      ? "border-brand-500 bg-brand-50/70 dark:border-brand-500 dark:bg-brand-950/40"
                      : "border-slate-100 bg-slate-50/60 hover:bg-slate-100/60 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/80"
                  }`}
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: color }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                    {name}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            💡 <strong>Tip:</strong> Automate regular contributions via monthly SIPs and long-term provident funds to maximize compound growth.
          </div>
        </div>
      </div>

      {/* Filter Bar & Transactions List */}
      <div className="space-y-4">
        <div className="card">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="Month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <Input
              as="select"
              label="Asset Class"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Asset Classes</option>
              {Object.keys(ASSET_COLORS).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Input>
            <Input
              label="Search"
              placeholder="Fund name, stock ticker, notes..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Investment Records Table / List */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Investment Records
              </h2>
              <p className="text-xs text-slate-400">
                {data.investments.length} investment{data.investments.length === 1 ? "" : "s"} found for {formatMonth(month)}
              </p>
            </div>
            {(selectedType || search) && (
              <button
                onClick={() => {
                  setSelectedType("");
                  setSearch("");
                }}
                className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
              >
                Reset Filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <TransactionRowSkeleton />
              <TransactionRowSkeleton />
              <TransactionRowSkeleton />
            </div>
          ) : data.investments.length === 0 ? (
            <EmptyState
              title="No investments found"
              subtitle="Start recording your mutual funds, equity purchases, fixed deposits or gold investments."
              actionLabel="Add Investment"
              onAction={openCreate}
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.investments.map((inv) => {
                const Icon = getAssetIcon(inv.type);
                const color = ASSET_COLORS[inv.type] || "#64748b";
                const gain = Number(inv.current_value || inv.amount) - Number(inv.amount);
                const gainPercent =
                  Number(inv.amount) > 0 ? (gain / Number(inv.amount)) * 100 : 0;

                return (
                  <div
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-4 py-3.5 px-2 rounded-xl transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                        style={{ backgroundColor: color }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                            {inv.name}
                          </p>
                          <span className="badge text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {inv.type}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                          <span>{formatDate(inv.date)}</span>
                          {inv.notes && <span>• {inv.notes}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Invested Amount</p>
                        <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                          {formatCurrency(inv.amount, currency)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-400">Current Valuation</p>
                        <p className="text-sm font-bold tabular-nums text-brand-600 dark:text-brand-400">
                          {formatCurrency(inv.current_value || inv.amount, currency)}
                        </p>
                        {gain !== 0 && (
                          <span
                            className={`text-[10px] font-semibold ${
                              gain >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {gain >= 0 ? "+" : ""}
                            {gainPercent.toFixed(1)}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(inv)}
                          title="Edit investment"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 active:scale-95 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(inv)}
                          title="Delete investment"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 text-rose-500 transition hover:bg-rose-50 hover:text-rose-700 active:scale-95 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Investment Modal */}
      <Modal
        open={modalOpen}
        title={editing ? "Edit Investment" : "Add Investment"}
        subtitle="Record an investment allocation to build your portfolio"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? "Update Investment" : "Save Investment"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {formError}
            </p>
          )}
          <Input
            label="Investment Name"
            placeholder="e.g. HDFC Index Fund, Nifty 50 ETF, Sovereign Gold Bond"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            as="select"
            label="Asset Class / Option"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {Object.keys(ASSET_COLORS).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Input>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Invested Amount"
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0.00"
            />
            <Input
              label="Current Valuation (Optional)"
              type="number"
              min="0"
              step="0.01"
              value={form.current_value}
              onChange={(e) => setForm({ ...form, current_value: e.target.value })}
              placeholder="Defaults to invested amount"
            />
          </div>
          <Input
            label="Investment Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <Input
            label="Notes / Folio / Ticker (Optional)"
            placeholder="e.g. Folio #12345, SIP date 5th, Demat account"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
