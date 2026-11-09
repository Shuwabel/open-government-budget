"use client"

import Link from "next/link"
import { useStore } from "@/lib/store"
import { ministryTotals, overview } from "@/lib/derive"
import { dateShort, naira, nairaShort } from "@/lib/format"
import { MinistryBars } from "@/components/charts"
import { PageHead, Stat } from "@/components/ui"

export default function AdminHome() {
  const s = useStore()
  const o = overview(s)
  const mins = ministryTotals(s)
  const pending = s.reports.filter((r) => r.status === "pending")
  const eligible = s.disbursements.filter(
    (d) => s.reports.some((r) => r.disbursementId === d.id && r.status === "approved") && !s.certificates.some((c) => c.disbursementId === d.id),
  )

  return (
    <>
      <PageHead kicker="Budget office" title="Today at the budget office" />
      <section className="wrap pb-10 grid gap-6 grid-cols-2 lg:grid-cols-4">
        <Stat label="Allocated" value={nairaShort(o.allocated)} />
        <Stat label="Paid out" value={nairaShort(o.paid)} />
        <Stat label="Still unpaid" value={nairaShort(o.allocated - o.paid)} />
        <Stat label="Reports to review" value={String(pending.length)} />
      </section>

      <section className="wrap py-10 rule-top grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl">Waiting for you</h2>
          <ul className="mt-4 border-t border-ink">
            {pending.map((r) => {
              const d = s.disbursements.find((x) => x.id === r.disbursementId)
              const c = s.contractors.find((x) => x.id === r.contractorId)
              return (
                <li key={r.id} className="border-b border-rule py-3">
                  <p className="font-medium">{d?.project}</p>
                  <p className="text-muted text-sm">
                    {c?.name} · {naira(r.amountSpent)} · {dateShort(r.submittedAt)}
                  </p>
                </li>
              )
            })}
            {pending.length === 0 && <li className="py-3 text-muted border-b border-rule">No reports are waiting.</li>}
          </ul>
          <Link href="/admin/disbursements" className="btn mt-5">Review reports</Link>
          {eligible.length > 0 && (
            <p className="mt-6 text-muted">
              {eligible.length} approved {eligible.length === 1 ? "project is" : "projects are"} ready for a{" "}
              <Link className="ulink text-ink" href="/admin/certificates">completion certificate</Link>.
            </p>
          )}
        </div>
        <div>
          <h2 className="text-2xl">Budget used, by ministry</h2>
          <div className="mt-4"><MinistryBars data={mins} /></div>
        </div>
      </section>
    </>
  )
}
