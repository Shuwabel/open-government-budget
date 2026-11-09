"use client"

import Link from "next/link"
import { useState } from "react"
import { allocationRemaining, useStore } from "@/lib/store"
import { dateShort, naira } from "@/lib/format"
import { Field, digits, useAction } from "@/components/form"
import { Hash, PageHead, StatusMark } from "@/components/ui"
import type { Report, Result } from "@/lib/types"

function ReviewRow({ r, run, busy }: { r: Report; run: (fn: () => Promise<Result>) => Promise<Result>; busy: boolean }) {
  const s = useStore()
  const review = useStore((x) => x.reviewReport)
  const [note, setNote] = useState("")
  const d = s.disbursements.find((x) => x.id === r.disbursementId)
  const c = s.contractors.find((x) => x.id === r.contractorId)
  const over = d ? r.amountSpent > d.amount : false
  return (
    <li className="card p-5">
      <div className="flex flex-wrap justify-between gap-2">
        <p className="font-serif text-xl">{d?.project}</p>
        <StatusMark status={r.status} />
      </div>
      <p className="text-muted text-sm mt-1">
        {c?.name} · submitted {dateShort(r.submittedAt)} · paid {naira(d?.amount ?? 0)}, reports {naira(r.amountSpent)} spent
      </p>
      <p className="mt-3">{r.summary}</p>
      {over && <p className="mt-2 text-warn text-sm">The spent figure is above the amount released.</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] items-end">
        <Field label="Note for the contractor (needed to reject)">
          {(id) => <input id={id} className="input" value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
        <button className="btn" disabled={busy} onClick={() => run(() => review(r.id, "approved", note))}>Approve</button>
        <button className="btn btn-quiet" disabled={busy} onClick={() => run(() => review(r.id, "rejected", note))}>Reject</button>
      </div>
    </li>
  )
}

export default function PaymentsPage() {
  const s = useStore()
  const disburse = useStore((x) => x.disburse)
  const [allocationId, setAllocationId] = useState("a-05")
  const [contractorId, setContractorId] = useState("c-01")
  const [project, setProject] = useState("")
  const [milestone, setMilestone] = useState("")
  const [amount, setAmount] = useState("")
  const { run, busy, message, clear } = useAction()
  const review = useAction()
  const alloc = s.allocations.find((a) => a.id === allocationId)
  const left = alloc ? allocationRemaining(alloc, s.disbursements) : 0
  const pending = s.reports.filter((r) => r.status === "pending")

  return (
    <>
      <PageHead kicker="Payments" title="Pay a contractor, then review what they report">
        A payment is tied to one allocation. The contractor then reports what was spent, and you approve or reject it.
      </PageHead>

      <div className="wrap pb-10">
        <form
          className="card p-5 grid gap-4 md:grid-cols-2 max-w-4xl"
          onSubmit={async (e) => {
            e.preventDefault()
            const r = await run(() => disburse({ allocationId, contractorId, project, milestone, amount: Number(amount) }))
            if (r.ok) {
              setProject("")
              setMilestone("")
              setAmount("")
            }
          }}
        >
          <Field label="Pay from this allocation" hint={`${naira(left)} still unpaid`}>
            {(id) => (
              <select id={id} className="input" value={allocationId} onChange={(e) => (setAllocationId(e.target.value), clear())}>
                {s.allocations.map((a) => (
                  <option key={a.id} value={a.id}>
                    {s.ministries.find((m) => m.id === a.ministryId)?.short} · {a.purpose}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Contractor">
            {(id) => (
              <select id={id} className="input" value={contractorId} onChange={(e) => setContractorId(e.target.value)}>
                {s.contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </Field>
          <Field label="Project">
            {(id) => <input id={id} className="input" value={project} onChange={(e) => (setProject(e.target.value), clear())} required maxLength={80} />}
          </Field>
          <Field label="Milestone being paid">
            {(id) => <input id={id} className="input" value={milestone} onChange={(e) => (setMilestone(e.target.value), clear())} required maxLength={80} />}
          </Field>
          <Field label="Amount (₦)" hint={amount ? naira(Number(amount)) : undefined}>
            {(id) => <input id={id} className="input" inputMode="numeric" value={amount} onChange={(e) => (setAmount(digits(e.target.value)), clear())} required />}
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <button className="btn" type="submit" disabled={busy}>Record the payment</button>
          </div>
          <div className="md:col-span-2" aria-live="polite">{message}</div>
        </form>
      </div>

      <section className="wrap py-10 rule-top">
        <h2 className="text-2xl">Reports to review ({pending.length})</h2>
        <div className="mt-4 max-w-4xl" aria-live="polite">{review.message}</div>
        <ul className="mt-4 grid gap-4 max-w-4xl">
          {pending.map((r) => <ReviewRow key={r.id} r={r} run={review.run} busy={review.busy} />)}
          {pending.length === 0 && <li className="text-muted">Nothing waiting. Sign in as a contractor and submit a report to see this fill.</li>}
        </ul>
      </section>

      <section className="wrap py-10 rule-top">
        <h2 className="text-2xl">All payments</h2>
        <div className="mt-4">
          <table className="t">
            <thead>
              <tr>
                <th>Date</th>
                <th>Project</th>
                <th>Contractor</th>
                <th className="num">Amount</th>
                <th>Report</th>
                <th>Entry</th>
              </tr>
            </thead>
            <tbody>
              {[...s.disbursements].reverse().map((d) => {
                const rep = s.reports.filter((r) => r.disbursementId === d.id).at(-1)
                return (
                  <tr key={d.id}>
                    <td data-label="Date" className="whitespace-nowrap">{dateShort(d.createdAt)}</td>
                    <td data-label="" className="lead"><span className="font-medium">{d.project}</span><span className="block text-sm text-muted">{d.milestone}</span></td>
                    <td data-label="Contractor">{s.contractors.find((c) => c.id === d.contractorId)?.name}</td>
                    <td data-label="Amount" className="num">{naira(d.amount)}</td>
                    <td data-label="Report">{rep ? <StatusMark status={rep.status} /> : <span className="text-muted">None yet</span>}</td>
                    <td data-label="Entry"><Link className="ulink" href={`/verify?tx=${d.txHash}`}><Hash value={d.txHash} /></Link></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
