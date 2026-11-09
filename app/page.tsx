"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useStore } from "@/lib/store"
import { monthlyFlow, ministryTotals, overview, describe, TYPE_LABEL } from "@/lib/derive"
import { nairaShort, dateShort } from "@/lib/format"
import { FlowArea, MinistryBars } from "@/components/charts"
import { EntryFields, useEntryCheck } from "@/components/entry"
import { Hash, Ready, Stat } from "@/components/ui"

function HeroEntry() {
  const ledger = useStore((s) => s.ledger)
  const latestPay = [...ledger].reverse().find((b) => b.type === "DISBURSEMENT") ?? null
  const check = useEntryCheck(ledger, latestPay?.hash ?? null)
  if (!latestPay) return null
  return (
    <div className="card enter enter-2 overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-rule">
        <p className="kicker">Ledger entry {latestPay.index}</p>
        <p className="mt-1 font-serif text-xl leading-snug">{describe(latestPay)}</p>
      </div>
      <div className="px-5 py-4">
        <EntryFields block={latestPay} />
      </div>
      <div className="px-5 py-4 bg-sunken border-t border-rule">
        <p className="text-sm text-muted">Fingerprint (SHA-256)</p>
        <p className="mt-1">
          <Hash value={latestPay.hash} full />
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm" aria-live="polite">
          {check?.state === "verified" ? (
            <>
              <svg className="tick shrink-0" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M3 9.5l4 4 8-9" fill="none" stroke="var(--accent)" strokeWidth="2.2" pathLength={1} />
              </svg>
              <span className="font-medium text-accent">Recomputed just now in your browser. It matches.</span>
            </>
          ) : (
            <span className="text-muted">Checking…</span>
          )}
        </div>
        <Link href={`/verify?tx=${latestPay.hash}`} className="mt-3 inline-flex min-h-11 items-center gap-1 ulink font-medium">
          Open this entry on the verify page <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </div>
  )
}

function Content() {
  const s = useStore()
  const o = overview(s)
  const mins = ministryTotals(s)
  const flow = monthlyFlow(s.disbursements)
  const recent = [...s.ledger].reverse().slice(0, 5)
  return (
    <>
      <section className="wrap pt-10 pb-14 md:pt-16 md:pb-20 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 items-start">
        <div className="enter">
          <p className="kicker">Public budget tracking, Ogbe State (fictional)</p>
          <h1 className="mt-3 text-[2.4rem] leading-[1.04] md:text-6xl">See where every naira of the state budget went.</h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Allocations, payments to contractors and the spending reports that follow are written into a chained ledger. Anyone can recompute an
            entry&rsquo;s fingerprint and see whether it was changed.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link href="/spending" className="btn">
              Explore the spending
            </Link>
            <Link href="/ledger#tamper" className="btn btn-quiet">
              Try to alter an entry
            </Link>
          </div>
        </div>
        <HeroEntry />
      </section>

      <section className="wrap py-10 md:py-14 rule-top">
        <h2 className="text-3xl md:text-4xl max-w-2xl">The 2026 budget at a glance</h2>
        <div className="mt-8 grid gap-6 grid-cols-2 lg:grid-cols-4">
          <Stat label="Allocated" value={nairaShort(o.allocated)} note={`${s.allocations.length} allocations`} />
          <Stat label="Paid to contractors" value={nairaShort(o.paid)} note={`${Math.round((o.paid / o.allocated) * 100)}% of the budget`} />
          <Stat label="Backed by approved reports" value={nairaShort(o.verified)} note="Reviewed by the budget office" />
          <Stat label="Reports waiting" value={String(o.pending)} note="Not yet reviewed" />
        </div>
      </section>

      <section className="wrap py-10 md:py-14 rule-top grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 className="text-3xl md:text-4xl">Money paid out, ministry by ministry</h2>
          <p className="mt-4 text-muted max-w-md">
            Green is already paid to contractors. Tan is budgeted and not yet paid. Hover or tap a bar for the exact figure.
          </p>
          <Link href="/spending" className="mt-5 inline-flex min-h-11 items-center gap-1 ulink font-medium">
            Every payment, searchable <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <MinistryBars data={mins} />
      </section>

      <section className="wrap py-10 md:py-14 rule-top">
        <h2 className="text-3xl md:text-4xl max-w-2xl">How a payment is recorded</h2>
        <ol className="mt-8 grid gap-0 md:grid-cols-4 border-t border-ink">
          {[
            ["Allocate", "The budget office sets money aside for a ministry and says what it is for."],
            ["Pay", "A payment to a registered contractor is tied to one allocation and one milestone."],
            ["Report", "The contractor reports what was spent and what was built."],
            ["Certify", "After an approved report, the office issues a completion certificate."],
          ].map(([t, d], i) => (
            <li key={t} className="py-5 md:pr-6 border-b md:border-b-0 border-rule">
              <p className="font-serif text-4xl text-accent">{i + 1}</p>
              <p className="mt-2 text-xl font-medium">{t}</p>
              <p className="mt-1 text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap py-10 md:py-14 rule-top grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl md:text-4xl">Payments released over the year</h2>
          <p className="mt-4 text-muted max-w-md">Running total of money paid to contractors since January.</p>
          <div className="mt-6">
            <FlowArea data={flow} />
          </div>
        </div>
        <div>
          <h2 className="text-3xl md:text-4xl">Latest entries</h2>
          <ul className="mt-6 border-t border-ink">
            {recent.map((b) => (
              <li key={b.hash} className="border-b border-rule">
                <Link href={`/verify?tx=${b.hash}`} className="block py-3 hover:bg-sunken -mx-2 px-2 rounded-[4px]">
                  <p className="text-sm text-muted">
                    {TYPE_LABEL[b.type]} · {dateShort(b.timestamp)} · entry {b.index}
                  </p>
                  <p>{describe(b)}</p>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/ledger" className="mt-4 inline-flex min-h-11 items-center gap-1 ulink font-medium">
            Read the whole ledger <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </section>

      <section className="wrap py-10 md:py-14 rule-top">
        <h2 className="text-3xl md:text-4xl max-w-2xl">Three ways in</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["/login", "Budget office", "Allocate money, pay a contractor, review reports and issue certificates."],
            ["/login", "Contractor", "See payments made to you, submit a spending report, collect certificates."],
            ["/verify", "Anyone", "Paste an entry hash or open a link. No sign-in. The check runs on your device."],
          ].map(([href, t, d]) => (
            <Link key={t} href={href} className="card p-5 block">
              <p className="text-xl font-serif">{t}</p>
              <p className="mt-2 text-muted">{d}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}

export default function Home() {
  return (
    <Ready>
      <Content />
    </Ready>
  )
}
