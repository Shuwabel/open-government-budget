"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useStore } from "@/lib/store"
import { PageHead, Ready } from "@/components/ui"

function Content() {
  const router = useRouter()
  const contractors = useStore((s) => s.contractors)
  const signIn = useStore((s) => s.signIn)
  const [cid, setCid] = useState("c-01")

  return (
    <>
      <PageHead kicker="Sign in" title="Pick a role to try the demo">
        There are no accounts or passwords. Each button signs you in as a fictional person, and everything you do stays in this browser.
      </PageHead>
      <div className="wrap grid gap-5 md:grid-cols-3 pb-10">
        <section className="card p-5 flex flex-col">
          <h2 className="text-2xl">Budget office</h2>
          <p className="mt-2 text-muted flex-1">Allocate budget, pay contractors, review spending reports, issue completion certificates.</p>
          <button
            className="btn mt-5"
            onClick={() => {
              signIn({ role: "official" })
              router.push("/admin")
            }}
          >
            Enter as the budget officer
          </button>
        </section>

        <section className="card p-5 flex flex-col">
          <h2 className="text-2xl">Contractor</h2>
          <p className="mt-2 text-muted">See payments made to your company, submit a spending report, view your certificates.</p>
          <div className="field mt-4 flex-1">
            <label htmlFor="who">Sign in as</label>
            <select id="who" className="input" value={cid} onChange={(e) => setCid(e.target.value)}>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button
            className="btn mt-5"
            onClick={() => {
              signIn({ role: "contractor", contractorId: cid })
              router.push("/contractor")
            }}
          >
            Enter as this contractor
          </button>
        </section>

        <section className="card p-5 flex flex-col">
          <h2 className="text-2xl">Public</h2>
          <p className="mt-2 text-muted flex-1">No sign-in needed. Browse spending, read the ledger and verify any entry.</p>
          <button
            className="btn btn-quiet mt-5"
            onClick={() => {
              signIn({ role: "public" })
              router.push("/spending")
            }}
          >
            Continue as a citizen
          </button>
        </section>
      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <Ready>
      <Content />
    </Ready>
  )
}
