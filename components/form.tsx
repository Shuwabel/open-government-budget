"use client"

import Link from "next/link"
import { useId, useState } from "react"
import type { Result } from "@/lib/types"
import { Notice } from "@/components/ui"

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: (id: string) => React.ReactNode
}) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

/** Runs a store action and shows the outcome, with a link to the new ledger entry. */
export function useAction() {
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)
  const run = async (fn: () => Promise<Result>) => {
    setBusy(true)
    const r = await fn()
    setResult(r)
    setBusy(false)
    return r
  }
  const message = result ? (
    result.ok ? (
      <Notice tone="ok">
        <p className="font-medium">Recorded.</p>
        <p className="text-sm mt-1">
          <Link className="ulink" href={`/verify?tx=${result.txHash}`}>
            See the new ledger entry
          </Link>
        </p>
      </Notice>
    ) : (
      <Notice tone="bad">{result.error}</Notice>
    )
  ) : null
  return { run, busy, message, clear: () => setResult(null) }
}

export const digits = (v: string) => v.replace(/[^\d]/g, "")
