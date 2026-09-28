"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";
import {
  AlertTriangle,
  Clock,
  Droplets,
  Factory,
  Flame,
  Gauge,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShowerHead,
  Star,
  Timer,
  Wrench,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Business constants                                                  */
/* ------------------------------------------------------------------ */

const BUSINESS = "Yamuna Plumbing and Civils Umhlanga";
const PHONE_DISPLAY = "064 048 4622";
const PHONE_TEL = "+27640484622";
const WA_NUMBER = "27640484622";
const ADDRESS = "60 Meridian Dr, Umhlanga, Durban, 4319";
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${BUSINESS}, ${ADDRESS}`
)}`;
const wa = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
const QUICK_WA = wa(
  "Hi Yamuna Plumbing, I have a plumbing emergency and need someone out as soon as possible.\nMy address: "
);

/* ------------------------------------------------------------------ */
/* Estimator data                                                      */
/* NOTE: rand figures below are placeholders for the layout. Confirm    */
/* real call-out ranges with Yamuna before going live.                 */
/* ------------------------------------------------------------------ */

const EMERGENCIES = [
  {
    id: "burst",
    urgency: 0.85,
    label: "Burst or leaking pipe",
    icon: Droplets,
    prep: 15,
    low: 850,
    high: 1800,
    tip: "Close the main stopcock (usually beside the water meter) to stop the flow while we drive over.",
  },
  {
    id: "geyser",
    urgency: 0.8,
    label: "Burst or leaking geyser",
    icon: Flame,
    prep: 15,
    low: 950,
    high: 2200,
    tip: "Switch the geyser off at the DB board, then close the cold-water inlet valve next to the geyser.",
  },
  {
    id: "leak",
    urgency: 0.35,
    label: "Hidden leak or high water bill",
    icon: Search,
    prep: 25,
    low: 900,
    high: 2500,
    tip: "With every tap closed, photograph your water meter now and again in 30 minutes. If it moved, there's a leak.",
  },
  {
    id: "blocked",
    urgency: 0.45,
    label: "Blocked drain or toilet",
    icon: Wrench,
    prep: 20,
    low: 750,
    high: 1600,
    tip: "Stop using any taps, showers or toilets that drain into the blocked line.",
  },
  {
    id: "pressure",
    urgency: 0.5,
    label: "No water or low pressure",
    icon: Gauge,
    prep: 20,
    low: 750,
    high: 1500,
    tip: "Ask a neighbour whether their supply is also out. If it is, it may be a municipal outage.",
  },
  {
    id: "gas",
    urgency: 0.95,
    label: "Gas line fault or gas smell",
    icon: AlertTriangle,
    prep: 10,
    low: 950,
    high: 2400,
    tip: "Close the cylinder valve, don't use switches or open flames, open windows and wait outside.",
  },
] as const;

const AREAS = [
  { name: "Umhlanga Ridge / Gateway", mins: 6 },
  { name: "Umhlanga New Town Centre", mins: 7 },
  { name: "Umhlanga Rocks", mins: 10 },
  { name: "La Lucia", mins: 12 },
  { name: "Mount Edgecombe", mins: 18 },
  { name: "Durban North", mins: 20 },
  { name: "Umdloti / Sibaya", mins: 22 },
] as const;

const TIMES = [
  { id: "day", label: "Weekday, 7am to 6pm", mult: 1, extra: 0 },
  { id: "night", label: "After hours", mult: 1.35, extra: 5 },
  { id: "weekend", label: "Weekend or public holiday", mult: 1.5, extra: 5 },
] as const;

type TimeId = (typeof TIMES)[number]["id"];

const round5 = (n: number) => Math.round(n / 5) * 5;
const round50 = (n: number) => Math.round(n / 50) * 50;
const rand = (n: number) => `R${n.toLocaleString("en-ZA").replace(/,/g, " ")}`;

/* ------------------------------------------------------------------ */
/* Services                                                            */
/* ------------------------------------------------------------------ */

const SERVICES = [
  {
    icon: Search,
    title: "Emergency leak detection",
    body: "We trace hidden leaks in walls, slabs and garden lines without breaking open more than we need to, then fix them on the same visit where possible.",
  },
  {
    icon: Gauge,
    title: "High-pressure pipe repair",
    body: "Burst mains, split copper and failed couplings repaired and pressure-tested before we leave, so the fix holds when the supply comes back on.",
  },
  {
    icon: Factory,
    title: "Commercial and civil lines",
    body: "Design, installation and repair of service lines for workshops, clinics, restaurants and industrial sites.",
    lines: [
      { name: "Water", color: "#3FA56B" },
      { name: "Compressed air", color: "#7CC7EA" },
      { name: "LP gas", color: "#D9A53A" },
      { name: "Nitrogen", color: "#6F7F90" },
      { name: "Vacuum", color: "#C4CDD6" },
    ],
  },
  {
    icon: Flame,
    title: "Geyser installation and replacement",
    body: "Burst geysers swapped out fast, plus new electric, gas and heat-pump installations with the valves and drip trays they need to pass inspection.",
  },
  {
    icon: ShowerHead,
    title: "Bathroom and sanitary installations",
    body: "Toilets, basins, showers, baths and waste lines for renovations and new builds, laid to fall and finished neatly.",
  },
];

/* ------------------------------------------------------------------ */
/* Page styles                                                         */
/* ------------------------------------------------------------------ */

const CSS = `
:root{
  --slate:#0D1826; --slate-2:#122133; --panel:#16283D; --line:#24405C;
  --cyan:#38E1FF; --cyan-dim:#1B8FA8; --copper:#C77B43; --copper-2:#E6A574;
  --steel:#97A9BE; --ink:#E6EDF5;
}
html{scroll-behavior:smooth}
body{background:var(--slate);color:var(--ink);font-family:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}
.font-display{font-family:'Barlow Condensed','Arial Narrow',system-ui,sans-serif;letter-spacing:.005em}
.blueprint{
  background-color:var(--slate);
  background-image:
    linear-gradient(rgba(56,225,255,.035) 1px,transparent 1px),
    linear-gradient(90deg,rgba(56,225,255,.035) 1px,transparent 1px);
  background-size:48px 48px;
}
.plate{
  background:linear-gradient(160deg,#1B3048 0%,#132437 60%,#101E2E 100%);
  border:1px solid rgba(199,123,67,.55);
  box-shadow:inset 0 1px 0 rgba(230,165,116,.25),0 30px 60px -30px rgba(0,0,0,.7);
}
.rivet{width:9px;height:9px;border-radius:9999px;position:absolute;
  background:radial-gradient(circle at 35% 30%,#F4C9A3 0%,#C77B43 45%,#6A3A1C 100%);
  box-shadow:0 1px 1px rgba(0,0,0,.6)}
.btn-copper{background:linear-gradient(180deg,#D98C52 0%,#B86A34 100%);color:#1A0E06;
  box-shadow:inset 0 1px 0 rgba(255,220,190,.5),0 8px 24px -10px rgba(199,123,67,.8)}
.btn-copper:hover{filter:brightness(1.08)}
.btn-water{border:1px solid rgba(56,225,255,.6);color:var(--cyan);
  background:linear-gradient(to top,rgba(56,225,255,.2) 50%,rgba(56,225,255,.05) 50%);
  background-size:100% 200%;background-position:top;transition:background-position .45s ease,box-shadow .3s}
.btn-water:hover{background-position:bottom;box-shadow:0 0 24px -6px rgba(56,225,255,.7)}
.field{background:#0F1D2D;border:1px solid var(--line);color:var(--ink)}
.field:focus{outline:none;border-color:var(--cyan);box-shadow:0 0 0 3px rgba(56,225,255,.18)}
.choice[aria-pressed="true"],.choice[aria-checked="true"]{border-color:var(--cyan);background:rgba(56,225,255,.08);box-shadow:inset 0 0 0 1px rgba(56,225,255,.4)}
.ticket{background:
  radial-gradient(circle at 0 50%,var(--slate) 10px,transparent 11px) left/20px 100% no-repeat,
  linear-gradient(180deg,#172C43,#12233A)}
:focus-visible{outline:2px solid var(--cyan);outline-offset:3px;border-radius:4px}
@keyframes flow{to{stroke-dashoffset:-44}}
.flow{animation:flow 1s linear infinite}
@keyframes ping{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.1);opacity:0}}
.ping{animation:ping 1.8s cubic-bezier(0,0,.2,1) infinite}
.flow-slow{animation:flow 2.6s linear infinite}
@keyframes drip{
  0%{transform:translateY(0) scale(0);opacity:0}
  20%{transform:translateY(0) scale(1);opacity:1}
  60%{transform:translateY(0) scale(1,1.15)}
  95%{transform:translateY(32px) scale(.9,1.1);opacity:1}
  100%{transform:translateY(34px) scale(1.3,.4);opacity:0}}
.drip{animation:drip 3.2s cubic-bezier(.55,0,.9,.6) infinite;transform-box:fill-box;transform-origin:50% 0}
@keyframes ripple{0%{transform:scale(.2);opacity:.9}25%{transform:scale(1.9);opacity:0}100%{opacity:0}}
.ripple{opacity:0;animation:ripple 3.2s ease-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes rise{0%{transform:translate(0,0);opacity:0}12%{opacity:.8}100%{transform:translate(var(--dx),-170px);opacity:0}}
.bubble{opacity:0;animation:rise linear infinite}
@keyframes needle{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(6deg)}}
.wobble{animation:needle 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
@media (prefers-reduced-motion:reduce){.flow,.flow-slow,.ping,.wobble{animation:none}.drip,.ripple,.bubble{display:none}html{scroll-behavior:auto}}
`;

/* ------------------------------------------------------------------ */
/* Scroll-linked pipe                                                  */
/* ------------------------------------------------------------------ */

const GUTTER_A = 30;
const GUTTER_B = 54;

function Valve({ x, y, liquidY }: { x: number; y: number; liquidY: MotionValue<number> }) {
  const rotate = useTransform(liquidY, [y - 220, y + 30], [0, 270]);
  const glow = useTransform(liquidY, [y - 30, y + 30], [0, 1]);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-15} y={-8} width={30} height={16} rx={3} fill="#5B3A22" stroke="#C77B43" strokeWidth={1.5} />
      <motion.circle r={19} fill="none" stroke="#38E1FF" strokeWidth={1.5} style={{ opacity: glow }} filter="url(#glow)" />
      <motion.g style={{ rotate }}>
        <circle r={12} fill="none" stroke="#E6A574" strokeWidth={3} />
        <line x1={-12} y1={0} x2={12} y2={0} stroke="#E6A574" strokeWidth={2} />
        <line x1={0} y1={-12} x2={0} y2={12} stroke="#E6A574" strokeWidth={2} />
        <circle r={3.5} fill="#F4C9A3" />
      </motion.g>
    </g>
  );
}

function PipeFlow({ wrapRef }: { wrapRef: RefObject<HTMLDivElement> }) {
  const reduce = useReducedMotion();
  const pathRef = useRef<SVGPathElement>(null);
  const samples = useRef<{ len: number; y: number }[]>([]);
  const total = useRef(1);
  const [geo, setGeo] = useState<{ h: number; valves: number[] }>({ h: 0, valves: [] });

  const liquidY = useMotionValue(0);
  const fill = useMotionValue(0);
  const smoothFill = useSpring(fill, { stiffness: 80, damping: 22, mass: 0.6 });
  const headX = useMotionValue(GUTTER_A);
  const headY = useMotionValue(0);
  const { scrollY } = useScroll();

  // Measure the page and the sections that carry a valve.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const valves = Array.from(el.querySelectorAll<HTMLElement>("[data-valve]")).map((s) => s.offsetTop + 80);
      setGeo((g) =>
        g.h === el.scrollHeight && g.valves.join() === valves.join() ? g : { h: el.scrollHeight, valves }
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [wrapRef]);

  // Build the pipe route: straight runs down the gutter with a dog-leg into each valve.
  const { d, valves } = useMemo(() => {
    let x = GUTTER_A;
    let path = `M ${x} 0`;
    const pts: { x: number; y: number }[] = [];
    geo.valves.forEach((v, i) => {
      const nx = i % 2 === 0 ? GUTTER_B : GUTTER_A;
      path += ` L ${x} ${v - 70} C ${x} ${v - 44}, ${nx} ${v - 58}, ${nx} ${v - 30} L ${nx} ${v}`;
      x = nx;
      pts.push({ x: nx, y: v });
    });
    path += ` L ${x} ${Math.max(geo.h - 24, 0)}`;
    return { d: path, valves: pts };
  }, [geo]);

  const update = (sy: number) => {
    const target = sy + window.innerHeight * 0.55;
    liquidY.set(target);
    const s = samples.current;
    if (!s.length) return;
    let len = s[s.length - 1].len;
    for (const p of s) {
      if (p.y >= target) {
        len = p.len;
        break;
      }
    }
    fill.set(len / total.current);
  };

  // Sample the path once so scroll position maps to real pipe length (the dog-legs add length).
  useEffect(() => {
    const p = pathRef.current;
    if (!p || !geo.h) return;
    const L = p.getTotalLength() || 1;
    total.current = L;
    const arr: { len: number; y: number }[] = [];
    for (let i = 0; i <= 400; i++) {
      const len = (L * i) / 400;
      arr.push({ len, y: p.getPointAtLength(len).y });
    }
    samples.current = arr;
    update(window.scrollY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d]);

  useMotionValueEvent(scrollY, "change", update);
  useMotionValueEvent(smoothFill, "change", (v) => {
    const p = pathRef.current;
    if (!p) return;
    const pt = p.getPointAtLength(Math.max(0, Math.min(1, v)) * total.current);
    headX.set(pt.x);
    headY.set(pt.y);
  });

  if (!geo.h) return null;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 z-0 hidden lg:block"
      width={84}
      height={geo.h}
      viewBox={`0 0 84 ${geo.h}`}
    >
      <defs>
        <filter id="glow" x="-200%" y="-10%" width="500%" height="120%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="casing" x1="0" x2="1">
          <stop offset="0" stopColor="#1A2B40" />
          <stop offset=".45" stopColor="#3B536F" />
          <stop offset="1" stopColor="#15253A" />
        </linearGradient>
        <mask id="liquidMask" maskUnits="userSpaceOnUse" x="0" y="0" width="84" height={geo.h}>
          <motion.path d={d} fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" style={{ pathLength: smoothFill }} />
        </mask>
      </defs>

      {/* Casing */}
      <path d={d} fill="none" stroke="#0A1420" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="url(#casing)" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#0B1726" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />

      {/* Liquid */}
      <motion.path
        ref={pathRef}
        d={d}
        fill="none"
        stroke="#38E1FF"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
        style={{ pathLength: smoothFill }}
      />
      {!reduce && (
        <g mask="url(#liquidMask)">
          <path d={d} fill="none" stroke="#DDFBFF" strokeOpacity={0.75} strokeWidth={2.5} strokeDasharray="4 18" strokeLinecap="round" className="flow" />
        </g>
      )}

      {/* Copper couplings at each bend */}
      {valves.map((v, i) => {
        const prevX = i % 2 === 0 ? GUTTER_A : GUTTER_B;
        return (
          <rect key={`c${i}`} x={prevX - 10} y={v.y - 76} width={20} height={6} rx={1.5} fill="#C77B43" stroke="#6A3A1C" />
        );
      })}

      {/* Flow front */}
      <motion.circle cx={headX} cy={headY} r={5} fill="#E9FDFF" filter="url(#glow)" />

      {valves.map((v, i) => (
        <Valve key={`v${i}`} x={v.x} y={v.y} liquidY={liquidY} />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Emergency estimator                                                 */
/* ------------------------------------------------------------------ */

function Estimator() {
  const [emId, setEmId] = useState<(typeof EMERGENCIES)[number]["id"]>("burst");
  const [area, setArea] = useState<string>(AREAS[0].name);
  const [time, setTime] = useState<TimeId>("day");
  const [name, setName] = useState("");
  const [street, setStreet] = useState("");

  // Pick the time band from the visitor's clock after mount (avoids hydration mismatch).
  useEffect(() => {
    const now = new Date();
    const day = now.getDay();
    const hr = now.getHours();
    if (day === 0 || day === 6) setTime("weekend");
    else if (hr < 7 || hr >= 18) setTime("night");
  }, []);

  const em = EMERGENCIES.find((e) => e.id === emId)!;
  const ar = AREAS.find((a) => a.name === area)!;
  const tb = TIMES.find((t) => t.id === time)!;

  const etaLow = round5(em.prep + ar.mins + tb.extra);
  const etaHigh = etaLow + 15;
  const costLow = round50(em.low * tb.mult);
  const costHigh = round50(em.high * tb.mult);

  const message = [
    "Hi Yamuna Plumbing, emergency booking request:",
    `• Problem: ${em.label}`,
    `• Area: ${ar.name}`,
    `• Street address: ${street.trim() || "(will send)"}`,
    `• Name: ${name.trim() || "(will send)"}`,
    `• When: ${tb.label}`,
    `• Estimate shown on site: arrival ${etaLow}–${etaHigh} min, ${rand(costLow)}–${rand(costHigh)}`,
    "Please confirm dispatch.",
  ].join("\n");

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
      {/* Inputs */}
      <div className="space-y-8">
        <fieldset>
          <legend className="font-display text-2xl font-semibold text-white">What&apos;s gone wrong?</legend>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {EMERGENCIES.map((e) => {
              const Icon = e.icon;
              const active = e.id === emId;
              return (
                <button
                  key={e.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setEmId(e.id)}
                  className="choice flex items-center gap-3 rounded-lg border border-[#24405C] bg-[#12223A]/60 px-4 py-3.5 text-left text-[15px] transition-colors hover:border-[#38E1FF]/60"
                >
                  <Icon className={`h-5 w-5 shrink-0 ${active ? "text-[#38E1FF]" : "text-[#97A9BE]"}`} />
                  <span className={active ? "text-white" : "text-[#C9D5E2]"}>{e.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="font-display text-xl font-semibold text-white">Your area</span>
            <select value={area} onChange={(e) => setArea(e.target.value)} className="field mt-3 w-full rounded-lg px-3.5 py-3 text-[15px]">
              {AREAS.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="font-display text-xl font-semibold text-white">When</legend>
            <div role="radiogroup" className="mt-3 flex flex-col gap-2">
              {TIMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={time === t.id}
                  onClick={() => setTime(t.id)}
                  className="choice rounded-lg border border-[#24405C] px-3.5 py-2 text-left text-sm text-[#C9D5E2] transition-colors hover:border-[#38E1FF]/60"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-[#97A9BE]">
            Your name
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="field mt-2 w-full rounded-lg px-3.5 py-3 text-[15px]" placeholder="Optional" />
          </label>
          <label className="block text-sm text-[#97A9BE]">
            Street address
            <input value={street} onChange={(e) => setStreet(e.target.value)} autoComplete="street-address" className="field mt-2 w-full rounded-lg px-3.5 py-3 text-[15px]" placeholder="Optional" />
          </label>
        </div>
      </div>

      {/* Result ticket */}
      <div className="ticket relative overflow-hidden rounded-2xl border border-[#C77B43]/50 p-6 sm:p-8" aria-live="polite">
        <span className="rivet left-4 top-4" />
        <span className="rivet right-4 top-4" />
        <div className="absolute right-8 top-10 hidden h-24 w-24 sm:block">
          <PressureGauge value={em.urgency} label="urgency" />
        </div>
        <p className="pl-2 text-sm text-[#97A9BE]">Dispatch estimate for {ar.name}</p>

        <div className="mt-5 flex items-end gap-3 pl-2">
          <Timer className="mb-2 h-7 w-7 text-[#38E1FF]" />
          <motion.p key={`${etaLow}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-display text-6xl font-bold leading-none text-white">
            {etaLow}–{etaHigh}
            <span className="ml-2 text-2xl font-semibold text-[#97A9BE]">min</span>
          </motion.p>
        </div>
        <p className="mt-2 pl-2 text-sm text-[#97A9BE]">Estimated arrival from our Meridian Drive base</p>

        <div className="mt-6 border-t border-dashed border-[#2E4A68] pt-5 pl-2">
          <p className="text-sm text-[#97A9BE]">Indicative call-out and first-hour range</p>
          <p className="font-display mt-1 text-3xl font-semibold text-[#E6A574]">
            {rand(costLow)} – {rand(costHigh)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#7F93AA]">
            A guide only. You get a firm quote on site before any work starts. Parts are charged separately.
          </p>
        </div>

        <div className={`mt-6 rounded-lg border px-4 py-3 text-sm leading-relaxed ${em.id === "gas" ? "border-amber-400/60 bg-amber-400/10 text-amber-100" : "border-[#24405C] bg-[#0F1D2D] text-[#C9D5E2]"}`}>
          <span className="font-semibold text-white">While you wait: </span>
          {em.tip}
        </div>

        <details className="mt-5 pl-2 text-sm text-[#97A9BE]">
          <summary className="cursor-pointer select-none hover:text-white">Preview the WhatsApp message</summary>
          <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-[#0B1624] p-3 font-sans text-[13px] leading-relaxed text-[#C9D5E2]">{message}</pre>
        </details>

        <a
          href={wa(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-copper mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-4 text-base font-semibold transition"
        >
          <MessageCircle className="h-5 w-5" />
          Send booking on WhatsApp
        </a>
        <a href={`tel:${PHONE_TEL}`} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm text-[#97A9BE] hover:text-white">
          <Phone className="h-4 w-4" />
          Or call {PHONE_DISPLAY}
        </a>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Decorative plumbing                                                 */
/* ------------------------------------------------------------------ */

const polar = (deg: number, r: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [Number((50 + r * Math.sin(a)).toFixed(2)), Number((50 - r * Math.cos(a)).toFixed(2))];
};

/** Copper-bezel pressure gauge. The transparent circles keep each rotating group centred on the dial. */
function PressureGauge({ value, label, wobble = false }: { value: number; label: string; wobble?: boolean }) {
  const angle = -135 + Math.min(1, Math.max(0, value)) * 270;
  const [rx1, ry1] = polar(81, 36);
  const [rx2, ry2] = polar(135, 36);
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_10px_18px_rgba(0,0,0,.55)]" aria-hidden="true">
      <defs>
        <radialGradient id="bezel" cx="35%" cy="30%">
          <stop offset="0" stopColor="#F4C9A3" />
          <stop offset=".5" stopColor="#C77B43" />
          <stop offset="1" stopColor="#6A3A1C" />
        </radialGradient>
      </defs>
      <circle cx={50} cy={50} r={49} fill="url(#bezel)" />
      <circle cx={50} cy={50} r={44} fill="#0F1C2C" stroke="#5B3A22" />
      <path d={`M ${rx1} ${ry1} A 36 36 0 0 1 ${rx2} ${ry2}`} fill="none" stroke="#E5484D" strokeWidth={4} />
      {Array.from({ length: 11 }).map((_, i) => {
        const deg = -135 + i * 27;
        const [x1, y1] = polar(deg, 40);
        const [x2, y2] = polar(deg, i % 5 === 0 ? 31 : 35);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#97A9BE" strokeWidth={i % 5 === 0 ? 2 : 1} />;
      })}
      <text x={50} y={74} textAnchor="middle" fontSize={9} fill="#97A9BE" fontFamily="IBM Plex Sans, sans-serif">
        {label}
      </text>
      <motion.g initial={false} animate={{ rotate: angle }} transition={{ type: "spring", stiffness: 70, damping: 11 }}>
        <circle cx={50} cy={50} r={44} fill="transparent" />
        <g className={wobble ? "wobble" : undefined}>
          <circle cx={50} cy={50} r={44} fill="transparent" />
          <line x1={50} y1={58} x2={50} y2={15} stroke="#38E1FF" strokeWidth={2.5} strokeLinecap="round" />
          <circle cx={50} cy={50} r={5} fill="#E6A574" stroke="#6A3A1C" />
        </g>
      </motion.g>
    </svg>
  );
}

/** Faint pipe network behind the hero, fading out towards the copy. */
function HeroSchematic() {
  const runs = [
    "M 720 90 H 500 Q 460 90 460 130 V 300 Q 460 340 420 340 H 150 Q 110 340 110 380 V 660",
    "M 460 220 H 600 Q 640 220 640 260 V 660",
    "M 300 340 V 660",
    "M 720 470 H 640",
  ];
  const joints: [number, number][] = [[460, 220], [300, 340], [640, 470], [460, 130]];
  const mask = "radial-gradient(ellipse at 72% 38%, #000 18%, transparent 72%)";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 720 660"
      preserveAspectRatio="xMaxYMin meet"
      className="pointer-events-none absolute -right-6 top-0 hidden h-full w-[64%] opacity-70 md:block"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      {runs.map((d) => (
        <path key={`o${d}`} d={d} fill="none" stroke="#1B2F46" strokeWidth={26} strokeLinecap="round" />
      ))}
      {runs.map((d) => (
        <path key={`i${d}`} d={d} fill="none" stroke="#0D1826" strokeWidth={12} strokeLinecap="round" />
      ))}
      {runs.map((d) => (
        <path key={`f${d}`} d={d} fill="none" stroke="#38E1FF" strokeOpacity={0.55} strokeWidth={3} strokeDasharray="6 38" strokeLinecap="round" className="flow-slow" />
      ))}
      {joints.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={17} fill="#16283D" stroke="#C77B43" strokeOpacity={0.7} strokeWidth={3} />
          <circle cx={x} cy={y} r={4} fill="#C77B43" fillOpacity={0.7} />
        </g>
      ))}
      <g transform="translate(640 580)" opacity={0.8}>
        <rect x={-18} y={-9} width={36} height={18} rx={3} fill="#5B3A22" stroke="#C77B43" />
        <circle r={15} fill="none" stroke="#E6A574" strokeWidth={3} />
        <line x1={-15} y1={0} x2={15} y2={0} stroke="#E6A574" strokeWidth={2} />
        <line x1={0} y1={-15} x2={0} y2={15} stroke="#E6A574" strokeWidth={2} />
      </g>
    </svg>
  );
}

/** Horizontal service pipe between sections, with a line-marking band and leaky joints. */
function PipeDivider({ label, band = "#3FA56B", drips = [] }: { label: string; band?: string; drips?: number[] }) {
  const gid = useId().replace(/:/g, "");
  const flanges = [120, 420, 780, 1080]; // 10%, 35%, 65%, 90%
  return (
    <div aria-hidden="true" className="pointer-events-none relative h-[112px] lg:ml-[30px]">
      <svg className="absolute inset-x-0 top-4 h-14 w-full" viewBox="0 0 1200 56" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`hp${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#15253A" />
            <stop offset=".35" stopColor="#4A6482" />
            <stop offset=".55" stopColor="#2B415C" />
            <stop offset="1" stopColor="#0E1B2B" />
          </linearGradient>
        </defs>
        <rect x={0} y={17} width={1200} height={22} fill={`url(#hp${gid})`} />
        <line x1={0} y1={28} x2={1200} y2={28} stroke="#38E1FF" strokeOpacity={0.6} strokeWidth={2} strokeDasharray="6 38" vectorEffect="non-scaling-stroke" className="flow-slow" />
        <rect x={0} y={11} width={14} height={34} fill="#C77B43" stroke="#6A3A1C" vectorEffect="non-scaling-stroke" />
        {flanges.map((x) => (
          <rect key={x} x={x - 5} y={9} width={10} height={38} rx={1.5} fill="#C77B43" stroke="#6A3A1C" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <span
        className="absolute left-[46%] top-[33px] flex h-[22px] items-center rounded-[2px] px-3 text-[11px] font-semibold text-[#0B1624]"
        style={{ background: band }}
      >
        {label}
      </span>
      {drips.map((pct, i) => (
        <span key={pct} className="absolute top-[52px]" style={{ left: `calc(${pct}% - 12px)` }}>
          <svg width={24} height={58} viewBox="0 0 24 58">
            <path
              className="drip"
              style={{ animationDelay: `${i * 1.3}s` }}
              d="M12 2 C12 2 5 11 5 15 a7 7 0 0 0 14 0 C19 11 12 2 12 2Z"
              fill="#38E1FF"
              fillOpacity={0.85}
            />
            <ellipse
              className="ripple"
              style={{ animationDelay: `${i * 1.3 + 3.04}s` }}
              cx={12}
              cy={54}
              rx={9}
              ry={2.5}
              fill="none"
              stroke="#38E1FF"
              strokeOpacity={0.8}
            />
          </svg>
        </span>
      ))}
    </div>
  );
}

// [left %, size px, duration s, delay s, drift px] — fixed values so server and client render the same.
const BUBBLES: [number, number, number, number, number][] = [
  [4, 8, 7, 0, 10], [11, 5, 9, 2.2, -6], [19, 10, 8, 4.1, 8], [27, 6, 10, 1.1, -10],
  [36, 4, 7.5, 3.3, 6], [44, 9, 9.5, 0.6, -8], [53, 5, 8, 5, 12], [61, 7, 10.5, 2.7, -4],
  [69, 11, 9, 1.6, 8], [77, 5, 7, 4.6, -12], [85, 8, 8.5, 0.3, 6], [93, 6, 10, 3.8, -6],
];

function Bubbles() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {BUBBLES.map(([l, size, dur, delay, dx], i) => (
        <span
          key={i}
          className="bubble absolute -bottom-3 rounded-full border border-[#38E1FF]/50 bg-[#38E1FF]/10"
          style={{ left: `${l}%`, width: size, height: size, animationDuration: `${dur}s`, animationDelay: `${delay}s`, "--dx": `${dx}px` } as CSSProperties}
        />
      ))}
    </div>
  );
}

function Stars({ size = 20 }: { size?: number }) {
  return (
    <span className="flex gap-0.5" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} style={{ width: size, height: size }} className="fill-[#F5B83D] text-[#F5B83D]" />
      ))}
    </span>
  );
}

function OpenNow({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-sm ${className}`}>
      <span className="relative flex h-2.5 w-2.5">
        <span className="ping absolute inline-flex h-full w-full rounded-full bg-[#38E1FF]" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#38E1FF]" />
      </span>
      Open 24 hours, 7 days a week
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Page() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const hero: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.09, delayChildren: 0.1 } },
  };
  const item: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <>
      <style>{CSS}</style>

      {/* Mobile scroll gauge (the full pipe shows on large screens) */}
      <motion.div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-[#38E1FF] shadow-[0_0_12px_#38E1FF] lg:hidden"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#24405C]/70 bg-[#0D1826]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 lg:pl-28">
          <a href="#top" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-md border border-[#C77B43]/70 bg-[#16283D]">
              <Droplets className="h-5 w-5 text-[#38E1FF]" />
            </span>
            <span className="leading-tight">
              <span className="font-display block text-xl font-bold text-white">Yamuna</span>
              <span className="block text-[11px] text-[#97A9BE]">Plumbing and Civils, Umhlanga</span>
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-[#C9D5E2] md:flex">
            <a href="#services" className="hover:text-white">Services</a>
            <a href="#estimate" className="hover:text-white">Emergency estimate</a>
            <a href="#contact" className="hover:text-white">Contact</a>
          </nav>
          <a href={`tel:${PHONE_TEL}`} className="btn-copper inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">{PHONE_DISPLAY}</span>
            <span className="sm:hidden">Call</span>
          </a>
        </div>
      </header>

      <div ref={wrapRef} id="top" className="blueprint relative overflow-x-clip">
        <PipeFlow wrapRef={wrapRef} />

        <main className="relative z-10">
          {/* HERO */}
          <section data-valve className="relative mx-auto max-w-7xl px-5 pb-20 pt-14 sm:pt-20 lg:pl-28 lg:pb-28">
            <HeroSchematic />
            <motion.div variants={hero} initial="hidden" animate="show" className="relative z-10 grid items-center gap-12 lg:grid-cols-[1.35fr_1fr]">
              <div>
                <motion.div variants={item}>
                  <OpenNow className="rounded-full border border-[#38E1FF]/40 bg-[#38E1FF]/[.07] px-3.5 py-1.5 text-[#BFF4FF]" />
                </motion.div>
                <motion.h1 variants={item} className="font-display mt-6 text-[clamp(3rem,8vw,6.2rem)] font-bold leading-[0.92] text-white">
                  Burst pipe at 2am?
                  <br />
                  We&apos;re already on the road.
                </motion.h1>
                <motion.p variants={item} className="mt-6 max-w-xl text-lg leading-relaxed text-[#C9D5E2]">
                  Emergency leaks, geysers and high-pressure lines across Umhlanga, La Lucia and Durban North. One call
                  gets a qualified plumber to your door, day or night.
                </motion.p>
                <motion.div variants={item} className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <a href={`tel:${PHONE_TEL}`} className="btn-copper inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-4 text-base font-semibold">
                    <Phone className="h-5 w-5" />
                    Call {PHONE_DISPLAY}
                  </a>
                  <a href={QUICK_WA} target="_blank" rel="noopener noreferrer" className="btn-water inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-4 text-base font-semibold transition">
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp an emergency
                  </a>
                </motion.div>
              </div>

              {/* Rating nameplate */}
              <motion.a
                variants={item}
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="plate relative block rounded-2xl p-8 transition hover:border-[#E6A574]"
              >
                <span className="rivet left-3.5 top-3.5" />
                <span className="rivet right-3.5 top-3.5" />
                <span className="rivet bottom-3.5 left-3.5" />
                <span className="rivet bottom-3.5 right-3.5" />
                <span className="absolute -right-5 -top-9 h-24 w-24">
                  <PressureGauge value={0.62} label="bar" wobble />
                </span>
                <p className="text-sm text-[#97A9BE]">Google rating</p>
                <div className="mt-2 flex items-end gap-4">
                  <span className="font-display text-[5.5rem] font-bold leading-none text-white">5.0</span>
                  <div className="pb-3">
                    <Stars size={22} />
                    <p className="mt-1.5 text-[15px] font-medium text-[#E6A574]">92+ reviews</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3 border-t border-[#C77B43]/30 pt-5 text-[15px] text-[#C9D5E2]">
                  <p className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#38E1FF]" />
                    Emergency call-outs around the clock, including public holidays
                  </p>
                  <p className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#38E1FF]" />
                    Based at 60 Meridian Dr, minutes from the Ridge and the Rocks
                  </p>
                </div>
                <p className="mt-5 text-sm text-[#97A9BE] underline decoration-[#C77B43]/60 underline-offset-4">Read the reviews on Google</p>
              </motion.a>
            </motion.div>
          </section>

          {/* SERVICES */}
          <PipeDivider label="Potable water" drips={[35, 90]} />
          <section data-valve id="services" className="bg-[#0F1C2C]/70">
            <div className="mx-auto max-w-7xl px-5 py-20 lg:pl-28 lg:py-28">
              <div className="max-w-2xl">
                <h2 className="font-display text-5xl font-bold text-white sm:text-6xl">What we fix, fit and lay</h2>
                <p className="mt-4 text-lg leading-relaxed text-[#C9D5E2]">
                  From a dripping geyser in La Lucia to gas and air reticulation for a Gateway workshop.
                </p>
              </div>

              <ul className="mt-12 divide-y divide-[#24405C] border-y border-[#24405C]">
                {SERVICES.map((s) => {
                  const Icon = s.icon;
                  return (
                    <li key={s.title} className="grid gap-4 py-8 md:grid-cols-[3.5rem_minmax(0,18rem)_1fr] md:gap-8">
                      <span className="grid h-12 w-12 place-items-center rounded-lg border border-[#C77B43]/50 bg-[#16283D]">
                        <Icon className="h-6 w-6 text-[#E6A574]" />
                      </span>
                      <h3 className="font-display text-3xl font-semibold leading-tight text-white">{s.title}</h3>
                      <div>
                        <p className="max-w-[62ch] leading-relaxed text-[#C9D5E2]">{s.body}</p>
                        {s.lines && (
                          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-3" aria-label="Line types we install">
                            {s.lines.map((l) => (
                              <li key={l.name} className="flex items-center gap-2.5 text-sm text-[#E6EDF5]">
                                <span
                                  className="h-3 w-10 rounded-full"
                                  style={{ background: `linear-gradient(180deg, ${l.color} 0%, ${l.color}CC 55%, ${l.color}88 100%)`, boxShadow: `0 0 0 1px ${l.color}55` }}
                                />
                                {l.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {/* ESTIMATOR */}
          <PipeDivider label="Hot supply" band="#E6A574" drips={[65]} />
          <section data-valve id="estimate" className="mx-auto max-w-7xl px-5 py-20 lg:pl-28 lg:py-28">
            <div className="mb-12 max-w-2xl">
              <h2 className="font-display text-5xl font-bold text-white sm:text-6xl">Get a plumber moving</h2>
              <p className="mt-4 text-lg leading-relaxed text-[#C9D5E2]">
                Tell us what&apos;s happening and where. You&apos;ll see how long we&apos;re likely to take, a rough cost, and a
                WhatsApp booking ready to send.
              </p>
            </div>
            <Estimator />
          </section>

          {/* PROOF BAND */}
          <section data-valve className="relative overflow-hidden border-y border-[#C77B43]/30 bg-gradient-to-r from-[#1A2233] via-[#162536] to-[#1A2233]">
            <Bubbles />
            <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 px-5 py-14 md:flex-row md:items-center md:justify-between lg:pl-28">
              <div className="flex items-center gap-5">
                <span className="font-display text-6xl font-bold text-white">5.0</span>
                <div>
                  <Stars />
                  <p className="mt-1 text-[#C9D5E2]">From 92+ Umhlanga customers on Google</p>
                </div>
              </div>
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="btn-water inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold">
                <Star className="h-4 w-4" />
                Read what they said
              </a>
            </div>
          </section>

          {/* CONTACT */}
          <section data-valve id="contact" className="mx-auto max-w-7xl px-5 py-20 lg:pl-28 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <h2 className="font-display text-5xl font-bold text-white sm:text-6xl">Call, message or drop by</h2>
                <OpenNow className="mt-5 text-[#BFF4FF]" />
                <p className="mt-5 max-w-lg leading-relaxed text-[#C9D5E2]">
                  For anything flooding, sparking near water, or smelling of gas, call rather than message so we can
                  talk you through isolating it.
                </p>
              </div>
              <div className="grid gap-px overflow-hidden rounded-2xl border border-[#24405C] bg-[#24405C]">
                <a href={`tel:${PHONE_TEL}`} className="flex items-center gap-4 bg-[#12223A] p-6 hover:bg-[#16283D]">
                  <Phone className="h-6 w-6 text-[#E6A574]" />
                  <div>
                    <p className="text-sm text-[#97A9BE]">Phone</p>
                    <p className="font-display text-3xl font-semibold text-white">{PHONE_DISPLAY}</p>
                  </div>
                </a>
                <a href={QUICK_WA} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-[#12223A] p-6 hover:bg-[#16283D]">
                  <MessageCircle className="h-6 w-6 text-[#38E1FF]" />
                  <div>
                    <p className="text-sm text-[#97A9BE]">WhatsApp</p>
                    <p className="font-display text-3xl font-semibold text-white">{PHONE_DISPLAY}</p>
                  </div>
                </a>
                <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-[#12223A] p-6 hover:bg-[#16283D]">
                  <MapPin className="h-6 w-6 text-[#E6A574]" />
                  <div>
                    <p className="text-sm text-[#97A9BE]">Address</p>
                    <p className="text-lg text-white">{ADDRESS}</p>
                  </div>
                </a>
              </div>
            </div>
          </section>
        </main>

        <PipeDivider label="Compressed air" band="#7CC7EA" drips={[10]} />
        <footer className="relative z-10 border-t border-[#24405C]/70">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-8 text-sm text-[#7F93AA] sm:flex-row sm:justify-between lg:pl-28">
            <p>© {new Date().getFullYear()} {BUSINESS}</p>
            <p>Plumbing, geysers and civil service lines in Umhlanga and surrounds</p>
          </div>
        </footer>
      </div>

      {/* 24/7 WhatsApp FAB */}
      <motion.a
        href={QUICK_WA}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp Yamuna Plumbing for a 24/7 emergency"
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 18 }}
        className="group fixed bottom-5 right-5 z-50 flex items-center gap-3"
      >
        <span className="hidden rounded-lg border border-[#24405C] bg-[#0D1826]/95 px-3 py-2 text-sm text-white shadow-lg group-hover:block group-focus-visible:block">
          24/7 emergency on WhatsApp
        </span>
        <span className="relative grid h-16 w-16 place-items-center rounded-full bg-[#25D366] text-[#07361B] shadow-[0_10px_30px_-8px_rgba(37,211,102,.8)]">
          <span className="ping absolute inset-0 rounded-full bg-[#25D366]/60" />
          <MessageCircle className="relative h-8 w-8" strokeWidth={2.2} />
        </span>
      </motion.a>
    </>
  );
}
