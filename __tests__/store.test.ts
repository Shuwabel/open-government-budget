import { beforeEach, describe, expect, it } from "vitest"
import { allocationRemaining, useStore } from "@/lib/store"

const s = () => useStore.getState()

beforeEach(async () => {
  useStore.setState({ ready: false, ledger: [] })
  await s().boot()
})

describe("store", () => {
  it("boots seeded and intact", () => {
    expect(s().ready).toBe(true)
    expect(s().chain?.ok).toBe(true)
    expect(s().allocations.length).toBeGreaterThan(5)
  })

  it("allocates budget and appends a verifiable entry", async () => {
    const before = s().ledger.length
    const r = await s().allocate({ ministryId: "m-health", category: "Capital", amount: 500_000_000, purpose: "New ward" })
    expect(r.ok).toBe(true)
    expect(s().ledger.length).toBe(before + 1)
    expect(s().ledger.at(-1)!.hash).toBe(r.ok && r.txHash)
    expect(s().chain?.ok).toBe(true)
  })

  it("rejects a bad allocation", async () => {
    const r = await s().allocate({ ministryId: "m-health", category: "Capital", amount: 0, purpose: "x" })
    expect(r.ok).toBe(false)
  })

  it("will not disburse more than is left", async () => {
    const a = s().allocations.find((x) => x.id === "a-09")!
    const left = allocationRemaining(a, s().disbursements)
    const bad = await s().disburse({ allocationId: a.id, contractorId: "c-04", project: "Fertiliser", milestone: "Batch one", amount: left + 1 })
    expect(bad.ok).toBe(false)
    const good = await s().disburse({ allocationId: a.id, contractorId: "c-04", project: "Fertiliser", milestone: "Batch one", amount: left })
    expect(good.ok).toBe(true)
    expect(allocationRemaining(s().allocations.find((x) => x.id === "a-09")!, s().disbursements)).toBe(0)
  })

  it("runs the report, review and certificate flow", async () => {
    const d = await s().disburse({ allocationId: "a-04", contractorId: "c-02", project: "Teacher hub", milestone: "Fit-out", amount: 100_000_000 })
    expect(d.ok).toBe(true)
    const id = s().disbursements.at(-1)!.id
    expect((await s().issueCertificate(id)).ok).toBe(false)
    expect((await s().submitReport({ disbursementId: id, amountSpent: 98_000_000, summary: "Fit-out finished and handed over." })).ok).toBe(true)
    const rid = s().reports.at(-1)!.id
    expect((await s().reviewReport(rid, "approved", "Checked on site.")).ok).toBe(true)
    expect((await s().issueCertificate(id)).ok).toBe(true)
    expect((await s().issueCertificate(id)).ok).toBe(false)
    expect(s().chain?.ok).toBe(true)
  })

  it("serialises concurrent writes into one clean chain", async () => {
    await Promise.all([
      s().allocate({ ministryId: "m-edu", category: "Capital", amount: 1_000_000, purpose: "One" }),
      s().allocate({ ministryId: "m-edu", category: "Capital", amount: 2_000_000, purpose: "Two" }),
      s().allocate({ ministryId: "m-edu", category: "Capital", amount: 3_000_000, purpose: "Three" }),
    ])
    expect(s().chain?.ok).toBe(true)
    expect(new Set(s().allocations.map((a) => a.id)).size).toBe(s().allocations.length)
  })

  it("flags tampering and recovers on restore", async () => {
    const idx = s().ledger.find((b) => b.type === "DISBURSEMENT")!.index
    await s().tamper(idx, 1, false)
    expect(s().chain).toMatchObject({ ok: false, brokenAt: idx, reason: "content-changed" })
    await s().restore()
    expect(s().chain?.ok).toBe(true)
    await s().tamper(idx, 1, true)
    expect(s().chain).toMatchObject({ ok: false, brokenAt: idx + 1, reason: "link-broken" })
    await s().restore()
    expect(s().chain?.ok).toBe(true)
  })
})
