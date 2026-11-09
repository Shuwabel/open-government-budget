"use client"

import { useEffect, useState } from "react"
import { checkEntry, type EntryCheck } from "@/lib/ledger"
import { TYPE_LABEL } from "@/lib/derive"
import { dateShort } from "@/lib/format"
import type { Block } from "@/lib/types"

export function useEntryCheck(ledger: Block[], hash: string | null) {
  const [check, setCheck] = useState<EntryCheck | null>(null)
  useEffect(() => {
    let live = true
    if (!hash) return
    checkEntry(ledger, hash).then((c) => live && setCheck(c))
    return () => {
      live = false
    }
  }, [ledger, hash])
  return hash ? check : null
}

const FIELD_LABEL: Record<string, string> = {
  ministry: "Ministry",
  allocation: "Allocation",
  contractor: "Contractor",
  project: "Project",
  milestone: "Milestone",
  amount: "Amount",
  purpose: "Purpose",
  category: "Category",
  fiscalYear: "Fiscal year",
  name: "Name",
  registration: "Registration",
  sector: "Sector",
  summary: "Summary",
  decision: "Decision",
  note: "Note",
  report: "Report",
  disbursement: "Payment",
}

export function EntryFields({ block }: { block: Block }) {
  const rows = Object.entries(block.payload).filter(([k]) => k !== "record")
  return (
    <dl className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-4 gap-y-2 text-[0.95rem]">
      <dt className="text-muted">Type</dt>
      <dd>{TYPE_LABEL[block.type]}</dd>
      <dt className="text-muted">Recorded</dt>
      <dd>
        {dateShort(block.timestamp)} by {block.actor}
      </dd>
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{FIELD_LABEL[k] ?? k}</dt>
          <dd className="break-words">{k === "amount" ? `₦${Number(v).toLocaleString("en")}` : String(v)}</dd>
        </div>
      ))}
    </dl>
  )
}
