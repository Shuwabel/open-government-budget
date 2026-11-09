export type Role = "official" | "contractor" | "public"

export type BlockType =
  | "GENESIS"
  | "ALLOCATION"
  | "CONTRACTOR"
  | "DISBURSEMENT"
  | "REPORT"
  | "REVIEW"
  | "CERTIFICATE"

export interface Block {
  index: number
  timestamp: string
  type: BlockType
  actor: string
  payload: Record<string, unknown>
  prevHash: string
  hash: string
}

export interface Ministry {
  id: string
  name: string
  short: string
}

export interface Allocation {
  id: string
  ministryId: string
  category: string
  fiscalYear: number
  amount: number
  purpose: string
  createdAt: string
  txHash: string
}

export interface Contractor {
  id: string
  name: string
  registration: string
  sector: string
  city: string
  createdAt: string
  txHash: string
}

export interface Disbursement {
  id: string
  allocationId: string
  contractorId: string
  project: string
  milestone: string
  amount: number
  createdAt: string
  txHash: string
}

export type ReportStatus = "pending" | "approved" | "rejected"

export interface Report {
  id: string
  disbursementId: string
  contractorId: string
  amountSpent: number
  summary: string
  submittedAt: string
  status: ReportStatus
  reviewNote: string
  txHash: string
  reviewTxHash: string | null
}

export interface Certificate {
  id: string
  disbursementId: string
  contractorId: string
  project: string
  issuedAt: string
  txHash: string
}

export interface SeedData {
  ministries: Ministry[]
  allocations: Allocation[]
  contractors: Contractor[]
  disbursements: Disbursement[]
  reports: Report[]
  certificates: Certificate[]
  ledger: Block[]
}

export type Result = { ok: true; txHash: string } | { ok: false; error: string }
