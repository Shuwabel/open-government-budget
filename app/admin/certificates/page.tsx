"use client"

import Link from "next/link"
import { useStore } from "@/lib/store"
import { dateShort } from "@/lib/format"
import { useAction } from "@/components/form"
import { Hash, PageHead } from "@/components/ui"

export default function CertificatesPage() {
  const s = useStore()
  const issue = useStore((x) => x.issueCertificate)
  const { run, busy, message } = useAction()
  const eligible = s.disbursements.filter(
    (d) => s.reports.some((r) => r.disbursementId === d.id && r.status === "approved") && !s.certificates.some((c) => c.disbursementId === d.id),
  )

  return (
    <>
      <PageHead kicker="Certificates" title="Certify finished work">
        A completion certificate is a ledger entry. It can only be issued for a payment whose spending report was approved, and anyone can verify it from its link.
      </PageHead>

      <section className="wrap pb-10">
        <h2 className="text-2xl">Ready to certify ({eligible.length})</h2>
        <ul className="mt-4 border-t border-ink max-w-4xl">
          {eligible.map((d) => (
            <li key={d.id} className="border-b border-rule py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium">{d.project}</p>
                <p className="text-sm text-muted">{s.contractors.find((c) => c.id === d.contractorId)?.name} · {d.milestone}</p>
              </div>
              <button className="btn" disabled={busy} onClick={() => run(() => issue(d.id))}>Issue certificate</button>
            </li>
          ))}
          {eligible.length === 0 && <li className="py-3 text-muted border-b border-rule">No approved work is waiting for a certificate.</li>}
        </ul>
        <div className="mt-4 max-w-4xl" aria-live="polite">{message}</div>
      </section>

      <section className="wrap py-10 rule-top">
        <h2 className="text-2xl">Issued ({s.certificates.length})</h2>
        <div className="mt-4">
          <table className="t">
            <thead>
              <tr>
                <th>Issued</th>
                <th>Project</th>
                <th>Contractor</th>
                <th>Entry</th>
              </tr>
            </thead>
            <tbody>
              {[...s.certificates].reverse().map((c) => (
                <tr key={c.id}>
                  <td data-label="Issued" className="whitespace-nowrap">{dateShort(c.issuedAt)}</td>
                  <td data-label="" className="lead font-medium">{c.project}</td>
                  <td data-label="Contractor">{s.contractors.find((x) => x.id === c.contractorId)?.name}</td>
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
