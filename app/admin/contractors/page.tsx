"use client"

import Link from "next/link"
import { useState } from "react"
import { useStore } from "@/lib/store"
import { naira } from "@/lib/format"
import { Field, useAction } from "@/components/form"
import { Hash, PageHead } from "@/components/ui"

export default function ContractorsPage() {
  const s = useStore()
  const register = useStore((x) => x.registerContractor)
  const [name, setName] = useState("")
  const [sector, setSector] = useState("")
  const [city, setCity] = useState("")
  const { run, busy, message, clear } = useAction()

  return (
    <>
      <PageHead kicker="Contractors" title="Who is allowed to be paid">
        Only registered contractors can receive a payment. The registration itself is a ledger entry.
      </PageHead>

      <div className="wrap pb-10">
        <form
          className="card p-5 grid gap-4 md:grid-cols-3 max-w-4xl"
          onSubmit={async (e) => {
            e.preventDefault()
            const r = await run(() => register({ name, sector, city }))
            if (r.ok) {
              setName("")
              setSector("")
              setCity("")
            }
          }}
        >
          <Field label="Company name">
            {(id) => <input id={id} className="input" value={name} onChange={(e) => (setName(e.target.value), clear())} required maxLength={80} />}
          </Field>
          <Field label="Sector">
            {(id) => <input id={id} className="input" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Roads, water, ICT…" maxLength={60} />}
          </Field>
          <Field label="Town">
            {(id) => <input id={id} className="input" value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} />}
          </Field>
          <div className="md:col-span-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button className="btn" type="submit" disabled={busy}>Register the contractor</button>
            <div className="flex-1" aria-live="polite">{message}</div>
          </div>
        </form>
      </div>

      <section className="wrap py-10 rule-top">
        <h2 className="text-2xl">{s.contractors.length} registered contractors</h2>
        <div className="mt-4">
          <table className="t">
            <thead>
              <tr>
                <th>Company</th>
                <th>Registration</th>
                <th>Sector</th>
                <th className="num">Paid so far</th>
                <th className="num">Certificates</th>
                <th>Entry</th>
              </tr>
            </thead>
            <tbody>
              {s.contractors.map((c) => (
                <tr key={c.id}>
                  <td data-label="" className="lead font-medium">{c.name}<span className="block text-sm text-muted font-normal">{c.city}</span></td>
                  <td data-label="Registration">{c.registration}</td>
                  <td data-label="Sector">{c.sector}</td>
                  <td data-label="Paid so far" className="num">{naira(s.disbursements.filter((d) => d.contractorId === c.id).reduce((t, d) => t + d.amount, 0))}</td>
                  <td data-label="Certificates" className="num">{s.certificates.filter((x) => x.contractorId === c.id).length}</td>
                  <td data-label="Entry"><Link className="ulink" href={`/verify?tx=${c.txHash}`}><Hash value={c.txHash} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
