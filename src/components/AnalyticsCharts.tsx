import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Meta = { title: string; subtitle: string };

type Props = {
  daily: { label: string; minutes: number }[];
  weekly: { label: string; sessions: number }[];
  monthly: { label: string; minutes: number }[];
  meta: { daily: Meta; weekly: Meta; monthly: Meta };
};

const grid = "rgba(255,255,255,0.06)";
const axis = { stroke: "rgba(255,255,255,0.3)", fontSize: 11 };
const ticks = { tickLine: false, axisLine: false, minTickGap: 16, interval: "preserveStartEnd" as const };

function TT({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs">
      <div className="text-white/50">{label}</div>
      <div className="text-white">{payload[0].value} {payload[0].name || ""}</div>
    </div>
  );
}

export default function AnalyticsCharts({ daily, weekly, monthly, meta }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="glass rounded-3xl p-5 md:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-display text-base font-semibold">{meta.daily.title}</h4>
          <span className="text-xs text-white/40">{meta.daily.subtitle}</span>
        </div>
        <div className="h-56">
          <ResponsiveContainer>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="gDaily" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="label" {...axis} {...ticks} />
              <YAxis tickLine={false} axisLine={false} {...axis} width={30} />
              <Tooltip content={<TT />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
              <Area type="monotone" dataKey="minutes" name="min" stroke="#a78bfa" strokeWidth={2} fill="url(#gDaily)" isAnimationActive animationDuration={800} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-3xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-display text-base font-semibold">{meta.weekly.title}</h4>
          <span className="text-xs text-white/40">{meta.weekly.subtitle}</span>
        </div>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={weekly}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="label" {...axis} {...ticks} />
              <YAxis tickLine={false} axisLine={false} {...axis} width={30} allowDecimals={false} />
              <Tooltip content={<TT />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="sessions" name="sessions" radius={[8, 8, 0, 0]} fill="url(#gBar)" isAnimationActive animationDuration={800} />
              <defs>
                <linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c4a3ff" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-3xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-display text-base font-semibold">{meta.monthly.title}</h4>
          <span className="text-xs text-white/40">{meta.monthly.subtitle}</span>
        </div>
        <div className="h-56">
          <ResponsiveContainer>
            <LineChart data={monthly}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="label" {...axis} {...ticks} />
              <YAxis tickLine={false} axisLine={false} {...axis} width={30} />
              <Tooltip content={<TT />} />
              <Line type="monotone" dataKey="minutes" name="min" stroke="#6ee7ff" strokeWidth={3} dot={{ r: 3, fill: "#6ee7ff" }} isAnimationActive animationDuration={800} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
