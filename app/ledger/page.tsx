"use client"

import Link from "next/link"
import { useState } from "react"
import { useStore } from "@/lib/store"
import { describe, TYPE_LABEL } from "@/lib/derive"
import { dateShort, naira } from "@/lib/format"
import { Hash, Notice, PageHead, Ready } from "@/components/ui"

function Tamper() {
  const ledger = useStore((s) => s.ledger)
  const chain = useStore((s) => s.chain)
  const tampered = useStore((s) => s.tampered)
  const tamper = useStore((s) => s.tamper)
  const restore = useStore((s) => s.restore)
  const targets = ledger.filter((b) => b.type === "DISBURSEMENT" || b.type === "ALLOCATION")
  const [index, setIndex] = useState<number>(() => targets.find((b) => b.type === "DISBURSEMENT")?.index ?? targets[0]?.index ?? 0)
  const [amount, setAmount] = useState("1000000")
  const [rehash, setRehash] = useState(false)
  const picked = ledger[index]
  const touched = Object.keys(tampered).length > 0
  const broken = chain && !chain.ok

  return (
    <section id="tamper" className="wrap py-10 md:py-14 rule-top scroll-mt-24">
      <h2 className="text-3xl md:text-4xl">Tamper check</h2>
      <p className="mt-3 max-w-2xl text-muted">
        Play the insider who wants to quietly change a payment. Edit one stored amount, then watch the ledger notice. This only changes the copy in your browser, and
        you can undo it.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          className="card p-5 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            const n = Number(amount)
            if (n >= 0 && Number.isFinite(n)) await tamper(index, n, rehash)
          }}
        >
          <div className="field">
            <label htmlFor="t-entry">Entry to change</label>
            <select id="t-entry" className="input" value={index} onChange={(e) => setIndex(Number(e.target.value))}>
              {targets.map((b) => (
                <option key={b.index} value={b.index}>
                  #{b.index} · {TYPE_LABEL[b.type]} · {naira(Number(b.payload.amount))} · {String(b.payload.project ?? b.payload.purpose).slice(0, 36)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="t-amount">Change the amount to (₦)</label>
            <input id="t-amount" className="input" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} />
          </div>
          <label className="flex items-start gap-3 min-h-11 cursor-pointer">
            <input type="checkbox" className="mt-1.5 size-5 accent-[var(--accent)]" checked={rehash} onChange={(e) => setRehash(e.target.checked)} />
            <span>
              <span className="font-medium">Also recalculate that entry&rsquo;s fingerprint</span>
              <span className="block hint">A careful attacker would. See what the next entry says.</span>
            </span>
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" className="btn btn-danger" disabled={!picked}>Change the stored amount</button>
            <button type="button" className="btn btn-quiet" onClick={() => restore()} disabled={!touched}>Undo the change</button>
          </div>
        </form>

        <div aria-live="polite">
          {broken && chain ? (
            <div className="space-y-4 snap">
              <Notice tone="bad">
                <p className="text-lg font-medium">Tampering found at entry {chain.brokenAt}.</p>
                <p className="mt-1 text-sm">
                  {chain.reason === "content-changed"
                    ? `The contents of entry ${chain.brokenAt} no longer produce the fingerprint recorded for it.`
                    : `Entry ${chain.brokenAt} points back to a fingerprint that entry ${(chain.brokenAt ?? 1) - 1} no longer has. Recalculating one fingerprint just moves the break to the next link.`}
                </p>
              </Notice>
              <p className="text-sm text-muted">
                Every entry from #{chain.brokenAt} onward can no longer be trusted. The header and footer now say so on every page.
              </p>
              {chain.brokenAt !== null && (
                <Link href={`/verify?tx=${ledger[chain.brokenAt].hash}`} className="ulink inline-flex min-h-11 items-center font-medium">
                  Open entry {chain.brokenAt} on the verify page
                </Link>
              )}
            </div>
          ) : (
            <Notice tone="ok">
              <p className="text-lg font-medium">All {chain?.checked ?? ledger.length} entries check out.</p>
              <p className="mt-1 text-sm">Each entry&rsquo;s fingerprint recomputes correctly, and each one points at the fingerprint of the entry before it.</p>
            </Notice>
          )}
        </div>
      </div>
    </section>
  )
}

function Content() {
  const ledger = useStore((s) => s.ledger)
  const chain = useStore((s) => s.chain)
  const resetDemo = useStore((s) => s.resetDemo)
  const [shown, setShown] = useState(20)
  const rows = [...ledger].reverse().slice(0, shown)
  const bad = chain?.brokenAt ?? Infinity

  return (
    <>
      <PageHead kicker="Ledger" title="Every entry, newest first">
        Each entry holds a record and the fingerprint of the one before it. That chain is what makes a quiet edit show up.
      </PageHead>

      <Tamper />

      <section className="wrap py-10 md:py-14 rule-top">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl md:text-4xl">{ledger.length} entries</h2>
          <button className="btn btn-quiet" onClick={() => resetDemo()}>Reset the demo data</button>
        </div>
        <div className="mt-6">
          <table className="t">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Record</th>
                <th>Fingerprint</th>
                <th>Check</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.index}>
                  <td data-label="Entry" className="lead">{b.index}</td>
                  <td data-label="Date" className="whitespace-nowrap">{dateShort(b.timestamp)}</td>
                  <td data-label="" className="md:max-w-[34rem]">
                    <span className="text-muted text-sm block">{TYPE_LABEL[b.type]}</span>
                    <Link href={`/verify?tx=${b.hash}`} className="ulink">{describe(b)}</Link>
                  </td>
                  <td data-label="Hash"><Hash value={b.hash} /></td>
                  <td data-label="Check">
                    {b.index < bad ? <span className="mark mark-ok">Intact</span> : <span className="mark mark-bad">{b.index === bad ? "Altered" : "After a break"}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {shown < ledger.length && (
          <button className="btn btn-quiet mt-6" onClick={() => setShown(shown + 30)}>Show 30 more</button>
        )}
      </section>

      <section className="wrap py-10 rule-top">
        <h2 className="text-2xl">What this is, and is not</h2>
        <p className="mt-3 max-w-2xl text-muted">
          Entries are hashed with SHA-256 using the Web Crypto API and chained, as in a blockchain. The ledger is stored in this browser. There are no other computers
          holding copies, no consensus and no wallet. A production system would publish these fingerprints somewhere the budget office cannot rewrite.
        </p>
      </section>
    </>
  )
}

export default function LedgerPage() {
  return (
    <Ready>
      <Content />
    </Ready>
  )
}
