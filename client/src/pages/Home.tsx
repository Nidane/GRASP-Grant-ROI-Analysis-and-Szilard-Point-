/**
 * Grant ROI & Szilard Point Calculator
 * Design: Bold Policy Brief — deep navy, amber accent, Playfair Display + Inter
 *
 * Revisions applied:
 * 1. User-input fields clearly labelled
 * 2. Currency-agnostic (no AUD specification)
 * 3. Generic global language, examples only where helpful
 * 4. "Annualised Expected Grant Value" terminology from manuscript
 * 5. CI labels are generic (Investigator A/B/etc.), annual salary clearly stated
 * 6. Per-CI individual FTE input; salary cost = Σ(salary_i × FTE_i)
 * 7. ROI=1 annotated as "Szilard Point" on gauge and chart
 * 8. Verdict banner larger and more alarming
 * 9. Szilard Point card shows FTE value prominently
 * 10. Related Research links to key references from the manuscript
 *
 * Formula (Ni & Nanan 2026):
 *   ROI = Annualised Expected Grant Value / Σ(Salary_i × FTE_i)
 *   Annualised EGV = (Grant Amount × Success Rate) / Grant Duration
 *   Szilard Point = FTE at which ROI = 1
 *     → for uniform FTE: FTE* = Annualised EGV / Total Salary
 *     → for per-CI FTE: shown as current ROI vs threshold
 */

import { useState, useMemo, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import {
  Plus,
  Trash2,
  Info,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  BookOpen,
  ExternalLink,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CI {
  id: string;
  label: string;
  annualSalary: string;
  fte: string; // individual % time on this grant application
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function fmt(n: number, decimals = 2): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtCurrency(n: number): string {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtPct(n: number): string {
  if (!isFinite(n)) return "—";
  return (n * 100).toFixed(1) + "%";
}

// ─── ROI Gauge ────────────────────────────────────────────────────────────────

function ROIGauge({ roi }: { roi: number | null }) {
  const value = roi === null ? 0 : Math.min(roi, 3);
  const maxVal = 3;
  const pct = value / maxVal;

  const startAngle = 210;
  const sweepAngle = 240;
  const endAngle = startAngle + sweepAngle * pct;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const cx = 100, cy = 100, r = 72;

  const arcPath = (start: number, end: number) => {
    const s = toRad(start);
    const e = toRad(end);
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const needleAngle = startAngle + sweepAngle * pct;
  const needleRad = toRad(needleAngle);
  const nx = cx + 58 * Math.cos(needleRad);
  const ny = cy + 58 * Math.sin(needleRad);

  // Szilard point marker at ROI = 1 (1/3 of max)
  const szilardAngle = startAngle + sweepAngle * (1 / maxVal);
  const szilardRad = toRad(szilardAngle);
  const sx1 = cx + 60 * Math.cos(szilardRad);
  const sy1 = cy + 60 * Math.sin(szilardRad);
  const sx2 = cx + 82 * Math.cos(szilardRad);
  const sy2 = cy + 82 * Math.sin(szilardRad);
  // Label position
  const slx = cx + 92 * Math.cos(szilardRad);
  const sly = cy + 92 * Math.sin(szilardRad);

  let color = "oklch(0.60 0.18 145)"; // green
  if (roi !== null && roi < 1.0) color = "oklch(0.60 0.20 25)"; // red
  else if (roi !== null && roi < 1.5) color = "oklch(0.75 0.15 65)"; // amber

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 175" className="w-52 h-44">
        {/* Track */}
        <path
          d={arcPath(startAngle, startAngle + sweepAngle)}
          fill="none"
          stroke="oklch(0.28 0.04 255)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Value arc */}
        {roi !== null && roi > 0 && (
          <path
            d={arcPath(startAngle, endAngle)}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
          />
        )}
        {/* Szilard point tick */}
        <line x1={sx1} y1={sy1} x2={sx2} y2={sy2} stroke="oklch(0.75 0.15 65)" strokeWidth="2.5" />
        {/* Szilard point label */}
        <text
          x={slx}
          y={sly + 4}
          fontSize="7.5"
          fill="oklch(0.85 0.12 65)"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontWeight="600"
        >
          Szilard
        </text>
        <text
          x={slx}
          y={sly + 13}
          fontSize="7.5"
          fill="oklch(0.85 0.12 65)"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontWeight="600"
        >
          Point
        </text>
        {/* Needle */}
        {roi !== null && (
          <line
            x1={cx} y1={cy}
            x2={nx} y2={ny}
            stroke="oklch(0.94 0.01 255)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
        <circle cx={cx} cy={cy} r="5" fill="oklch(0.94 0.01 255)" />
        {/* Scale labels */}
        <text x="26" y="148" fontSize="9" fill="oklch(0.50 0.04 255)" textAnchor="middle">0</text>
        <text x="100" y="22" fontSize="9" fill="oklch(0.50 0.04 255)" textAnchor="middle">1.5</text>
        <text x="174" y="148" fontSize="9" fill="oklch(0.50 0.04 255)" textAnchor="middle">3+</text>
      </svg>
      <div
        className="text-5xl font-bold mt-0 result-number"
        style={{
          fontFamily: "'Playfair Display', serif",
          color: roi === null ? "oklch(0.45 0.04 255)" : color,
          transition: "color 0.3s ease",
          lineHeight: 1,
        }}
      >
        {roi === null ? "—" : fmt(roi, 2)}
      </div>
      <div className="text-xs mt-1.5" style={{ color: "oklch(0.50 0.04 255)" }}>
        Return on Investment (ROI)
      </div>
    </div>
  );
}

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const roi = payload[0]?.value as number;
  const color = roi >= 1 ? "oklch(0.70 0.18 145)" : "oklch(0.70 0.18 25)";
  return (
    <div
      className="rounded-lg px-3 py-2 text-sm shadow-xl"
      style={{
        background: "oklch(0.18 0.04 255)",
        border: "1px solid oklch(0.30 0.04 255)",
        color: "oklch(0.94 0.01 255)",
      }}
    >
      <div style={{ color: "oklch(0.55 0.04 255)", fontSize: "0.75rem" }}>
        Uniform FTE: {(label * 100).toFixed(1)}%
      </div>
      <div style={{ color, fontWeight: 600 }}>ROI: {fmt(roi, 3)}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const REFERENCE_LINKS = [
  {
    label: "Dresler et al. (2022) — Nature Human Behaviour",
    url: "https://www.nature.com/articles/s41562-021-01286-3",
  },
  {
    label: "Herbert et al. (2013) — Nature",
    url: "https://www.nature.com/articles/495314a",
  },
  {
    label: "Schweiger (2025) — Nature",
    url: "https://www.nature.com/articles/d41586-025-00479-2",
  },
  {
    label: "Naddaf (2025) — Nature",
    url: "https://www.nature.com/articles/d41586-025-01567-z",
  },
];

export default function Home() {
  // ── Grant inputs ──
  const [grantAmount, setGrantAmount] = useState<string>("1000000");
  const [successRate, setSuccessRate] = useState<string>("12");
  const [grantDuration, setGrantDuration] = useState<string>("3");

  // ── CI team ──
  const [cis, setCIs] = useState<CI[]>([
    { id: uid(), label: "Investigator A", annualSalary: "180000", fte: "15" },
    { id: uid(), label: "Investigator B", annualSalary: "130000", fte: "15" },
  ]);

  const [showFormula, setShowFormula] = useState(false);
  const [showRefs, setShowRefs] = useState(false);

  // ── Calculations ──
  const calc = useMemo(() => {
    const amount = parseFloat(grantAmount.replace(/,/g, "")) || 0;
    const rate = parseFloat(successRate) / 100 || 0;
    const duration = parseFloat(grantDuration) || 3;

    // Per-CI salary cost = salary_i × (fte_i / 100)
    const ciData = cis.map((ci) => ({
      label: ci.label,
      salary: parseFloat(ci.annualSalary.replace(/,/g, "")) || 0,
      fte: parseFloat(ci.fte) / 100 || 0,
      cost: (parseFloat(ci.annualSalary.replace(/,/g, "")) || 0) * (parseFloat(ci.fte) / 100 || 0),
    }));

    const totalSalary = ciData.reduce((s, c) => s + c.salary, 0);
    const totalWritingCost = ciData.reduce((s, c) => s + c.cost, 0);

    if (amount <= 0 || rate <= 0 || duration <= 0 || totalSalary <= 0) return null;

    // Formula (2): Annualised Expected Grant Value
    const annualisedEGV = (amount * rate) / duration;

    // Formula (1): ROI = Annualised EGV / Total Writing Cost
    const roi = totalWritingCost > 0 ? annualisedEGV / totalWritingCost : null;

    // Szilard Point FTE (uniform FTE scenario for the chart)
    const szilardFTE = annualisedEGV / totalSalary;

    // Average FTE across CIs (for chart reference line)
    const avgFTE = ciData.length > 0
      ? ciData.reduce((s, c) => s + c.fte, 0) / ciData.length
      : 0;

    // Chart: ROI vs uniform FTE (0.5% to 50%)
    const chartData = Array.from({ length: 100 }, (_, i) => {
      const f = (i + 1) / 200;
      return {
        fte: f,
        roi: annualisedEGV / (totalSalary * f),
      };
    });

    return {
      amount,
      rate,
      duration,
      totalSalary,
      totalWritingCost,
      annualisedEGV,
      roi,
      szilardFTE,
      avgFTE,
      chartData,
      ciData,
    };
  }, [grantAmount, successRate, grantDuration, cis]);

  // ── CI management ──
  const addCI = useCallback(() => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    setCIs((prev) => [
      ...prev,
      {
        id: uid(),
        label: `Investigator ${letters[prev.length] ?? prev.length + 1}`,
        annualSalary: "130000",
        fte: "15",
      },
    ]);
  }, []);

  const removeCI = useCallback((id: string) => {
    setCIs((prev) => prev.filter((ci) => ci.id !== id));
  }, []);

  const updateCI = useCallback((id: string, field: keyof CI, value: string) => {
    setCIs((prev) => prev.map((ci) => (ci.id === id ? { ...ci, [field]: value } : ci)));
  }, []);

  // ── Verdict ──
  const verdict = useMemo(() => {
    if (!calc || calc.roi === null) return null;
    if (calc.roi >= 1.5)
      return {
        type: "good",
        label: "WELL ABOVE THE SZILARD POINT",
        desc: "The expected grant value substantially exceeds the cost of writing. This application is financially well-justified.",
      };
    if (calc.roi >= 1.0)
      return {
        type: "good",
        label: "ABOVE THE SZILARD POINT",
        desc: "The expected return exceeds the salary cost of writing. The application is financially justified at the current time investment.",
      };
    if (calc.roi >= 0.7)
      return {
        type: "warn",
        label: "APPROACHING THE SZILARD POINT",
        desc: "You are close to the break-even threshold. Consider reducing writing time or targeting a higher-success-rate scheme.",
      };
    return {
      type: "bad",
      label: "BELOW THE SZILARD POINT",
      desc: "The salary cost of writing this grant exceeds the expected return. The team is investing more than the application is statistically worth.",
    };
  }, [calc]);

  // ── Shared input style ──
  const inputClass = "navy-input";

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.14 0.04 255)" }}>
      {/* ── Header ── */}
      <header
        className="border-b"
        style={{ borderColor: "oklch(0.22 0.04 255)", background: "oklch(0.12 0.04 255)" }}
      >
        <div className="container py-4 flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-xl font-bold leading-tight"
              style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.94 0.01 255)" }}
            >
              Grant ROI &amp; Szilard Point Calculator
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.50 0.04 255)" }}>
              Based on Ni &amp; Nanan (2026) —{" "}
              <em>When grant writing costs more than it pays: A return-on-investment analysis</em>
            </p>
          </div>
          <div className="relative shrink-0">
            <button
              onClick={() => setShowRefs((v) => !v)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors"
              style={{
                background: "oklch(0.75 0.15 65 / 0.12)",
                border: "1px solid oklch(0.75 0.15 65 / 0.35)",
                color: "oklch(0.85 0.12 65)",
              }}
            >
              <BookOpen size={12} />
              Key References
              <ExternalLink size={10} />
            </button>
            {showRefs && (
              <div
                className="absolute right-0 top-9 z-50 rounded-xl shadow-2xl p-3 w-72 space-y-1"
                style={{
                  background: "oklch(0.18 0.04 255)",
                  border: "1px solid oklch(0.28 0.04 255)",
                }}
              >
                {REFERENCE_LINKS.map((ref) => (
                  <a
                    key={ref.url}
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    style={{ color: "oklch(0.75 0.08 255)" }}
                  >
                    <ExternalLink size={10} className="mt-0.5 shrink-0" style={{ color: "oklch(0.75 0.15 65)" }} />
                    {ref.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container py-6 lg:py-10">
        {/* ── User input notice ── */}
        <div
          className="mb-6 rounded-xl px-4 py-3 flex items-center gap-3 text-sm"
          style={{
            background: "oklch(0.75 0.15 65 / 0.08)",
            border: "1px solid oklch(0.75 0.15 65 / 0.25)",
            color: "oklch(0.80 0.10 65)",
          }}
        >
          <Info size={15} className="shrink-0" />
          <span>
            <strong>How to use:</strong> Fill in all fields in the left panel — grant details, investigator team salaries, and the time each investigator will spend writing this application. Results update instantly.
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* ══════════════════════════════════════════
              LEFT PANEL — INPUTS
          ══════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-5">

            {/* Grant Details */}
            <section
              className="rounded-xl p-5"
              style={{ background: "oklch(0.18 0.04 255)", border: "1px solid oklch(0.24 0.04 255)" }}
            >
              <h2
                className="text-base font-semibold mb-1"
                style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.94 0.01 255)" }}
              >
                Grant Details
              </h2>
              <p className="text-xs mb-4" style={{ color: "oklch(0.50 0.04 255)" }}>
                Enter the parameters of the grant scheme you are applying to.
              </p>

              <div className="space-y-4">
                {/* Grant Amount */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "oklch(0.80 0.04 255)" }}>
                    Grant Amount Requested <span style={{ color: "oklch(0.75 0.15 65)" }}>*</span>
                  </label>
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="10000"
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(e.target.value)}
                    placeholder="e.g. 1 000 000"
                  />
                  <p className="text-xs mt-1" style={{ color: "oklch(0.42 0.04 255)" }}>
                    Total funding requested (any currency)
                  </p>
                </div>

                {/* Success Rate */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "oklch(0.80 0.04 255)" }}>
                    Scheme Success Rate (%) <span style={{ color: "oklch(0.75 0.15 65)" }}>*</span>
                  </label>
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={successRate}
                    onChange={(e) => setSuccessRate(e.target.value)}
                    placeholder="e.g. 12"
                  />
                  <p className="text-xs mt-1" style={{ color: "oklch(0.42 0.04 255)" }}>
                    The historical or published success rate of this grant scheme (e.g., NHMRC Ideas Grant 2025: 8.1%; ARC Discovery Project 2025: 12.9%)
                  </p>
                </div>

                {/* Grant Duration */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "oklch(0.80 0.04 255)" }}>
                    Grant Duration (years) <span style={{ color: "oklch(0.75 0.15 65)" }}>*</span>
                  </label>
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    value={grantDuration}
                    onChange={(e) => setGrantDuration(e.target.value)}
                    placeholder="e.g. 3"
                  />
                  <p className="text-xs mt-1" style={{ color: "oklch(0.42 0.04 255)" }}>
                    The funding period if awarded (e.g., most NHMRC and ARC grants run for 3–4 years)
                  </p>
                </div>
              </div>
            </section>

            {/* Investigator Team */}
            <section
              className="rounded-xl p-5"
              style={{ background: "oklch(0.18 0.04 255)", border: "1px solid oklch(0.24 0.04 255)" }}
            >
              <div className="flex items-center justify-between mb-1">
                <h2
                  className="text-base font-semibold"
                  style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.94 0.01 255)" }}
                >
                  Investigator Team
                </h2>
                <button
                  onClick={addCI}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    background: "oklch(0.75 0.15 65 / 0.12)",
                    border: "1px solid oklch(0.75 0.15 65 / 0.35)",
                    color: "oklch(0.85 0.12 65)",
                  }}
                >
                  <Plus size={12} />
                  Add Investigator
                </button>
              </div>
              <p className="text-xs mb-4" style={{ color: "oklch(0.50 0.04 255)" }}>
                For each investigator, enter their name/label, annual salary, and the percentage of their annual working time they will spend on this application.
              </p>

              <div className="space-y-4">
                {cis.map((ci, idx) => (
                  <div
                    key={ci.id}
                    className="rounded-lg p-3 space-y-2"
                    style={{ background: "oklch(0.15 0.04 255)", border: "1px solid oklch(0.22 0.04 255)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold" style={{ color: "oklch(0.75 0.15 65)" }}>
                        Investigator {idx + 1}
                      </span>
                      {cis.length > 1 && (
                        <button
                          onClick={() => removeCI(ci.id)}
                          className="p-1 rounded transition-colors"
                          style={{ color: "oklch(0.45 0.04 255)" }}
                          title="Remove investigator"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    {/* Name/label */}
                    <div>
                      <label className="block text-xs mb-1" style={{ color: "oklch(0.60 0.04 255)" }}>
                        Name / Label
                      </label>
                      <input
                        className={inputClass + " text-sm"}
                        type="text"
                        value={ci.label}
                        onChange={(e) => updateCI(ci.id, "label", e.target.value)}
                        placeholder="e.g. Investigator A, or a name"
                      />
                    </div>

                    {/* Annual salary */}
                    <div>
                      <label className="block text-xs mb-1" style={{ color: "oklch(0.60 0.04 255)" }}>
                        Annual Salary <span style={{ color: "oklch(0.75 0.15 65)" }}>*</span>
                      </label>
                      <input
                        className={inputClass + " text-sm"}
                        type="number"
                        min="0"
                        step="1000"
                        value={ci.annualSalary}
                        onChange={(e) => updateCI(ci.id, "annualSalary", e.target.value)}
                        placeholder="Annual salary (same currency as grant)"
                      />
                      <p className="text-xs mt-0.5" style={{ color: "oklch(0.38 0.04 255)" }}>
                        Full annual salary in the same currency as the grant amount
                      </p>
                    </div>

                    {/* Individual FTE */}
                    <div>
                      <label className="block text-xs mb-1" style={{ color: "oklch(0.60 0.04 255)" }}>
                        Time Spent on This Application (% of annual working time){" "}
                        <span style={{ color: "oklch(0.75 0.15 65)" }}>*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="1"
                          max="50"
                          step="1"
                          value={ci.fte}
                          onChange={(e) => updateCI(ci.id, "fte", e.target.value)}
                          className="flex-1"
                          style={{ accentColor: "oklch(0.75 0.15 65)" }}
                        />
                        <div className="flex items-center gap-1">
                          <input
                            className={inputClass + " text-sm text-center w-14"}
                            type="number"
                            min="1"
                            max="50"
                            step="1"
                            value={ci.fte}
                            onChange={(e) => updateCI(ci.id, "fte", e.target.value)}
                          />
                          <span className="text-xs" style={{ color: "oklch(0.55 0.04 255)" }}>%</span>
                        </div>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "oklch(0.38 0.04 255)" }}>
                        e.g., 15% means this investigator will spend 15% of their annual working time on this application
                      </p>
                    </div>

                    {/* Per-CI cost preview */}
                    {(() => {
                      const sal = parseFloat(ci.annualSalary.replace(/,/g, "")) || 0;
                      const f = parseFloat(ci.fte) / 100 || 0;
                      const cost = sal * f;
                      return cost > 0 ? (
                        <div
                          className="flex justify-between text-xs pt-1"
                          style={{ borderTop: "1px solid oklch(0.22 0.04 255)", color: "oklch(0.50 0.04 255)" }}
                        >
                          <span>Writing cost (salary × FTE)</span>
                          <span style={{ color: "oklch(0.75 0.15 65)", fontWeight: 600 }}>
                            {fmtCurrency(cost)}
                          </span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                ))}
              </div>

              {/* Total writing cost */}
              {calc && (
                <div
                  className="mt-3 pt-3 space-y-1"
                  style={{ borderTop: "1px solid oklch(0.24 0.04 255)" }}
                >
                  <div className="flex justify-between text-xs" style={{ color: "oklch(0.55 0.04 255)" }}>
                    <span>Total team salary / year</span>
                    <span style={{ color: "oklch(0.80 0.01 255)", fontWeight: 600 }}>
                      {fmtCurrency(calc.totalSalary)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: "oklch(0.55 0.04 255)" }}>
                    <span>Total writing cost / year (Σ salary × FTE)</span>
                    <span style={{ color: "oklch(0.85 0.12 65)", fontWeight: 600 }}>
                      {fmtCurrency(calc.totalWritingCost)}
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* Formula toggle */}
            <button
              onClick={() => setShowFormula((v) => !v)}
              className="flex items-center gap-2 text-xs w-full text-left transition-colors"
              style={{ color: "oklch(0.55 0.04 255)" }}
            >
              <Info size={13} />
              {showFormula ? "Hide" : "Show"} calculation methodology
            </button>
            {showFormula && (
              <div className="formula-block text-xs space-y-3">
                <div style={{ color: "oklch(0.75 0.15 65)", fontWeight: 600 }}>
                  Ni &amp; Nanan (2026) — Formulae
                </div>
                <div>
                  <span style={{ color: "oklch(0.65 0.08 255)" }}>Formula (1) — ROI:</span>
                  <br />
                  ROI = Annualised Expected Grant Value
                  <br />
                  {"      "}/ Σ (Salary_i × FTE_i)
                </div>
                <div>
                  <span style={{ color: "oklch(0.65 0.08 255)" }}>Formula (2) — Annualised EGV:</span>
                  <br />
                  EGV/yr = (Grant Amount × Success Rate)
                  <br />
                  {"          "}/ Grant Duration (years)
                </div>
                <div>
                  <span style={{ color: "oklch(0.65 0.08 255)" }}>Szilard Point (uniform FTE):</span>
                  <br />
                  FTE* = EGV/yr / Total Salary
                  <br />
                  {"       "}(FTE at which ROI = 1)
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════
              RIGHT PANEL — RESULTS
          ══════════════════════════════════════════ */}
          <div className="lg:col-span-3 space-y-5">

            {/* Verdict Banner */}
            {verdict ? (
              <div
                className={`rounded-xl p-5 flex items-start gap-4 transition-all duration-300 ${
                  verdict.type === "good"
                    ? "verdict-good"
                    : verdict.type === "warn"
                    ? "verdict-neutral"
                    : "verdict-bad"
                }`}
                style={{ minHeight: "80px" }}
              >
                <div className="shrink-0 mt-0.5">
                  {verdict.type === "good" ? (
                    <CheckCircle size={24} />
                  ) : verdict.type === "warn" ? (
                    <AlertTriangle size={24} />
                  ) : (
                    <TrendingDown size={24} />
                  )}
                </div>
                <div>
                  <div
                    className="font-extrabold tracking-widest uppercase"
                    style={{ fontSize: "1.05rem", letterSpacing: "0.08em", lineHeight: 1.2 }}
                  >
                    {verdict.label}
                  </div>
                  <div className="text-sm mt-1.5 opacity-85 leading-relaxed">{verdict.desc}</div>
                </div>
              </div>
            ) : (
              <div
                className="rounded-xl p-5 text-sm"
                style={{
                  background: "oklch(0.16 0.04 255)",
                  border: "1px dashed oklch(0.26 0.04 255)",
                  color: "oklch(0.45 0.04 255)",
                }}
              >
                Complete the input fields on the left to see your ROI verdict.
              </div>
            )}

            {/* Key metrics row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* ROI Gauge */}
              <div
                className="col-span-2 rounded-xl p-5 flex flex-col items-center justify-center"
                style={{ background: "oklch(0.18 0.04 255)", border: "1px solid oklch(0.24 0.04 255)" }}
              >
                <ROIGauge roi={calc?.roi ?? null} />
              </div>

              {/* Szilard Point */}
              <div
                className="rounded-xl p-4 flex flex-col"
                style={{ background: "oklch(0.18 0.04 255)", border: "1px solid oklch(0.24 0.04 255)" }}
              >
                <div className="text-xs font-semibold mb-2" style={{ color: "oklch(0.60 0.04 255)" }}>
                  Szilard Point
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div
                    className="font-bold result-number"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: "oklch(0.85 0.12 65)",
                      fontSize: "2rem",
                      lineHeight: 1.1,
                    }}
                  >
                    {calc ? fmtPct(calc.szilardFTE) : "—"}
                  </div>
                  <div className="text-xs mt-1.5 leading-snug" style={{ color: "oklch(0.50 0.04 255)" }}>
                    Maximum FTE before ROI falls below 1
                  </div>
                </div>
                <div
                  className="szilard-badge mt-3 self-start"
                  style={{ fontSize: "0.7rem" }}
                >
                  Break-even threshold
                </div>
              </div>

              {/* Annualised EGV */}
              <div
                className="rounded-xl p-4 flex flex-col"
                style={{ background: "oklch(0.18 0.04 255)", border: "1px solid oklch(0.24 0.04 255)" }}
              >
                <div className="text-xs font-semibold mb-2" style={{ color: "oklch(0.60 0.04 255)" }}>
                  Annualised Expected Grant Value
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div
                    className="font-bold result-number"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: "oklch(0.94 0.01 255)",
                      fontSize: "1.4rem",
                      lineHeight: 1.1,
                    }}
                  >
                    {calc ? fmtCurrency(calc.annualisedEGV) : "—"}
                  </div>
                  <div className="text-xs mt-1.5 leading-snug" style={{ color: "oklch(0.50 0.04 255)" }}>
                    (Grant × Rate) ÷ Duration
                  </div>
                </div>
              </div>
            </div>

            {/* ROI vs FTE Chart */}
            <section
              className="rounded-xl p-5"
              style={{ background: "oklch(0.18 0.04 255)", border: "1px solid oklch(0.24 0.04 255)" }}
            >
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2
                  className="text-base font-semibold"
                  style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.94 0.01 255)" }}
                >
                  ROI vs. Time Invested
                </h2>
                {calc && (
                  <div className="szilard-badge">
                    Szilard Point: {fmtPct(calc.szilardFTE)} FTE
                  </div>
                )}
              </div>
              <p className="text-xs mb-3" style={{ color: "oklch(0.45 0.04 255)" }}>
                This curve shows how ROI changes as a function of uniform FTE across all investigators. The vertical amber line marks the Szilard Point (ROI = 1). The white dashed line shows the current average FTE of your team.
              </p>

              {calc ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={calc.chartData} margin={{ top: 5, right: 16, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.60 0.18 145)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="oklch(0.60 0.18 145)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.04 255)" vertical={false} />
                    <XAxis
                      dataKey="fte"
                      tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                      tick={{ fill: "oklch(0.48 0.04 255)", fontSize: 10 }}
                      axisLine={{ stroke: "oklch(0.26 0.04 255)" }}
                      tickLine={false}
                      label={{
                        value: "FTE devoted to grant writing (uniform across team)",
                        position: "insideBottom",
                        offset: -12,
                        fill: "oklch(0.42 0.04 255)",
                        fontSize: 10,
                      }}
                    />
                    <YAxis
                      tick={{ fill: "oklch(0.48 0.04 255)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => fmt(v, 1)}
                      label={{
                        value: "ROI",
                        angle: -90,
                        position: "insideLeft",
                        fill: "oklch(0.42 0.04 255)",
                        fontSize: 10,
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {/* ROI = 1 / Szilard Point horizontal line */}
                    <ReferenceLine
                      y={1}
                      stroke="oklch(0.75 0.15 65)"
                      strokeDasharray="5 3"
                      strokeWidth={1.5}
                      label={{
                        value: "Szilard Point (ROI = 1)",
                        position: "right",
                        fill: "oklch(0.80 0.12 65)",
                        fontSize: 9,
                      }}
                    />
                    {/* Szilard Point vertical line */}
                    <ReferenceLine
                      x={calc.szilardFTE}
                      stroke="oklch(0.75 0.15 65)"
                      strokeWidth={2}
                      label={{
                        value: `Szilard Pt. ${fmtPct(calc.szilardFTE)}`,
                        position: "insideTopRight",
                        fill: "oklch(0.85 0.12 65)",
                        fontSize: 9,
                      }}
                    />
                    {/* Current average FTE */}
                    {calc.avgFTE > 0 && (
                      <ReferenceLine
                        x={calc.avgFTE}
                        stroke="oklch(0.94 0.01 255)"
                        strokeDasharray="4 3"
                        strokeWidth={1.5}
                        label={{
                          value: "Avg. FTE",
                          position: "top",
                          fill: "oklch(0.75 0.01 255)",
                          fontSize: 9,
                        }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="roi"
                      stroke="oklch(0.60 0.18 145)"
                      strokeWidth={2.5}
                      fill="url(#roiGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: "oklch(0.60 0.18 145)" }}
                      isAnimationActive
                      animationDuration={400}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div
                  className="h-60 flex items-center justify-center text-sm rounded-lg"
                  style={{
                    background: "oklch(0.15 0.04 255)",
                    color: "oklch(0.40 0.04 255)",
                    border: "1px dashed oklch(0.22 0.04 255)",
                  }}
                >
                  Enter grant details and investigator salaries to generate the ROI curve
                </div>
              )}
            </section>

            {/* Calculation Summary */}
            {calc && (
              <section
                className="rounded-xl p-5"
                style={{ background: "oklch(0.18 0.04 255)", border: "1px solid oklch(0.24 0.04 255)" }}
              >
                <h2
                  className="text-base font-semibold mb-4"
                  style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.94 0.01 255)" }}
                >
                  Calculation Summary
                </h2>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["Grant amount requested", fmtCurrency(calc.amount)],
                      ["Scheme success rate", fmtPct(calc.rate)],
                      ["Grant duration", `${calc.duration} year${calc.duration !== 1 ? "s" : ""}`],
                      ["Annualised Expected Grant Value", fmtCurrency(calc.annualisedEGV)],
                      ["Total team salary / year", fmtCurrency(calc.totalSalary)],
                      ["Total writing cost / year (Σ salary × FTE)", fmtCurrency(calc.totalWritingCost)],
                      ["Current ROI", calc.roi !== null ? fmt(calc.roi, 3) : "—"],
                      ["Szilard Point (break-even FTE, uniform)", fmtPct(calc.szilardFTE)],
                    ].map(([label, value], i) => (
                      <tr
                        key={i}
                        style={{ borderBottom: i < 7 ? "1px solid oklch(0.21 0.04 255)" : "none" }}
                      >
                        <td className="py-2 pr-4" style={{ color: "oklch(0.58 0.04 255)" }}>
                          {label}
                        </td>
                        <td
                          className="py-2 text-right font-semibold"
                          style={{
                            color:
                              label === "Current ROI"
                                ? calc.roi !== null && calc.roi >= 1
                                  ? "oklch(0.70 0.18 145)"
                                  : "oklch(0.70 0.18 25)"
                                : label.startsWith("Szilard")
                                ? "oklch(0.85 0.12 65)"
                                : label === "Total writing cost / year (Σ salary × FTE)"
                                ? "oklch(0.85 0.12 65)"
                                : "oklch(0.94 0.01 255)",
                          }}
                        >
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Per-CI breakdown */}
                {calc.ciData.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs font-semibold mb-2" style={{ color: "oklch(0.60 0.04 255)" }}>
                      Per-Investigator Writing Cost Breakdown
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom: "1px solid oklch(0.24 0.04 255)" }}>
                          {["Investigator", "Annual Salary", "FTE", "Writing Cost / yr"].map((h) => (
                            <th
                              key={h}
                              className="pb-1.5 text-left font-medium"
                              style={{ color: "oklch(0.48 0.04 255)" }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {calc.ciData.map((ci, i) => (
                          <tr
                            key={i}
                            style={{ borderBottom: i < calc.ciData.length - 1 ? "1px solid oklch(0.20 0.04 255)" : "none" }}
                          >
                            <td className="py-1.5" style={{ color: "oklch(0.75 0.04 255)" }}>{ci.label}</td>
                            <td className="py-1.5" style={{ color: "oklch(0.75 0.04 255)" }}>{fmtCurrency(ci.salary)}</td>
                            <td className="py-1.5" style={{ color: "oklch(0.75 0.04 255)" }}>{fmtPct(ci.fte)}</td>
                            <td className="py-1.5 font-semibold" style={{ color: "oklch(0.85 0.12 65)" }}>
                              {fmtCurrency(ci.cost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* Interpretation Guide */}
            <section
              className="rounded-xl p-5"
              style={{ background: "oklch(0.15 0.04 255)", border: "1px solid oklch(0.21 0.04 255)" }}
            >
              <h2
                className="text-sm font-semibold mb-3"
                style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.78 0.01 255)" }}
              >
                How to Interpret Your Results
              </h2>
              <div className="space-y-2 text-xs leading-relaxed" style={{ color: "oklch(0.52 0.04 255)" }}>
                <p>
                  <strong style={{ color: "oklch(0.70 0.18 145)" }}>ROI &gt; 1:</strong> The annualised expected grant value exceeds the salary cost of writing — the application is financially justified at the current time investment.
                </p>
                <p>
                  <strong style={{ color: "oklch(0.85 0.12 65)" }}>ROI = 1 (Szilard Point):</strong> The break-even threshold. Writing beyond this FTE costs more than the expected return. The Szilard Point FTE shown is calculated assuming a uniform FTE across all investigators.
                </p>
                <p>
                  <strong style={{ color: "oklch(0.70 0.18 25)" }}>ROI &lt; 1:</strong> The salary cost of writing exceeds the expected value of the grant. Consider reducing team size, writing time, or targeting a higher-success-rate scheme.
                </p>
                <p className="pt-1" style={{ color: "oklch(0.40 0.04 255)" }}>
                  Note: This analysis focuses on the direct financial return of the grant application process from the applicant's perspective. It does not account for downstream benefits of funded research (publications, career advancement, societal impact), which are real but not quantifiable at the time of application decision.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t mt-8 py-5"
        style={{ borderColor: "oklch(0.20 0.04 255)", background: "oklch(0.12 0.04 255)" }}
      >
        <div className="container text-xs text-center" style={{ color: "oklch(0.38 0.04 255)" }}>
          Based on: Ni D &amp; Nanan R (2026).{" "}
          <em>When grant writing costs more than it pays: A return-on-investment analysis.</em>{" "}
          · For research and informational purposes only.
        </div>
      </footer>
    </div>
  );
}
