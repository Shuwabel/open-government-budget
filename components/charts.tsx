"use client"

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { nairaShort, naira } from "@/lib/format"

const tick = { fill: "var(--muted)", fontSize: 12 }

function Tip({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-sm">
      <p className="font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-muted">
          {p.name}: <span className="text-ink">{naira(Number(p.value))}</span>
        </p>
      ))}
    </div>
  )
}

export function MinistryBars({ data }: { data: { short: string; paid: number; left: number }[] }) {
  const h = 52 * data.length + 40
  return (
    <div role="img" aria-label={`Paid and unspent budget for each of ${data.length} ministries`} style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }} barCategoryGap={12}>
          <CartesianGrid horizontal={false} stroke="var(--rule)" />
          <XAxis type="number" tickFormatter={nairaShort} tick={tick} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="short" width={84} tick={{ fill: "var(--ink)", fontSize: 13 }} axisLine={false} tickLine={false} />
          <Tooltip content={<Tip />} cursor={{ fill: "var(--sunken)" }} />
          <Bar dataKey="paid" name="Paid out" stackId="a" fill="var(--series-a)" isAnimationActive={false} />
          <Bar dataKey="left" name="Not yet paid" stackId="a" fill="var(--series-b)" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function FlowArea({ data }: { data: { label: string; total: number }[] }) {
  return (
    <div role="img" aria-label="Cumulative payments released, month by month" style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="flow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--series-a)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--series-a)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--rule)" />
          <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={nairaShort} tick={tick} axisLine={false} tickLine={false} width={64} />
          <Tooltip content={<Tip />} />
          <Area type="monotone" dataKey="total" name="Released so far" stroke="var(--series-a)" strokeWidth={2} fill="url(#flow)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
