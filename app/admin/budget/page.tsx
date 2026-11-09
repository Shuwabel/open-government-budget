"use client"

import Link from "next/link"
import { useState } from "react"
import { allocationRemaining, useStore } from "@/lib/store"
import { dateShort, naira } from "@/lib/format"
import { Field, digits, useAction } from "@/components/form"
import { Hash, PageHead } from "@/components/ui"

export default function BudgetPage() {
  const s = useStore()
  const allocate = useStore((x) => x.allocate)
  const [ministryId, setMinistryId] = useState("m-health")
  const [category, setCategory] = useState("Capital")
  const [amount, setAmount] = useState("")
  const [purpose, setPurpose] = useState("")
  const { run, busy, message, clear } = useAction()

  return (
    <>
      <PageHead kicker="Budget" title="Allocate money to a ministry">
        Each allocation is written to the ledger the moment you save it. Payments can only be made against money that is still unspent.
      </PageHead>

      <div className="wrap pb-10">
        <form
          className="card p-5 grid gap-4 md:grid-cols-2 max-w-4xl"
          onSubmit={async (e) => {
            e.preventDefault()
            const r = await run(() => allocate({ ministryId, category, amount: Number(amount), purpose }))
            if (r.ok) {
              setAmount("")
              setPurpose("")
            }
          }}
        >
          <Field label="Ministry">
            {(id) => (
              <select id={id} className="input" value={ministryId} onChange={(e) => (setMinistryId(e.target.value), clear())}>
                {s.ministries.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}
          </Field>
          <Field label="Category">
            {(id) => (
              <select id={id} className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>Capital</option>
                <option>Recurrent</option>
              </select>
            )}
          </Field>
          <Field label="Amount (₦)" hint={amount ? naira(Number(amount)) : "Whole naira, for example 750000000"}>
            {(id) => <input id={id} className="input" inputMode="numeric" value={amount} onChange={(e) => (setAmount(digits(e.target.value)), clear())} required />}
          </Field>
          <Field label="What it is for">
            {(id) => <input id={id} className="input" value={purpose} onChange={(e) => (setPurpose(e.target.value), clear())} required maxLength={120} />}
          </Field>
          <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button className="btn" type="submit" disabled={busy}>Record the allocation</button>
            <div className="flex-1" aria-live="polite">{message}</div>
          </div>
        </form>
      </div>

      <section className="wrap py-10 rule-top">
        <h2 className="text-2xl">2026 allocations</h2>
        <div className="mt-4">
          <table className="t">
            <thead>
              <tr>
                <th>Date</th>
                <th>Ministry</th>
                <th>Purpose</th>
                <th className="num">Allocated</th>
                <th className="num">Still unpaid</th>
                <th>Entry</th>
              </tr>
            </thead>
            <tbody>
              {[...s.allocations].reverse().map((a) => (
                <tr key={a.id}>
                  <td data-label="Date" className="whitespace-nowrap">{dateShort(a.createdAt)}</td>
                  <td data-label="Ministry">{s.ministries.find((m) => m.id === a.ministryId)?.short} · {a.category}</td>
                  <td data-label="" className="lead">{a.purpose}</td>
                  <td data-label="Allocated" className="num">{naira(a.amount)}</td>
                  <td data-label="Still unpaid" className="num">{naira(allocationRemaining(a, s.disbursements))}</td>
                  <td data-label="Entry"><Link className="ulink" href={`/verify?tx=${a.txHash}`}><Hash value={a.txHash} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
