"use client"

import Link from "next/link"
import { useState } from "react"
import { useStore } from "@/lib/store"
import { dateShort, naira } from "@/lib/format"
import { Field, digits, useAction } from "@/components/form"
import { Hash, PageHead, RoleGate, Stat, StatusMark } from "@/components/ui"
import { nairaShort } from "@/lib/format"

function Content() {
  const s = useStore()
  const submit = useStore((x) => x.submitReport)
  const me = s.contractors.find((c) => c.id === s.session.contractorId)
  const mine = s.disbursements.filter((d) => d.contractorId === me?.id)
  const open = mine.filter((d) => !s.reports.some((r) => r.disbursementId === d.id && r.status !== "rejected"))
  const [disbursementId, setDisbursementId] = useState("")
  const [amountSpent, setAmountSpent] = useState("")
  const [summary, setSummary] = useState("")
  const { run, busy, message, clear } = useAction()
  const selected = open.find((d) => d.id === disbursementId) ?? open[0]
  const myReports = s.reports.filter((r) => r.contractorId === me?.id)
  const myCerts = s.certificates.filter((c) => c.contractorId === me?.id)

  if (!me) return null
  return (
    <>
      <PageHead kicker={`${me.registration} · ${me.sector}`} title={me.name}>
        Payments made to your company, the reports you owe, and the certificates you hold.
      </PageHead>

      <section className="wrap pb-10 grid gap-6 grid-cols-2 lg:grid-cols-4">
        <Stat label="Paid to you" value={nairaShort(mine.reduce((t, d) => t + d.amount, 0))} />
        <Stat label="Payments" value={String(mine.length)} />
        <Stat label="Reports owed" value={String(open.length)} />
        <Stat label="Certificates" value={String(myCerts.length)} />
      </section>

      <section className="wrap py-10 rule-top">
        <h2 className="text-2xl">Submit a spending report</h2>
        {open.length === 0 ? (
          <p className="mt-3 text-muted">Every payment to you has a report. When the budget office makes a new payment, it appears here.</p>
        ) : (
          <form
            className="card p-5 mt-4 grid gap-4 md:grid-cols-2 max-w-4xl"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!selected) return
              const r = await run(() => submit({ disbursementId: selected.id, amountSpent: Number(amountSpent), summary }))
              if (r.ok) {
                setAmountSpent("")
                setSummary("")
                setDisbursementId("")
              }
            }}
          >
            <Field label="Payment this report is for" hint={selected ? `${naira(selected.amount)} released` : undefined}>
              {(id) => (
                <select id={id} className="input" value={selected?.id ?? ""} onChange={(e) => (setDisbursementId(e.target.value), clear())}>
                  {open.map((d) => (
                    <option key={d.id} value={d.id}>{d.project} · {d.milestone}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Amount actually spent (₦)" hint={amountSpent ? naira(Number(amountSpent)) : undefined}>
              {(id) => <input id={id} className="input" inputMode="numeric" value={amountSpent} onChange={(e) => (setAmountSpent(digits(e.target.value)), clear())} required />}
            </Field>
            <div className="md:col-span-2">
              <Field label="What was done" hint="A sentence or two the public can read.">
                {(id) => <textarea id={id} className="input min-h-28" value={summary} onChange={(e) => (setSummary(e.target.value), clear())} required maxLength={300} />}
              </Field>
            </div>
            <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button className="btn" type="submit" disabled={busy}>Submit the report</button>
              <div className="flex-1" aria-live="polite">{message}</div>
            </div>
          </form>
        )}
      </section>

      <section className="wrap py-10 rule-top">
        <h2 className="text-2xl">Your reports</h2>
        <div className="mt-4">
          <table className="t">
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Project</th>
                <th className="num">Spent</th>
                <th>Status</th>
                <th>Entry</th>
              </tr>
            </thead>
            <tbody>
              {[...myReports].reverse().map((r) => {
                const d = s.disbursements.find((x) => x.id === r.disbursementId)
                return (
                  <tr key={r.id}>
                    <td data-label="Submitted" className="whitespace-nowrap">{dateShort(r.submittedAt)}</td>
                    <td data-label="" className="lead font-medium">{d?.project}<span className="block text-sm font-normal text-muted">{r.reviewNote}</span></td>
                    <td data-label="Spent" className="num">{naira(r.amountSpent)}</td>
                    <td data-label="Status"><StatusMark status={r.status} /></td>
                    <td data-label="Entry"><Link className="ulink" href={`/verify?tx=${r.txHash}`}><Hash value={r.txHash} /></Link></td>
                  </tr>
                )
              })}
              {myReports.length === 0 && <tr><td colSpan={5} className="text-muted">No reports yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="wrap py-10 rule-top">
        <h2 className="text-2xl">Your certificates</h2>
        <ul className="mt-4 border-t border-ink max-w-3xl">
          {myCerts.map((c) => (
            <li key={c.id} className="border-b border-rule py-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{c.project}</p>
                <p className="text-sm text-muted">Issued {dateShort(c.issuedAt)}</p>
              </div>
              <Link className="ulink font-medium inline-flex min-h-11 items-center" href={`/verify?tx=${c.txHash}`}>Public verification link</Link>
            </li>
          ))}
          {myCerts.length === 0 && <li className="py-3 text-muted border-b border-rule">None yet. A certificate follows an approved report.</li>}
        </ul>
      </section>
    </>
  )
}

export default function ContractorPage() {
  return (
    <RoleGate role="contractor">
      <Content />
    </RoleGate>
  )
}
