"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import { ministryTotals, monthlyFlow } from "@/lib/derive"
import { dateShort, naira, nairaShort } from "@/lib/format"
import { FlowArea, MinistryBars } from "@/components/charts"
import { Hash, PageHead, Ready, StatusMark } from "@/components/ui"

function Content() {
  const s = useStore()
  const [ministry, setMinistry] = useState("all")
  const [q, setQ] = useState("")

  const mins = ministryTotals(s)
  const rows = useMemo(() => {
    const aById = new Map(s.allocations.map((a) => [a.id, a]))
    const cById = new Map(s.contractors.map((c) => [c.id, c]))
    return [...s.disbursements]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((d) => {
        const a = aById.get(d.allocationId)!
        const rep = s.reports.filter((r) => r.disbursementId === d.id).at(-1)
        return { d, a, c: cById.get(d.contractorId)!, rep, cert: s.certificates.find((x) => x.disbursementId === d.id) }
      })
      .filter((r) => ministry === "all" || r.a.ministryId === ministry)
      .filter((r) => {
        const hay = `${r.d.project} ${r.d.milestone} ${r.c.name}`.toLowerCase()
        return hay.includes(q.trim().toLowerCase())
      })
  }, [s.allocations, s.contractors, s.disbursements, s.reports, s.certificates, ministry, q])

  const total = rows.reduce((t, r) => t + r.d.amount, 0)

  return (
    <>
      <PageHead kicker="Spending" title="Every payment to a contractor">
        Search by project or contractor. Each row links to its ledger entry, where you can check it.
      </PageHead>

      <section className="wrap pb-10 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl">By ministry</h2>
          <div className="mt-4"><MinistryBars data={mins} /></div>
        </div>
        <div>
          <h2 className="text-2xl">Released so far</h2>
          <div className="mt-4"><FlowArea data={monthlyFlow(s.disbursements)} /></div>
        </div>
      </section>

      <section className="wrap py-10 rule-top">
        <div className="grid gap-4 sm:grid-cols-[1fr_16rem] max-w-3xl">
          <div className="field">
            <label htmlFor="q">Search payments</label>
            <input id="q" className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Road, school, borehole, contractor…" />
          </div>
          <div className="field">
            <label htmlFor="m">Ministry</label>
            <select id="m" className="input" value={ministry} onChange={(e) => setMinistry(e.target.value)}>
              <option value="all">All ministries</option>
              {s.ministries.map((m) => <option key={m.id} value={m.id}>{m.short}</option>)}
            </select>
          </div>
        </div>

        <p className="mt-6 text-muted" aria-live="polite">
          {rows.length} {rows.length === 1 ? "payment" : "payments"}, {naira(total)} ({nairaShort(total)})
        </p>

        <div className="mt-2">
          <table className="t">
            <thead>
              <tr>
                <th>Date</th>
                <th>Project</th>
                <th>Ministry</th>
                <th>Contractor</th>
                <th className="num">Amount</th>
                <th>Report</th>
                <th>Entry</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ d, a, c, rep, cert }) => (
                <tr key={d.id}>
                  <td data-label="Date" className="whitespace-nowrap">{dateShort(d.createdAt)}</td>
                  <td data-label="" className="lead">
                    <span className="block font-medium">{d.project}</span>
                    <span className="block text-muted text-sm">{d.milestone}</span>
                  </td>
                  <td data-label="Ministry">{s.ministries.find((m) => m.id === a.ministryId)?.short}</td>
                  <td data-label="Contractor">{c.name}</td>
                  <td data-label="Amount" className="num">{naira(d.amount)}</td>
                  <td data-label="Report">
                    {rep ? <StatusMark status={rep.status} /> : <span className="text-muted">None yet</span>}
                    {cert && <span className="block text-sm text-muted">Certified</span>}
                  </td>
                  <td data-label="Entry"><Link className="ulink" href={`/verify?tx=${d.txHash}`}><Hash value={d.txHash} /></Link></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="text-muted">Nothing matches that search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

export default function SpendingPage() {
  return (
    <Ready>
      <Content />
    </Ready>
  )
}
