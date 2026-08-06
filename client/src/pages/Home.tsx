/**
 * GRASP — Grant ROI Analysis and Szilard Point Platform
 * Design: Bold Policy Brief — deep navy, amber accent, Playfair Display + Inter
 *
 * Formula (Ni & Nanan 2026, Authorea DOI: 10.22541/au.176918698.87912423):
 *   ROI = Annualised Expected Grant Value / (Total Salary × FTE)
 *   Annualised EGV = (Grant Amount × Success Rate) / Grant Duration
 *   Szilard Point FTE* = Annualised EGV / Total Salary  (FTE at which ROI = 1)
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

  // Szilard Point marker at ROI = 1 (1/3 of max scale)
  const szilardAngle = startAngle + sweepAngle * (1 / maxVal);
  const szilardRad = toRad(szilardAngle);
  const sx1 = cx + 60 * Math.cos(szilardRad);
  const sy1 = cy + 60 * Math.sin(szilardRad);
  const sx2 = cx + 82 * Math.cos(szilardRad);
  const sy2 = cy + 82 * Math.sin(szilardRad);
  const slx = cx + 93 * Math.cos(szilardRad);
  const sly = cy + 93 * Math.sin(szilardRad);

  let color = "oklch(0.60 0.18 145)";
  if (roi !== null && roi < 1.0) color = "oklch(0.60 0.20 25)";
  else if (roi !== null && roi < 1.5) color = "oklch(0.75 0.15 65)";

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
        {/* Szilard Point tick mark */}
        <line x1={sx1} y1={sy1} x2={sx2} y2={sy2} stroke="oklch(0.75 0.15 65)" strokeWidth="2.5" />
        {/* Szilard Point label */}
        <text x={slx} y={sly + 3} fontSize="7.5" fill="oklch(0.85 0.12 65)" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="600">Szilard</text>
        <text x={slx} y={sly + 12} fontSize="7.5" fill="oklch(0.85 0.12 65)" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="600">Point</text>
        {/* Needle */}
        {roi !== null && (
          <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="oklch(0.94 0.01 255)" strokeWidth="2.5" strokeLinecap="round" />
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
        Estimated Return on Investment (ROI)
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
        FTE: {(label * 100).toFixed(1)}%
      </div>
      <div style={{ color, fontWeight: 600 }}>ROI: {fmt(roi, 3)}</div>
    </div>
  );
}

// ─── Reference links ──────────────────────────────────────────────────────────

const REFERENCE_LINKS = [
  {
    label: "Ni & Nanan (2026) — Preprint (Authorea) — This model",
    url: "https://www.authorea.com/doi/full/10.22541/au.176918698.87912423/v1",
  },
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Home() {
  // Grant inputs
  const [grantAmount, setGrantAmount] = useState<string>("1000000");
  const [successRate, setSuccessRate] = useState<string>("12");
  const [grantDuration, setGrantDuration] = useState<string>("3");

  // CI team (salary only — shared FTE applies to all)
  const [cis, setCIs] = useState<CI[]>([
    { id: uid(), label: "Investigator A", annualSalary: "180000" },
    { id: uid(), label: "Investigator B", annualSalary: "130000" },
  ]);

  // Single shared FTE for the whole team
  const [teamFTE, setTeamFTE] = useState<string>("15");

  const [showFormula, setShowFormula] = useState(false);
  const [showRefs, setShowRefs] = useState(false);

  // ── Calculations ──
  const calc = useMemo(() => {
    const amount = parseFloat(grantAmount.replace(/,/g, "")) || 0;
    const rate = parseFloat(successRate) / 100 || 0;
    const duration = parseFloat(grantDuration) || 3;
    const fte = parseFloat(teamFTE) / 100 || 0;

    const totalSalary = cis.reduce(
      (sum, ci) => sum + (parseFloat(ci.annualSalary.replace(/,/g, "")) || 0),
      0
    );

    if (amount <= 0 || rate <= 0 || duration <= 0 || totalSalary <= 0) return null;

    // Formula (2): Annualised Expected Grant Value
    const annualisedEGV = (amount * rate) / duration;

    // Salary cost of writing = Total Salary × FTE
    const writingCost = totalSalary * fte;

    // Formula (1): ROI
    const roi = fte > 0 ? annualisedEGV / writingCost : null;

    // Szilard Point FTE (ROI = 1)
    const szilardFTE = annualisedEGV / totalSalary;

    // Chart: ROI vs FTE from 0.5% to 50%
    const chartData = Array.from({ length: 100 }, (_, i) => {
      const f = (i + 1) / 200;
      return {
        fte: f,
        roi: annualisedEGV / (totalSalary * f),
      };
    });

    return {
      amount, rate, duration, fte,
      totalSalary, writingCost,
      annualisedEGV, roi, szilardFTE,
      chartData,
    };
  }, [grantAmount, successRate, grantDuration, cis, teamFTE]);

  // ── CI management ──
  const addCI = useCallback(() => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    setCIs((prev) => [
      ...prev,
      {
        id: uid(),
        label: `Investigator ${letters[prev.length] ?? prev.length + 1}`,
        annualSalary: "130000",
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
              GRASP
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.50 0.04 255)" }}>
              <span style={{ color: "oklch(0.65 0.10 65)" }}>Grant ROI Analysis and Szilard Point Platform</span>
              {" — "}Based on Ni &amp; Nanan (2026),{" "}
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
                className="absolute right-0 top-9 z-50 rounded-xl shadow-2xl p-3 w-80 space-y-1"
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
        {/* How to use banner */}
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
            <strong>How to use:</strong> Fill in all fields in the left panel — grant details, investigator salaries, and the percentage of annual working time the team will spend writing this application. Results update instantly.
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
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "oklch(0.80 0.04 255)" }}>
                    Grant Amount Requested <span style={{ color: "oklch(0.75 0.15 65)" }}>*</span>
                  </label>
                  <input
                    className="navy-input"
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
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "oklch(0.80 0.04 255)" }}>
                    Anticipated Scheme Success Rate (%) <span style={{ color: "oklch(0.75 0.15 65)" }}>*</span>
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
                  <p className="text-xs mt-1" style={{ color: "oklch(0.42 0.04 255)" }}>
                    The anticipated (historical or published) success rate of the grant scheme you are applying to (e.g., NHMRC Ideas Grant 2025: 8.1%; ARC Discovery Project 2025: 12.9%; NIH R01: ~20%). All ROI and Szilard Point results are estimates based on this anticipated rate.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "oklch(0.80 0.04 255)" }}>
                    Grant Duration (years) <span style={{ color: "oklch(0.75 0.15 65)" }}>*</span>
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
                Enter the name/label and annual salary for each investigator on the team.
              </p>
              <div className="space-y-3">
                {cis.map((ci, idx) => (
                  <div key={ci.id} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-1.5">
                      <input
                        className="navy-input text-sm"
                        type="text"
                        value={ci.label}
                        onChange={(e) => updateCI(ci.id, "label", e.target.value)}
                        placeholder={`Investigator ${String.fromCharCode(65 + idx)}`}
                      />
                      <div>
                        <input
                          className="navy-input text-sm"
                          type="number"
                          min="0"
                          step="1000"
                          value={ci.annualSalary}
                          onChange={(e) => updateCI(ci.id, "annualSalary", e.target.value)}
                          placeholder="Annual salary (same currency as grant)"
                        />
                        <p className="text-xs mt-0.5" style={{ color: "oklch(0.38 0.04 255)" }}>
                          Annual salary (same currency as grant amount)
                        </p>
                      </div>
                    </div>
                    {cis.length > 1 && (
                      <button
                        onClick={() => removeCI(ci.id)}
                        className="mt-1 p-1.5 rounded-lg transition-colors"
                        style={{ color: "oklch(0.45 0.04 255)" }}
                        title="Remove investigator"
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
                  style={{ borderTop: "1px solid oklch(0.24 0.04 255)", color: "oklch(0.55 0.04 255)" }}
                >
                  <span>Total team salary / year</span>
                  <span style={{ color: "oklch(0.85 0.12 65)", fontWeight: 600 }}>
                    {fmtCurrency(calc.totalSalary)}
                  </span>
                </div>
              )}
            </section>

            {/* Team FTE */}
            <section
              className="rounded-xl p-5"
              style={{ background: "oklch(0.18 0.04 255)", border: "1px solid oklch(0.24 0.04 255)" }}
            >
              <h2
                className="text-base font-semibold mb-1"
                style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.94 0.01 255)" }}
              >
                Time Spent on Grant Writing <span style={{ color: "oklch(0.75 0.15 65)" }}>*</span>
              </h2>
              <p className="text-xs mb-4" style={{ color: "oklch(0.50 0.04 255)" }}>
                What percentage of each investigator's annual working time will be devoted to writing this application? (Applied uniformly across the team.)
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={teamFTE}
                  onChange={(e) => setTeamFTE(e.target.value)}
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
                    value={teamFTE}
                    onChange={(e) => setTeamFTE(e.target.value)}
                  />
                  <span className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>%</span>
                </div>
              </div>
              <p className="text-xs mt-2" style={{ color: "oklch(0.42 0.04 255)" }}>
                e.g., 15% means each investigator will spend 15% of their annual working time on this application
              </p>
              {calc && (
                <div
                  className="mt-3 pt-3 flex justify-between text-xs"
                  style={{ borderTop: "1px solid oklch(0.24 0.04 255)", color: "oklch(0.55 0.04 255)" }}
                >
                  <span>Total writing cost / year (salary × FTE)</span>
                  <span style={{ color: "oklch(0.85 0.12 65)", fontWeight: 600 }}>
                    {fmtCurrency(calc.writingCost)}
                  </span>
                </div>
              )}
            </section>

            {/* Definitions block */}
            <div
              className="rounded-xl p-4 text-xs space-y-3"
              style={{ background: "oklch(0.16 0.04 255)", border: "1px solid oklch(0.22 0.04 255)" }}
            >
              <div style={{ color: "oklch(0.75 0.15 65)", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Key Definitions
              </div>
              <div style={{ color: "oklch(0.60 0.04 255)", lineHeight: 1.6 }}>
                <span style={{ color: "oklch(0.85 0.12 65)", fontWeight: 600 }}>Full-Time Equivalent (FTE):</span>{" "}
                A unit of measurement that indicates the workload of an employed person in a way that makes workloads comparable across various contexts. FTE is often used to measure a worker's involvement in a project. An FTE of 1.0 is equivalent to a full-time worker, while an FTE of 0.5 signals half of a full work load.{" "}
                <a
                  href="https://en.wikipedia.org/wiki/Full-time_equivalent"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "oklch(0.65 0.12 255)", textDecoration: "underline" }}
                >
                  (Wikipedia)
                </a>
              </div>
              <div style={{ color: "oklch(0.60 0.04 255)", lineHeight: 1.6 }}>
                <span style={{ color: "oklch(0.85 0.12 65)", fontWeight: 600 }}>Szilard Point:</span>{" "}
                The threshold at which the total cost of competing for a grant equals (or surpasses) the value of the available funding.{" "}
                <a
                  href="https://www.nature.com/articles/d41586-025-04060-x"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "oklch(0.65 0.12 255)", textDecoration: "underline" }}
                >
                  (Schweiger, <em>Nature</em>, 2025)
                </a>
                {" "}In GRASP, this is operationalised as the FTE at which ROI = 1 — the point where the salary cost of all investigators writing the application equals the expected value of the awarded grant (Ni &amp; Nanan, 2026).
              </div>
            </div>

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
                  {"      "}/ (Total Salary × FTE)
                </div>
                <div>
                  <span style={{ color: "oklch(0.65 0.08 255)" }}>Formula (2) — Annualised EGV:</span>
                  <br />
                  EGV/yr = (Grant Amount × Success Rate)
                  <br />
                  {"          "}/ Grant Duration (years)
                </div>
                <div>
                  <span style={{ color: "oklch(0.65 0.08 255)" }}>Szilard Point:</span>
                  <br />
                  FTE* = EGV/yr / Total Salary
                  <br />
                  {"       "}(FTE at which ROI = 1)
                </div>
                <div style={{ color: "oklch(0.42 0.04 255)", paddingTop: "0.25rem", borderTop: "1px solid oklch(0.24 0.04 255)" }}>
                  Source: Ni D &amp; Nanan R (2026).{" "}
                  <a
                    href="https://www.authorea.com/doi/full/10.22541/au.176918698.87912423/v1"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "oklch(0.65 0.12 255)", textDecoration: "underline" }}
                  >
                    Authorea preprint
                  </a>
                  . DOI: 10.22541/au.176918698.87912423
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
                  verdict.type === "good" ? "verdict-good" :
                  verdict.type === "warn" ? "verdict-neutral" : "verdict-bad"
                }`}
                style={{ minHeight: "80px" }}
              >
                <div className="shrink-0 mt-0.5">
                  {verdict.type === "good" ? <CheckCircle size={24} /> :
                   verdict.type === "warn" ? <AlertTriangle size={24} /> :
                   <TrendingDown size={24} />}
                </div>
                <div>
                  <div
                    className="font-extrabold uppercase"
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

            {/* Key metrics */}
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
                  Estimated Szilard Point
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
                    Estimated maximum FTE before ROI falls below 1
                  </div>
                </div>
                <div className="szilard-badge mt-3 self-start" style={{ fontSize: "0.7rem" }}>
                  Estimated break-even threshold
                </div>
              </div>

              {/* Annualised EGV */}
              <div
                className="rounded-xl p-4 flex flex-col"
                style={{ background: "oklch(0.18 0.04 255)", border: "1px solid oklch(0.24 0.04 255)" }}
              >
                <div className="text-xs font-semibold mb-2" style={{ color: "oklch(0.60 0.04 255)" }}>
                  Estimated Annualised Expected Grant Value
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
                    (Grant × Anticipated Rate) ÷ Duration
                  </div>
                </div>
              </div>
            </div>

            {/* ROI vs FTE Chart */}
            <section
              className="rounded-xl p-5"
              style={{ background: "oklch(0.18 0.04 255)", border: "1px solid oklch(0.24 0.04 255)" }}
            >
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
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
                How ROI changes as the team's FTE devoted to writing increases. The amber vertical line marks the Szilard Point (ROI = 1); the white dashed line shows your current FTE.
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
                        value: "FTE devoted to grant writing",
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
                    {/* Szilard Point horizontal line (ROI = 1) */}
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
                    {/* Current FTE */}
                    <ReferenceLine
                      x={calc.fte}
                      stroke="oklch(0.94 0.01 255)"
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                      label={{
                        value: "Your FTE",
                        position: "top",
                        fill: "oklch(0.75 0.01 255)",
                        fontSize: 9,
                      }}
                    />
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
                      ["Anticipated scheme success rate", fmtPct(calc.rate)],
                      ["Grant duration", `${calc.duration} year${calc.duration !== 1 ? "s" : ""}`],
                      ["Estimated Annualised Expected Grant Value", fmtCurrency(calc.annualisedEGV)],
                      ["Total team salary / year", fmtCurrency(calc.totalSalary)],
                      ["Team FTE devoted to writing", fmtPct(calc.fte)],
                      ["Total writing cost / year (salary × FTE)", fmtCurrency(calc.writingCost)],
                      ["Estimated ROI", calc.roi !== null ? fmt(calc.roi, 3) : "—"],
                      ["Estimated Szilard Point (break-even FTE)", fmtPct(calc.szilardFTE)],
                    ].map(([label, value], i) => (
                      <tr
                        key={i}
                        style={{ borderBottom: i < 8 ? "1px solid oklch(0.21 0.04 255)" : "none" }}
                      >
                        <td className="py-2 pr-4" style={{ color: "oklch(0.58 0.04 255)" }}>
                          {label}
                        </td>
                        <td
                          className="py-2 text-right font-semibold"
                          style={{
                            color:
                              label === "Estimated ROI"
                                ? calc.roi !== null && calc.roi >= 1
                                  ? "oklch(0.70 0.18 145)"
                                  : "oklch(0.70 0.18 25)"
                                : label.startsWith("Estimated Szilard") || label.includes("writing cost")
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
                  <strong style={{ color: "oklch(0.70 0.18 145)" }}>Estimated ROI &gt; 1:</strong> The estimated annualised expected grant value exceeds the salary cost of writing — the application is estimated to be financially justified at the current time investment.
                </p>
                <p>
                  <strong style={{ color: "oklch(0.85 0.12 65)" }}>Estimated ROI = 1 (Szilard Point):</strong> The estimated break-even threshold. Writing beyond this FTE is estimated to cost more than the expected return.
                </p>
                <p>
                  <strong style={{ color: "oklch(0.70 0.18 25)" }}>Estimated ROI &lt; 1:</strong> The estimated salary cost of writing exceeds the expected value of the grant. Consider reducing team size, writing time, or targeting a higher-success-rate scheme.
                </p>
                <p className="pt-1" style={{ color: "oklch(0.40 0.04 255)" }}>
                  Note: This analysis focuses on the direct financial return of the grant application process. It does not account for downstream benefits of funded research (publications, career advancement, societal impact), which are real but not quantifiable at the time of the application decision.
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
        <div className="container text-xs text-center space-y-1" style={{ color: "oklch(0.38 0.04 255)" }}>
          <div>
            Based on:{" "}
            <a
              href="https://www.authorea.com/doi/full/10.22541/au.176918698.87912423/v1"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "oklch(0.55 0.08 255)", textDecoration: "underline" }}
            >
              Ni D &amp; Nanan R (2026). <em>When grant writing costs more than it pays: A return-on-investment analysis.</em> Authorea. DOI: 10.22541/au.176918698.87912423
            </a>
          </div>
          <div><span style={{ color: "oklch(0.65 0.10 65)" }}>GRASP</span> — Grant ROI Analysis and Szilard Point Platform. For research and informational purposes only.</div>
        </div>
      </footer>
    </div>
  );
}
