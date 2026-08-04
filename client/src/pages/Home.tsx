/**
 * Grant ROI & Szilard Point Calculator
 *
 * Design: Bold Policy Brief — deep navy, amber accent, Playfair Display + Inter
 * Formula (from Ni & Nanan manuscript):
 *   ROI = Expected Value of Awarded Grant per Year
 *         / (Salary Cost of All CIs per Year × FTE used for grant application)
 *
 *   Expected Value per Year = (Grant Amount × Success Rate) / Grant Duration (years)
 *   Salary Cost per Year = Sum of all CI annual salaries
 *   Szilard Point FTE = Expected Value per Year / Salary Cost per Year
 *     (i.e., the FTE at which ROI = 1)
 */

import { useState, useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Plus, Trash2, Info, AlertTriangle, CheckCircle, TrendingDown, BookOpen, ExternalLink } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CI {
  id: string;
  label: string;
  annualSalary: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function fmt(n: number, decimals = 2): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-AU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtCurrency(n: number): string {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtPct(n: number): string {
  if (!isFinite(n)) return "—";
  return (n * 100).toFixed(1) + "%";
}

// ─── ROI Gauge (SVG arc) ──────────────────────────────────────────────────────

function ROIGauge({ roi }: { roi: number | null }) {
  const value = roi === null ? 0 : Math.min(roi, 3);
  const maxVal = 3;
  const pct = value / maxVal;

  // Arc from 210° to 330° (240° sweep)
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

  // Needle
  const needleAngle = startAngle + sweepAngle * pct;
  const needleRad = toRad(needleAngle);
  const nx = cx + 58 * Math.cos(needleRad);
  const ny = cy + 58 * Math.sin(needleRad);

  // Color
  let color = "#4caf82"; // green
  if (roi !== null && roi < 0.5) color = "#e05252";
  else if (roi !== null && roi < 1.0) color = "#e05252";
  else if (roi !== null && roi < 1.5) color = "#f5a623";

  const displayRoi = roi === null ? "—" : fmt(roi, 2);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 160" className="w-48 h-36">
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
            style={{ transition: "stroke-dashoffset 0.4s ease-out, stroke 0.3s ease" }}
          />
        )}
        {/* ROI = 1 marker */}
        {(() => {
          const markerAngle = startAngle + sweepAngle * (1 / maxVal);
          const mr = toRad(markerAngle);
          const mx1 = cx + 62 * Math.cos(mr);
          const my1 = cy + 62 * Math.sin(mr);
          const mx2 = cx + 80 * Math.cos(mr);
          const my2 = cy + 80 * Math.sin(mr);
          return (
            <line
              x1={mx1} y1={my1} x2={mx2} y2={my2}
              stroke="oklch(0.75 0.15 65)"
              strokeWidth="2"
              strokeDasharray="3 2"
            />
          );
        })()}
        {/* Needle */}
        {roi !== null && (
          <line
            x1={cx} y1={cy}
            x2={nx} y2={ny}
            stroke="oklch(0.94 0.01 255)"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ transition: "x2 0.4s ease-out, y2 0.4s ease-out" }}
          />
        )}
        <circle cx={cx} cy={cy} r="5" fill="oklch(0.94 0.01 255)" />
        {/* Labels */}
        <text x="28" y="148" fontSize="9" fill="oklch(0.55 0.04 255)" textAnchor="middle">0</text>
        <text x="100" y="22" fontSize="9" fill="oklch(0.55 0.04 255)" textAnchor="middle">1.5</text>
        <text x="172" y="148" fontSize="9" fill="oklch(0.55 0.04 255)" textAnchor="middle">3+</text>
        {/* ROI = 1 label */}
        <text x="138" y="38" fontSize="8" fill="oklch(0.75 0.15 65)" textAnchor="middle">ROI=1</text>
      </svg>
      <div
        className="text-4xl font-bold mt-1 result-number"
        style={{
          fontFamily: "'Playfair Display', serif",
          color: roi === null ? "oklch(0.50 0.04 255)" : color,
          transition: "color 0.3s ease",
        }}
      >
        {displayRoi}
      </div>
      <div className="text-xs mt-1" style={{ color: "oklch(0.55 0.04 255)" }}>
        Return on Investment
      </div>
    </div>
  );
}

// ─── Custom Tooltip for chart ─────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const roi = payload[0]?.value as number;
  const color = roi >= 1 ? "#4caf82" : "#e05252";
  return (
    <div
      className="rounded-lg px-3 py-2 text-sm shadow-xl"
      style={{
        background: "oklch(0.18 0.04 255)",
        border: "1px solid oklch(0.30 0.04 255)",
        color: "oklch(0.94 0.01 255)",
      }}
    >
      <div style={{ color: "oklch(0.60 0.04 255)" }}>FTE: {(label * 100).toFixed(1)}%</div>
      <div style={{ color }}>ROI: {fmt(roi, 3)}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Home() {
  // Inputs
  const [grantAmount, setGrantAmount] = useState<string>("1000000");
  const [successRate, setSuccessRate] = useState<string>("12");
  const [grantDuration, setGrantDuration] = useState<string>("3");
  const [cis, setCIs] = useState<CI[]>([
    { id: uid(), label: "CI 1 (Senior, ≥10 yrs post-PhD)", annualSalary: "180000" },
    { id: uid(), label: "CI 2 (Mid-career, <10 yrs post-PhD)", annualSalary: "130000" },
  ]);
  const [currentFTE, setCurrentFTE] = useState<string>("15");
  const [showFormula, setShowFormula] = useState(false);

  // Derived calculations
  const calc = useMemo(() => {
    const amount = parseFloat(grantAmount.replace(/,/g, "")) || 0;
    const rate = parseFloat(successRate) / 100 || 0;
    const duration = parseFloat(grantDuration) || 3;
    const fte = parseFloat(currentFTE) / 100 || 0;

    const totalSalary = cis.reduce((sum, ci) => {
      return sum + (parseFloat(ci.annualSalary.replace(/,/g, "")) || 0);
    }, 0);

    if (amount <= 0 || rate <= 0 || duration <= 0 || totalSalary <= 0) {
      return null;
    }

    // Formula (1): ROI = Expected Value per Year / (Total Salary × FTE)
    // Formula (2): Expected Value per Year = (Grant Amount × Success Rate) / Duration
    const expectedValuePerYear = (amount * rate) / duration;
    const salaryCostPerYear = totalSalary; // full annual salary of all CIs
    const szilardFTE = expectedValuePerYear / salaryCostPerYear; // FTE at which ROI = 1
    const roi = fte > 0 ? expectedValuePerYear / (salaryCostPerYear * fte) : null;

    // Chart data: ROI vs FTE from 0.01 to 0.50 (1% to 50%)
    const chartData = Array.from({ length: 100 }, (_, i) => {
      const f = (i + 1) / 200; // 0.005 to 0.500
      return {
        fte: f,
        roi: expectedValuePerYear / (salaryCostPerYear * f),
      };
    });

    return {
      amount,
      rate,
      duration,
      totalSalary,
      expectedValuePerYear,
      salaryCostPerYear,
      szilardFTE,
      roi,
      fte,
      chartData,
    };
  }, [grantAmount, successRate, grantDuration, cis, currentFTE]);

  // CI management
  const addCI = useCallback(() => {
    setCIs((prev) => [
      ...prev,
      { id: uid(), label: `CI ${prev.length + 1}`, annualSalary: "130000" },
    ]);
  }, []);

  const removeCI = useCallback((id: string) => {
    setCIs((prev) => prev.filter((ci) => ci.id !== id));
  }, []);

  const updateCI = useCallback((id: string, field: keyof CI, value: string) => {
    setCIs((prev) =>
      prev.map((ci) => (ci.id === id ? { ...ci, [field]: value } : ci))
    );
  }, []);

  // Verdict
  const verdict = useMemo(() => {
    if (!calc || calc.roi === null) return null;
    if (calc.roi >= 1.5) return { type: "good", label: "WELL ABOVE SZILARD POINT", desc: "Grant writing is financially justified at this FTE level." };
    if (calc.roi >= 1.0) return { type: "good", label: "ABOVE SZILARD POINT", desc: "Expected return exceeds the cost of writing at this FTE." };
    if (calc.roi >= 0.7) return { type: "warn", label: "APPROACHING SZILARD POINT", desc: "You are close to the break-even threshold. Consider reducing writing time." };
    return { type: "bad", label: "BELOW SZILARD POINT", desc: "Grant writing is costing more than the expected return at this FTE." };
  }, [calc]);

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.14 0.04 255)" }}>
      {/* Header */}
      <header
        className="border-b"
        style={{
          borderColor: "oklch(0.22 0.04 255)",
          background: "oklch(0.12 0.04 255)",
        }}
      >
        <div className="container py-4 flex items-center justify-between">
          <div>
            <h1
              className="text-xl font-bold leading-tight"
              style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.94 0.01 255)" }}
            >
              Grant ROI &amp; Szilard Point Calculator
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.04 255)" }}>
              Based on Ni &amp; Nanan (2026) — <em>When grant writing costs more than it pays</em>
            </p>
          </div>
          <a
            href="https://www.nature.com/articles/s41562-021-01286-3"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors"
            style={{
              background: "oklch(0.75 0.15 65 / 0.12)",
              border: "1px solid oklch(0.75 0.15 65 / 0.35)",
              color: "oklch(0.85 0.12 65)",
            }}
          >
            <BookOpen size={12} />
            Related Research
            <ExternalLink size={10} />
          </a>
        </div>
      </header>

      <main className="container py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* ── LEFT: Inputs ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Grant Details */}
            <section
              className="rounded-xl p-5"
              style={{
                background: "oklch(0.18 0.04 255)",
                border: "1px solid oklch(0.24 0.04 255)",
              }}
            >
              <h2
                className="text-base font-semibold mb-4"
                style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.94 0.01 255)" }}
              >
                Grant Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.70 0.04 255)" }}>
                    Grant Amount Requested (AUD)
                  </label>
                  <input
                    className="navy-input"
                    type="number"
                    min="0"
                    step="10000"
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(e.target.value)}
                    placeholder="e.g. 1000000"
                  />
                  <p className="text-xs mt-1" style={{ color: "oklch(0.45 0.04 255)" }}>
                    Total funding you are applying for
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.70 0.04 255)" }}>
                    Scheme Success Rate (%)
                  </label>
                  <input
                    className="navy-input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={successRate}
                    onChange={(e) => setSuccessRate(e.target.value)}
                    placeholder="e.g. 12"
                  />
                  <p className="text-xs mt-1" style={{ color: "oklch(0.45 0.04 255)" }}>
                    NHMRC Ideas 2025: ~8.1% · ARC DP 2025: ~12.9%
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.70 0.04 255)" }}>
                    Grant Duration (years)
                  </label>
                  <input
                    className="navy-input"
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    value={grantDuration}
                    onChange={(e) => setGrantDuration(e.target.value)}
                    placeholder="e.g. 3"
                  />
                  <p className="text-xs mt-1" style={{ color: "oklch(0.45 0.04 255)" }}>
                    NHMRC Ideas &amp; ARC DP typically span 3–4 years
                  </p>
                </div>
              </div>
            </section>

            {/* CI Team Salaries */}
            <section
              className="rounded-xl p-5"
              style={{
                background: "oklch(0.18 0.04 255)",
                border: "1px solid oklch(0.24 0.04 255)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-base font-semibold"
                  style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.94 0.01 255)" }}
                >
                  Chief Investigator Team
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
                  Add CI
                </button>
              </div>
              <div className="space-y-3">
                {cis.map((ci, idx) => (
                  <div key={ci.id} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-1.5">
                      <input
                        className="navy-input text-sm"
                        type="text"
                        value={ci.label}
                        onChange={(e) => updateCI(ci.id, "label", e.target.value)}
                        placeholder={`CI ${idx + 1} name/role`}
                      />
                      <div className="relative">
                        <span
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                          style={{ color: "oklch(0.55 0.04 255)" }}
                        >
                          $
                        </span>
                        <input
                          className="navy-input text-sm pl-6"
                          type="number"
                          min="0"
                          step="1000"
                          value={ci.annualSalary}
                          onChange={(e) => updateCI(ci.id, "annualSalary", e.target.value)}
                          placeholder="Annual salary (AUD)"
                        />
                      </div>
                    </div>
                    {cis.length > 1 && (
                      <button
                        onClick={() => removeCI(ci.id)}
                        className="mt-1 p-1.5 rounded-lg transition-colors"
                        style={{ color: "oklch(0.55 0.04 255)" }}
                        title="Remove CI"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {calc && (
                <div
                  className="mt-3 pt-3 flex justify-between text-xs"
                  style={{ borderTop: "1px solid oklch(0.24 0.04 255)", color: "oklch(0.60 0.04 255)" }}
                >
                  <span>Total CI salary / year</span>
                  <span style={{ color: "oklch(0.85 0.12 65)", fontWeight: 600 }}>
                    {fmtCurrency(calc.totalSalary)}
                  </span>
                </div>
              )}
              <p className="text-xs mt-2" style={{ color: "oklch(0.45 0.04 255)" }}>
                Use NHMRC PSP rates as a guide: PSP3 ~$115k, PSP4 ~$145k, PSP5 ~$185k/yr
              </p>
            </section>

            {/* FTE Slider */}
            <section
              className="rounded-xl p-5"
              style={{
                background: "oklch(0.18 0.04 255)",
                border: "1px solid oklch(0.24 0.04 255)",
              }}
            >
              <h2
                className="text-base font-semibold mb-1"
                style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.94 0.01 255)" }}
              >
                Time Spent on Grant Writing
              </h2>
              <p className="text-xs mb-4" style={{ color: "oklch(0.55 0.04 255)" }}>
                What proportion of each CI's annual working time is devoted to this application?
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={currentFTE}
                  onChange={(e) => setCurrentFTE(e.target.value)}
                  className="flex-1"
                  style={{ accentColor: "oklch(0.75 0.15 65)" }}
                />
                <div className="flex items-center gap-1">
                  <input
                    className="navy-input text-center w-16 text-sm"
                    type="number"
                    min="1"
                    max="50"
                    step="1"
                    value={currentFTE}
                    onChange={(e) => setCurrentFTE(e.target.value)}
                  />
                  <span className="text-sm" style={{ color: "oklch(0.60 0.04 255)" }}>%</span>
                </div>
              </div>
              <p className="text-xs mt-2" style={{ color: "oklch(0.45 0.04 255)" }}>
                Literature estimate: 10–15% FTE per application (Herbert et al. 2013; LinkedIn surveys 2025)
              </p>
            </section>

            {/* Formula Toggle */}
            <button
              onClick={() => setShowFormula((v) => !v)}
              className="flex items-center gap-2 text-xs w-full text-left transition-colors"
              style={{ color: "oklch(0.60 0.04 255)" }}
            >
              <Info size={13} />
              {showFormula ? "Hide" : "Show"} calculation methodology
            </button>
            {showFormula && (
              <div className="formula-block text-xs space-y-2">
                <div style={{ color: "oklch(0.75 0.15 65)", fontWeight: 600, marginBottom: "0.5rem" }}>
                  Ni &amp; Nanan (2026) — Formulae
                </div>
                <div>
                  <span style={{ color: "oklch(0.65 0.08 255)" }}>Formula (1) — ROI:</span>
                  <br />
                  ROI = Expected Value per Year
                  <br />
                  {"      "}/ (Salary Cost per Year × FTE)
                </div>
                <div>
                  <span style={{ color: "oklch(0.65 0.08 255)" }}>Formula (2) — Expected Value:</span>
                  <br />
                  EV/yr = (Grant Amount × Success Rate)
                  <br />
                  {"         "}/ Grant Duration (years)
                </div>
                <div>
                  <span style={{ color: "oklch(0.65 0.08 255)" }}>Szilard Point FTE:</span>
                  <br />
                  FTE* = EV/yr / Salary Cost per Year
                  <br />
                  {"       "}(FTE at which ROI = 1)
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Results ── */}
          <div className="lg:col-span-3 space-y-5">
            {/* Verdict Banner */}
            {verdict && (
              <div
                className={`rounded-xl p-4 flex items-start gap-3 transition-all duration-300 ${
                  verdict.type === "good"
                    ? "verdict-good"
                    : verdict.type === "warn"
                    ? "verdict-neutral"
                    : "verdict-bad"
                }`}
              >
                {verdict.type === "good" ? (
                  <CheckCircle size={18} className="mt-0.5 shrink-0" />
                ) : verdict.type === "warn" ? (
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                ) : (
                  <TrendingDown size={18} className="mt-0.5 shrink-0" />
                )}
                <div>
                  <div className="text-sm font-bold tracking-wide">{verdict.label}</div>
                  <div className="text-xs mt-0.5 opacity-80">{verdict.desc}</div>
                </div>
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* ROI Gauge */}
              <div
                className="col-span-2 sm:col-span-2 rounded-xl p-5 flex flex-col items-center justify-center"
                style={{
                  background: "oklch(0.18 0.04 255)",
                  border: "1px solid oklch(0.24 0.04 255)",
                }}
              >
                <ROIGauge roi={calc?.roi ?? null} />
              </div>

              {/* Szilard Point */}
              <div
                className="rounded-xl p-4 flex flex-col justify-between"
                style={{
                  background: "oklch(0.18 0.04 255)",
                  border: "1px solid oklch(0.24 0.04 255)",
                }}
              >
                <div className="text-xs font-medium mb-2" style={{ color: "oklch(0.60 0.04 255)" }}>
                  Szilard Point
                </div>
                <div>
                  <div
                    className="text-2xl font-bold result-number"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: "oklch(0.85 0.12 65)",
                    }}
                  >
                    {calc ? fmtPct(calc.szilardFTE) : "—"}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "oklch(0.50 0.04 255)" }}>
                    Max FTE before ROI &lt; 1
                  </div>
                </div>
                <div className="szilard-badge mt-3 text-xs">
                  Break-even
                </div>
              </div>

              {/* Expected Value */}
              <div
                className="rounded-xl p-4 flex flex-col justify-between"
                style={{
                  background: "oklch(0.18 0.04 255)",
                  border: "1px solid oklch(0.24 0.04 255)",
                }}
              >
                <div className="text-xs font-medium mb-2" style={{ color: "oklch(0.60 0.04 255)" }}>
                  Expected Value / yr
                </div>
                <div>
                  <div
                    className="text-xl font-bold result-number"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: "oklch(0.94 0.01 255)",
                    }}
                  >
                    {calc ? fmtCurrency(calc.expectedValuePerYear) : "—"}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "oklch(0.50 0.04 255)" }}>
                    Grant × Rate ÷ Duration
                  </div>
                </div>
              </div>
            </div>

            {/* ROI vs FTE Chart */}
            <section
              className="rounded-xl p-5"
              style={{
                background: "oklch(0.18 0.04 255)",
                border: "1px solid oklch(0.24 0.04 255)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
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

              {calc ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={calc.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.60 0.18 145)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.60 0.18 145)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.24 0.04 255)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="fte"
                      tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                      tick={{ fill: "oklch(0.50 0.04 255)", fontSize: 11 }}
                      axisLine={{ stroke: "oklch(0.28 0.04 255)" }}
                      tickLine={false}
                      label={{
                        value: "FTE devoted to grant writing",
                        position: "insideBottom",
                        offset: -2,
                        fill: "oklch(0.45 0.04 255)",
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      tick={{ fill: "oklch(0.50 0.04 255)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => fmt(v, 1)}
                      label={{
                        value: "ROI",
                        angle: -90,
                        position: "insideLeft",
                        fill: "oklch(0.45 0.04 255)",
                        fontSize: 11,
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {/* ROI = 1 line */}
                    <ReferenceLine
                      y={1}
                      stroke="oklch(0.75 0.15 65)"
                      strokeDasharray="5 3"
                      strokeWidth={1.5}
                      label={{
                        value: "ROI = 1",
                        position: "right",
                        fill: "oklch(0.75 0.15 65)",
                        fontSize: 10,
                      }}
                    />
                    {/* Current FTE */}
                    <ReferenceLine
                      x={parseFloat(currentFTE) / 100}
                      stroke="oklch(0.94 0.01 255)"
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                      label={{
                        value: "Your FTE",
                        position: "top",
                        fill: "oklch(0.80 0.01 255)",
                        fontSize: 10,
                      }}
                    />
                    {/* Szilard point */}
                    <ReferenceLine
                      x={calc.szilardFTE}
                      stroke="oklch(0.75 0.15 65)"
                      strokeWidth={2}
                      label={{
                        value: "Szilard Pt.",
                        position: "insideTopRight",
                        fill: "oklch(0.85 0.12 65)",
                        fontSize: 10,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="roi"
                      stroke="oklch(0.60 0.18 145)"
                      strokeWidth={2.5}
                      fill="url(#roiGradient)"
                      dot={false}
                      activeDot={{ r: 4, fill: "oklch(0.60 0.18 145)" }}
                      isAnimationActive={true}
                      animationDuration={400}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div
                  className="h-60 flex items-center justify-center text-sm rounded-lg"
                  style={{
                    background: "oklch(0.16 0.04 255)",
                    color: "oklch(0.45 0.04 255)",
                    border: "1px dashed oklch(0.24 0.04 255)",
                  }}
                >
                  Enter grant details and CI salaries to generate the ROI curve
                </div>
              )}
            </section>

            {/* Summary Table */}
            {calc && (
              <section
                className="rounded-xl p-5"
                style={{
                  background: "oklch(0.18 0.04 255)",
                  border: "1px solid oklch(0.24 0.04 255)",
                }}
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
                      ["Grant amount", fmtCurrency(calc.amount)],
                      ["Success rate", fmtPct(calc.rate)],
                      ["Grant duration", `${calc.duration} years`],
                      ["Expected value / year", fmtCurrency(calc.expectedValuePerYear)],
                      ["Total CI salary / year", fmtCurrency(calc.totalSalary)],
                      ["FTE devoted to writing", fmtPct(calc.fte)],
                      ["Salary cost of writing / year", fmtCurrency(calc.totalSalary * calc.fte)],
                      ["Current ROI", calc.roi !== null ? fmt(calc.roi, 3) : "—"],
                      ["Szilard Point (break-even FTE)", fmtPct(calc.szilardFTE)],
                    ].map(([label, value], i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: i < 8 ? "1px solid oklch(0.22 0.04 255)" : "none",
                        }}
                      >
                        <td className="py-2 pr-4" style={{ color: "oklch(0.60 0.04 255)" }}>
                          {label}
                        </td>
                        <td
                          className="py-2 text-right font-medium"
                          style={{
                            color:
                              label === "Current ROI"
                                ? calc.roi !== null && calc.roi >= 1
                                  ? "oklch(0.70 0.18 145)"
                                  : "oklch(0.70 0.18 25)"
                                : label === "Szilard Point (break-even FTE)"
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
              </section>
            )}

            {/* Interpretation Guide */}
            <section
              className="rounded-xl p-5"
              style={{
                background: "oklch(0.16 0.04 255)",
                border: "1px solid oklch(0.22 0.04 255)",
              }}
            >
              <h2
                className="text-sm font-semibold mb-3"
                style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.80 0.01 255)" }}
              >
                How to Interpret Your Results
              </h2>
              <div className="space-y-2 text-xs" style={{ color: "oklch(0.55 0.04 255)", lineHeight: "1.6" }}>
                <p>
                  <strong style={{ color: "oklch(0.85 0.12 65)" }}>ROI &gt; 1:</strong> The expected grant value exceeds the salary cost of writing — the application is financially justified at this FTE level.
                </p>
                <p>
                  <strong style={{ color: "oklch(0.75 0.15 65)" }}>ROI = 1 (Szilard Point):</strong> The break-even threshold. Writing beyond this FTE costs more than the expected return.
                </p>
                <p>
                  <strong style={{ color: "oklch(0.70 0.18 25)" }}>ROI &lt; 1:</strong> The salary cost of writing exceeds the expected value of the grant. Consider reducing team size, writing time, or targeting higher-success-rate schemes.
                </p>
                <p className="pt-1" style={{ color: "oklch(0.45 0.04 255)" }}>
                  Note: This analysis focuses on the direct financial return of the grant application process. It does not account for the downstream benefits of funded research (publications, career advancement, societal impact), which are real but not quantifiable at the time of application.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t mt-8 py-5"
        style={{
          borderColor: "oklch(0.20 0.04 255)",
          background: "oklch(0.12 0.04 255)",
        }}
      >
        <div className="container text-xs text-center" style={{ color: "oklch(0.40 0.04 255)" }}>
          Based on: Ni D &amp; Nanan R (2026). <em>When grant writing costs more than it pays: A return-on-investment analysis.</em> · Calculator for research purposes only.
        </div>
      </footer>
    </div>
  );
}
