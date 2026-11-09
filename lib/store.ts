"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { computeHash, createBlock, verifyChain, type ChainReport } from "./ledger"
import {
  allocationPayload,
  certificatePayload,
  contractorPayload,
  disbursementPayload,
  reportPayload,
  reviewPayload,
} from "./records"
import { buildSeed, OFFICE } from "./seed"
import type {
  Allocation,
  Block,
  BlockType,
  Certificate,
  Contractor,
  Disbursement,
  Ministry,
  Report,
  Result,
  Role,
} from "./types"

export interface Session {
  role: Role
  contractorId?: string
}

interface Data {
  ministries: Ministry[]
  allocations: Allocation[]
  contractors: Contractor[]
  disbursements: Disbursement[]
  reports: Report[]
  certificates: Certificate[]
  ledger: Block[]
  session: Session
  /** Original copy of each entry the visitor has tampered with, keyed by index. */
  tampered: Record<number, Block>
}

interface State extends Data {
  ready: boolean
  chain: ChainReport | null
  boot: () => Promise<void>
  resetDemo: () => Promise<void>
  signIn: (s: Session) => void
  signOut: () => void
  allocate: (i: { ministryId: string; category: string; amount: number; purpose: string }) => Promise<Result>
  registerContractor: (i: { name: string; sector: string; city: string }) => Promise<Result>
  disburse: (i: { allocationId: string; contractorId: string; project: string; milestone: string; amount: number }) => Promise<Result>
  submitReport: (i: { disbursementId: string; amountSpent: number; summary: string }) => Promise<Result>
  reviewReport: (id: string, decision: "approved" | "rejected", note: string) => Promise<Result>
  issueCertificate: (disbursementId: string) => Promise<Result>
  tamper: (index: number, newAmount: number, rehash: boolean) => Promise<void>
  restore: () => Promise<void>
}

export const STORAGE_KEY = "budget-ledger-demo-v1"

const fail = (error: string): Result => ({ ok: false, error })

// One write at a time, so every entry links to the one before it.
let queue: Promise<unknown> = Promise.resolve()
const serial = <T>(fn: () => Promise<T>): Promise<T> => {
  const next = queue.then(fn, fn)
  queue = next.catch(() => undefined)
  return next
}

const slug = (prefix: string, existing: { id: string }[]) => {
  const n = existing.reduce((m, x) => Math.max(m, parseInt(x.id.split("-")[1] ?? "0", 10) || 0), 0) + 1
  return `${prefix}-${String(n).padStart(2, "0")}`
}

export const allocationRemaining = (a: Allocation, disbursements: Disbursement[]) =>
  a.amount - disbursements.filter((d) => d.allocationId === a.id).reduce((s, d) => s + d.amount, 0)

const EMPTY: Data = {
  ministries: [],
  allocations: [],
  contractors: [],
  disbursements: [],
  reports: [],
  certificates: [],
  ledger: [],
  session: { role: "public" },
  tampered: {},
}

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const append = async (type: BlockType, actor: string, payload: Record<string, unknown>) => {
        const prev = get().ledger.at(-1) ?? null
        const block = await createBlock(prev, { type, actor, payload, timestamp: new Date().toISOString() })
        set({ ledger: [...get().ledger, block] })
        return block
      }
      const recheck = async () => set({ chain: await verifyChain(get().ledger) })

      const seed = async () => {
        const s = await buildSeed()
        set({ ...s, tampered: {}, chain: await verifyChain(s.ledger) })
      }

      return {
        ...EMPTY,
        ready: false,
        chain: null,

        boot: async () => {
          if (get().ready) return
          // A stored ledger from an older shape, or none at all: start from the seed.
          if (get().ledger.length === 0) await seed()
          else await recheck()
          set({ ready: true })
        },

        resetDemo: () =>
          serial(async () => {
            const { session } = get()
            await seed()
            set({ session: session.role === "contractor" ? { role: "contractor", contractorId: session.contractorId } : session })
          }),

        signIn: (session) => set({ session }),
        signOut: () => set({ session: { role: "public" } }),

        allocate: (i) =>
          serial(async () => {
            const s = get()
            const m = s.ministries.find((x) => x.id === i.ministryId)
            if (!m) return fail("Choose a ministry.")
            if (!(i.amount > 0)) return fail("Enter an amount above zero.")
            if (!i.purpose.trim()) return fail("Say what the money is for.")
            const a: Allocation = {
              id: slug("a", s.allocations),
              ministryId: m.id,
              category: i.category,
              fiscalYear: 2026,
              amount: Math.round(i.amount),
              purpose: i.purpose.trim(),
              createdAt: new Date().toISOString(),
              txHash: "",
            }
            const b = await append("ALLOCATION", OFFICE, allocationPayload(a, m))
            a.txHash = b.hash
            set({ allocations: [...get().allocations, a] })
            await recheck()
            return { ok: true, txHash: b.hash }
          }),

        registerContractor: (i) =>
          serial(async () => {
            const s = get()
            if (!i.name.trim()) return fail("Enter the contractor's name.")
            if (s.contractors.some((c) => c.name.toLowerCase() === i.name.trim().toLowerCase())) return fail("A contractor with that name is already registered.")
            const c: Contractor = {
              id: slug("c", s.contractors),
              name: i.name.trim(),
              registration: `DEMO-RC-${String(70000 + s.contractors.length * 137 + 11)}`,
              sector: i.sector.trim() || "General works",
              city: i.city.trim() || "Not given",
              createdAt: new Date().toISOString(),
              txHash: "",
            }
            const b = await append("CONTRACTOR", OFFICE, contractorPayload(c))
            c.txHash = b.hash
            set({ contractors: [...get().contractors, c] })
            await recheck()
            return { ok: true, txHash: b.hash }
          }),

        disburse: (i) =>
          serial(async () => {
            const s = get()
            const a = s.allocations.find((x) => x.id === i.allocationId)
            const c = s.contractors.find((x) => x.id === i.contractorId)
            if (!a) return fail("Choose an allocation.")
            if (!c) return fail("Choose a contractor.")
            if (!(i.amount > 0)) return fail("Enter an amount above zero.")
            if (!i.project.trim() || !i.milestone.trim()) return fail("Name the project and the milestone.")
            const left = allocationRemaining(a, s.disbursements)
            if (i.amount > left) return fail(`Only ₦${Math.round(left).toLocaleString("en")} is left in this allocation.`)
            const d: Disbursement = {
              id: slug("d", s.disbursements),
              allocationId: a.id,
              contractorId: c.id,
              project: i.project.trim(),
              milestone: i.milestone.trim(),
              amount: Math.round(i.amount),
              createdAt: new Date().toISOString(),
              txHash: "",
            }
            const m = s.ministries.find((x) => x.id === a.ministryId)!
            const b = await append("DISBURSEMENT", OFFICE, disbursementPayload(d, a, c, m))
            d.txHash = b.hash
            set({ disbursements: [...get().disbursements, d] })
            await recheck()
            return { ok: true, txHash: b.hash }
          }),

        submitReport: (i) =>
          serial(async () => {
            const s = get()
            const d = s.disbursements.find((x) => x.id === i.disbursementId)
            if (!d) return fail("Choose a payment to report on.")
            const c = s.contractors.find((x) => x.id === d.contractorId)!
            if (!(i.amountSpent > 0)) return fail("Enter the amount spent.")
            if (i.summary.trim().length < 10) return fail("Describe the work in a sentence or two.")
            if (s.reports.some((r) => r.disbursementId === d.id && r.status !== "rejected")) return fail("This payment already has a report.")
            const r: Report = {
              id: slug("r", s.reports),
              disbursementId: d.id,
              contractorId: c.id,
              amountSpent: Math.round(i.amountSpent),
              summary: i.summary.trim(),
              submittedAt: new Date().toISOString(),
              status: "pending",
              reviewNote: "",
              txHash: "",
              reviewTxHash: null,
            }
            const b = await append("REPORT", c.name, reportPayload(r, c, d))
            r.txHash = b.hash
            set({ reports: [...get().reports.filter((x) => !(x.disbursementId === d.id && x.status === "rejected")), r] })
            await recheck()
            return { ok: true, txHash: b.hash }
          }),

        reviewReport: (id, decision, note) =>
          serial(async () => {
            const r = get().reports.find((x) => x.id === id)
            if (!r || r.status !== "pending") return fail("That report is not waiting for review.")
            if (decision === "rejected" && !note.trim()) return fail("Say why the report is rejected.")
            const b = await append("REVIEW", OFFICE, reviewPayload(r, decision, note.trim()))
            set({
              reports: get().reports.map((x) =>
                x.id === id ? { ...x, status: decision, reviewNote: note.trim(), reviewTxHash: b.hash } : x,
              ),
            })
            await recheck()
            return { ok: true, txHash: b.hash }
          }),

        issueCertificate: (disbursementId) =>
          serial(async () => {
            const s = get()
            const d = s.disbursements.find((x) => x.id === disbursementId)
            if (!d) return fail("Choose a payment.")
            if (!s.reports.some((r) => r.disbursementId === d.id && r.status === "approved")) return fail("Only approved work can be certified.")
            if (s.certificates.some((x) => x.disbursementId === d.id)) return fail("A certificate was already issued for this payment.")
            const c = s.contractors.find((x) => x.id === d.contractorId)!
            const cert: Certificate = {
              id: slug("x", s.certificates),
              disbursementId: d.id,
              contractorId: c.id,
              project: d.project,
              issuedAt: new Date().toISOString(),
              txHash: "",
            }
            const b = await append("CERTIFICATE", OFFICE, certificatePayload(cert, c))
            cert.txHash = b.hash
            set({ certificates: [...get().certificates, cert] })
            await recheck()
            return { ok: true, txHash: b.hash }
          }),

        tamper: (index, newAmount, rehash) =>
          serial(async () => {
            const s = get()
            const b = s.ledger[index]
            if (!b || typeof b.payload.amount !== "number") return
            const original = s.tampered[index] ?? b
            const edited: Block = { ...b, payload: { ...b.payload, amount: newAmount } }
            if (rehash) edited.hash = await computeHash(edited)
            const ledger = s.ledger.map((x) => (x.index === index ? edited : x))
            set({ ledger, tampered: { ...s.tampered, [index]: original } })
            await recheck()
          }),

        restore: () =>
          serial(async () => {
            const s = get()
            const ledger = s.ledger.map((x) => s.tampered[x.index] ?? x)
            set({ ledger, tampered: {} })
            await recheck()
          }),
      }
    },
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        ministries: s.ministries,
        allocations: s.allocations,
        contractors: s.contractors,
        disbursements: s.disbursements,
        reports: s.reports,
        certificates: s.certificates,
        ledger: s.ledger,
        session: s.session,
        tampered: s.tampered,
      }),
    },
  ),
)

/** Call once on the client: load what the visitor left in this browser, then check it. */
export async function bootStore() {
  await useStore.persist.rehydrate()
  await useStore.getState().boot()
}
