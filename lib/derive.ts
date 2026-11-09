import { monthLabel } from "./format"
import type { Allocation, Block, Disbursement, Ministry, Report } from "./types"

interface Slice {
  ministries: Ministry[]
  allocations: Allocation[]
  disbursements: Disbursement[]
  reports: Report[]
}

export function ministryTotals(s: Slice) {
  return s.ministries.map((m) => {
    const allocs = s.allocations.filter((a) => a.ministryId === m.id)
    const ids = new Set(allocs.map((a) => a.id))
    const allocated = allocs.reduce((t, a) => t + a.amount, 0)
    const paid = s.disbursements.filter((d) => ids.has(d.allocationId)).reduce((t, d) => t + d.amount, 0)
    return { id: m.id, name: m.name, short: m.short, allocated, paid, left: allocated - paid, pct: allocated ? paid / allocated : 0 }
  })
}

export function overview(s: Slice) {
  const allocated = s.allocations.reduce((t, a) => t + a.amount, 0)
  const paid = s.disbursements.reduce((t, d) => t + d.amount, 0)
  const verified = s.reports.filter((r) => r.status === "approved").reduce((t, r) => t + r.amountSpent, 0)
  const pending = s.reports.filter((r) => r.status === "pending").length
  return { allocated, paid, verified, pending }
}

/** Cumulative amount released per month, for the trend chart. */
export function monthlyFlow(disbursements: Disbursement[]) {
  const sorted = [...disbursements].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const byMonth = new Map<string, { label: string; amount: number }>()
  for (const d of sorted) {
    const key = d.createdAt.slice(0, 7)
    const row = byMonth.get(key) ?? { label: monthLabel(d.createdAt), amount: 0 }
    row.amount += d.amount
    byMonth.set(key, row)
  }
  let run = 0
  return [...byMonth.values()].map((r) => ({ label: r.label, month: r.amount, total: (run += r.amount) }))
}

/** One plain sentence for a ledger entry. */
export function describe(b: Block): string {
  const p = b.payload as Record<string, string | number | undefined>
  const money = (n: unknown) => `₦${Math.round(Number(n)).toLocaleString("en")}`
  switch (b.type) {
    case "GENESIS":
      return String(p.note ?? "Ledger opened")
    case "ALLOCATION":
      return `${money(p.amount)} allocated to ${p.ministry}: ${p.purpose}`
    case "CONTRACTOR":
      return `${p.name} registered (${p.registration})`
    case "DISBURSEMENT":
      return `${money(p.amount)} paid to ${p.contractor} for ${p.project}, ${String(p.milestone).toLowerCase()}`
    case "REPORT":
      return `${p.contractor} reported ${money(p.amount)} spent on ${p.project}`
    case "REVIEW":
      return `Report ${p.report} ${p.decision}${p.note ? `: ${p.note}` : ""}`
    case "CERTIFICATE":
      return `Completion certificate for ${p.project}, issued to ${p.contractor}`
  }
}

export const TYPE_LABEL: Record<Block["type"], string> = {
  GENESIS: "Opened",
  ALLOCATION: "Allocation",
  CONTRACTOR: "Registration",
  DISBURSEMENT: "Payment",
  REPORT: "Report",
  REVIEW: "Review",
  CERTIFICATE: "Certificate",
}
