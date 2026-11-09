"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import { shortHash } from "@/lib/ledger"
import type { Role } from "@/lib/types"

/** Waits for the in-browser store so pages never flash empty or mismatched data. */
export function Ready({ children }: { children: React.ReactNode }) {
  const ready = useStore((s) => s.ready)
  if (!ready)
    return (
      <div className="wrap py-16" role="status" aria-live="polite">
        <p className="text-muted">Opening the ledger and checking every link…</p>
      </div>
    )
  return <>{children}</>
}

/** Admin and contractor areas: demo sign-in only. */
export function RoleGate({ role, children }: { role: Exclude<Role, "public">; children: React.ReactNode }) {
  const session = useStore((s) => s.session)
  const ok = session.role === role
  return (
    <Ready>
      {ok ? (
        children
      ) : (
        <div className="wrap py-16 max-w-2xl">
          <h1 className="text-3xl">This area needs a demo sign-in</h1>
          <p className="mt-3 text-muted">
            There are no accounts and no passwords here. Pick a role on the sign-in page and you are in.
          </p>
          <Link href="/login" className="btn mt-6">
            Go to sign in
          </Link>
        </div>
      )}
    </Ready>
  )
}

export function Hash({ value, full = false }: { value: string; full?: boolean }) {
  return <span className="hash" title={value}>{full ? value : shortHash(value)}</span>
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 1600)
    return () => clearTimeout(t)
  }, [done])
  return (
    <button
      type="button"
      className="btn btn-quiet"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
        } catch {
          setDone(false)
        }
      }}
    >
      {done ? "Copied" : label}
    </button>
  )
}

export function PageHead({ kicker, title, children }: { kicker?: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="wrap pt-10 pb-6 md:pt-14">
      {kicker && <p className="kicker">{kicker}</p>}
      <h1 className="mt-2 text-[2rem] md:text-5xl max-w-3xl">{title}</h1>
      {children && <div className="mt-4 max-w-2xl text-muted text-lg">{children}</div>}
    </header>
  )
}

export function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border-t border-ink pt-3">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-serif text-3xl md:text-4xl">{value}</p>
      {note && <p className="mt-1 text-sm text-muted">{note}</p>}
    </div>
  )
}

export function Notice({ tone = "ok", children }: { tone?: "ok" | "bad" | "warn"; children: React.ReactNode }) {
  const t = { ok: "bg-accent-soft text-ink border-accent", bad: "bg-bad-soft text-ink border-bad", warn: "bg-warn-soft text-ink border-warn" }[tone]
  return (
    <div role={tone === "bad" ? "alert" : "status"} className={`border-l-4 px-4 py-3 rounded-r-[4px] ${t}`}>
      {children}
    </div>
  )
}

export function StatusMark({ status }: { status: "pending" | "approved" | "rejected" }) {
  const cls = { pending: "mark-warn", approved: "mark-ok", rejected: "mark-bad" }[status]
  const label = { pending: "Awaiting review", approved: "Approved", rejected: "Rejected" }[status]
  return <span className={`mark ${cls}`}>{label}</span>
}
