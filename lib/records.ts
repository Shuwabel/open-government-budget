import type { Allocation, Certificate, Contractor, Disbursement, Ministry, Report } from "./types"

/** What goes into the ledger for each kind of record. Plain, flat, readable. */

export const allocationPayload = (a: Allocation, m: Ministry) => ({
  record: a.id,
  ministry: m.name,
  category: a.category,
  fiscalYear: a.fiscalYear,
  amount: a.amount,
  purpose: a.purpose,
})

export const contractorPayload = (c: Contractor) => ({
  record: c.id,
  name: c.name,
  registration: c.registration,
  sector: c.sector,
})

export const disbursementPayload = (d: Disbursement, a: Allocation, c: Contractor, m: Ministry) => ({
  record: d.id,
  ministry: m.name,
  allocation: a.id,
  contractor: c.name,
  project: d.project,
  milestone: d.milestone,
  amount: d.amount,
})

export const reportPayload = (r: Report, c: Contractor, d: Disbursement) => ({
  record: r.id,
  disbursement: d.id,
  contractor: c.name,
  project: d.project,
  amount: r.amountSpent,
  summary: r.summary,
})

export const reviewPayload = (r: Report, decision: "approved" | "rejected", note: string) => ({
  record: r.id,
  report: r.id,
  decision,
  note,
  amount: r.amountSpent,
})

export const certificatePayload = (cert: Certificate, c: Contractor) => ({
  record: cert.id,
  disbursement: cert.disbursementId,
  contractor: c.name,
  project: cert.project,
})
