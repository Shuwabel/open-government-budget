import { describe, expect, it } from "vitest"
import { canonicalize, checkEntry, createBlock, findBlock, sha256Hex, verifyChain } from "@/lib/ledger"
import { buildSeed } from "@/lib/seed"
import type { Block } from "@/lib/types"

const stamp = "2026-03-01T09:00:00.000Z"

async function chainOf(n: number): Promise<Block[]> {
  const out: Block[] = []
  for (let i = 0; i < n; i++) {
    out.push(await createBlock(out.at(-1) ?? null, { type: "ALLOCATION", actor: "Budget Office", payload: { amount: 100 + i }, timestamp: stamp }))
  }
  return out
}

describe("sha256Hex", () => {
  it("matches the published test vector for 'abc'", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
  })
})

describe("canonicalize", () => {
  it("ignores key order", () => {
    expect(canonicalize({ b: 1, a: { d: 2, c: 3 } })).toBe(canonicalize({ a: { c: 3, d: 2 }, b: 1 }))
  })
})

describe("chain", () => {
  it("links each entry to the one before", async () => {
    const c = await chainOf(4)
    expect(c[0].prevHash).toBe("0".repeat(64))
    expect(c[2].prevHash).toBe(c[1].hash)
    expect(await verifyChain(c)).toMatchObject({ ok: true, checked: 4 })
  })

  it("is deterministic", async () => {
    expect((await chainOf(3)).map((b) => b.hash)).toEqual((await chainOf(3)).map((b) => b.hash))
  })

  it("catches an edited amount and names the first bad entry", async () => {
    const c = await chainOf(5)
    c[2] = { ...c[2], payload: { amount: 999999 } }
    expect(await verifyChain(c)).toMatchObject({ ok: false, brokenAt: 2, reason: "content-changed" })
  })

  it("catches a re-hashed edit because the next link no longer matches", async () => {
    const c = await chainOf(5)
    const edited = await createBlock(c[1], { type: "ALLOCATION", actor: "Budget Office", payload: { amount: 1 }, timestamp: stamp })
    c[2] = edited
    expect(await verifyChain(c)).toMatchObject({ ok: false, brokenAt: 3, reason: "link-broken" })
  })
})

describe("lookup", () => {
  it("finds by full hash, 0x prefix and short prefix; refuses short or odd input", async () => {
    const c = await chainOf(3)
    const h = c[1].hash
    expect(findBlock(c, h)?.index).toBe(1)
    expect(findBlock(c, `0x${h}`)?.index).toBe(1)
    expect(findBlock(c, h.slice(0, 10))?.index).toBe(1)
    expect(findBlock(c, h.slice(0, 4))).toBeNull()
    expect(findBlock(c, "not a hash")).toBeNull()
  })

  it("reports altered entries and unknown hashes", async () => {
    const c = await chainOf(3)
    expect((await checkEntry(c, c[1].hash)).state).toBe("verified")
    const h = c[1].hash
    c[1] = { ...c[1], payload: { amount: 5 } }
    expect((await checkEntry(c, h)).state).toBe("altered")
    expect((await checkEntry(c, "ab".repeat(32))).state).toBe("not-found")
  })
})

describe("seed", () => {
  it("builds a valid chain that is identical every time", async () => {
    const a = await buildSeed()
    const b = await buildSeed()
    expect(a.ledger.at(-1)!.hash).toBe(b.ledger.at(-1)!.hash)
    expect((await verifyChain(a.ledger)).ok).toBe(true)
    expect(a.ledger.length).toBeGreaterThan(50)
  })

  it("never over-spends an allocation", async () => {
    const s = await buildSeed()
    for (const a of s.allocations) {
      const spent = s.disbursements.filter((d) => d.allocationId === a.id).reduce((t, d) => t + d.amount, 0)
      expect(spent).toBeLessThanOrEqual(a.amount)
    }
  })

  it("gives every record a tx hash that exists in the ledger", async () => {
    const s = await buildSeed()
    const hashes = new Set(s.ledger.map((b) => b.hash))
    for (const r of [...s.allocations, ...s.disbursements, ...s.reports, ...s.certificates, ...s.contractors]) {
      expect(hashes.has(r.txHash)).toBe(true)
    }
  })
})
