"use client"

import Link from "next/link"
import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useStore } from "@/lib/store"
import { describe } from "@/lib/derive"
import { EntryFields, useEntryCheck } from "@/components/entry"
import { CopyButton, Hash, Notice, PageHead, Ready } from "@/components/ui"

function Result({ query }: { query: string }) {
  const ledger = useStore((s) => s.ledger)
  const check = useEntryCheck(ledger, query)
  if (!check) return <p className="text-muted" role="status">Recomputing…</p>

  if (check.state === "not-found") {
    return (
      <Notice tone="warn">
        <p className="font-medium">No entry found for that hash.</p>
        <p className="mt-1 text-sm">
          Use the full 64-character hash, or at least the first 8 characters. This demo ledger lives in your browser, so a payment made in another browser will not appear here.
        </p>
      </Notice>
    )
  }

  const { block, recomputed, previous, next } = check
  const ok = check.state === "verified"
  return (
    <div className="space-y-8" aria-live="polite">
      {ok ? (
        <Notice tone="ok">
          <p className="font-medium text-lg">Verified. This entry is exactly as it was recorded.</p>
          <p className="mt-1 text-sm">
            Your browser recomputed the SHA-256 fingerprint from the entry&rsquo;s contents and the previous entry&rsquo;s fingerprint. Both match what is stored.
          </p>
        </Notice>
      ) : (
        <Notice tone="bad">
          <p className="font-medium text-lg">Altered. This entry no longer matches its fingerprint.</p>
          <p className="mt-1 text-sm">
            The contents recompute to a different value than the one recorded. Someone changed the record after it was written.
          </p>
        </Notice>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="card p-5">
          <p className="kicker">Entry {block.index}</p>
          <h2 className="mt-1 text-2xl">{describe(block)}</h2>
          <div className="mt-5">
            <EntryFields block={block} />
          </div>
        </section>

        <section className="card p-5 space-y-4">
          <h2 className="text-2xl">The fingerprints</h2>
          <div>
            <p className="text-sm text-muted">Recorded</p>
            <p className="mt-1"><Hash value={block.hash} full /></p>
          </div>
          <div>
            <p className="text-sm text-muted">Recomputed now</p>
            <p className={`mt-1 ${ok ? "" : "text-bad"}`}><Hash value={recomputed} full /></p>
          </div>
          <div>
            <p className="text-sm text-muted">Points back to entry {block.index > 0 ? block.index - 1 : "none (first entry)"}</p>
            <p className="mt-1"><Hash value={block.prevHash} full /></p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <CopyButton text={`${typeof window !== "undefined" ? window.location.origin : ""}/verify?tx=${block.hash}`} label="Copy link to this entry" />
          </div>
          <div className="flex flex-wrap gap-x-6 text-sm pt-1">
            {previous && (
              <Link className="ulink inline-flex min-h-11 items-center" href={`/verify?tx=${previous.hash}`}>
                Previous entry
              </Link>
            )}
            {next && (
              <Link className="ulink inline-flex min-h-11 items-center" href={`/verify?tx=${next.hash}`}>
                Next entry
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function Body() {
  const params = useSearchParams()
  const router = useRouter()
  const tx = params.get("tx") ?? ""
  const [value, setValue] = useState(tx)

  return (
    <>
      <PageHead kicker="Verify" title="Check any payment, report or certificate">
        Paste an entry hash, or open a link someone sent you. Nothing is sent anywhere: the check runs on your device.
      </PageHead>
      <div className="wrap pb-10">
        <form
          className="flex flex-col sm:flex-row gap-3 max-w-3xl"
          onSubmit={(e) => {
            e.preventDefault()
            router.push(`/verify?tx=${encodeURIComponent(value.trim())}`)
          }}
        >
          <div className="field flex-1">
            <label htmlFor="tx">Entry hash</label>
            <input id="tx" className="input hash" value={value} onChange={(e) => setValue(e.target.value)} placeholder="64-character hash, or its first 8 or more" autoComplete="off" spellCheck={false} />
          </div>
          <button type="submit" className="btn sm:self-end">Check this hash</button>
        </form>
        <div className="mt-10">{tx ? <Result query={tx} /> : <Samples />}</div>
      </div>
    </>
  )
}

function Samples() {
  const ledger = useStore((s) => s.ledger)
  const picks = ["DISBURSEMENT", "CERTIFICATE", "REPORT"].map((t) => [...ledger].reverse().find((b) => b.type === t)).filter(Boolean)
  return (
    <div>
      <h2 className="text-2xl">No hash handy? Try one of these</h2>
      <ul className="mt-4 border-t border-ink max-w-3xl">
        {picks.map((b) => (
          <li key={b!.hash} className="border-b border-rule">
            <Link href={`/verify?tx=${b!.hash}`} className="block py-3 hover:bg-sunken -mx-2 px-2 rounded-[4px]">
              <p>{describe(b!)}</p>
              <p className="text-muted mt-1"><Hash value={b!.hash} /></p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Ready>
      <Suspense fallback={null}>
        <Body />
      </Suspense>
    </Ready>
  )
}
