import { createBlock } from "./ledger"
import {
  allocationPayload,
  certificatePayload,
  contractorPayload,
  disbursementPayload,
  reportPayload,
  reviewPayload,
} from "./records"
import type {
  Allocation,
  Block,
  BlockType,
  Certificate,
  Contractor,
  Disbursement,
  Ministry,
  Report,
  SeedData,
} from "./types"

export const OFFICE = "Budget Office"
export const STATE_NAME = "Ogbe State"

const M = 1_000_000

export const MINISTRIES: Ministry[] = [
  { id: "m-health", name: "Ministry of Health", short: "Health" },
  { id: "m-edu", name: "Ministry of Education", short: "Education" },
  { id: "m-works", name: "Ministry of Works and Transport", short: "Works" },
  { id: "m-water", name: "Ministry of Water Resources", short: "Water" },
  { id: "m-agri", name: "Ministry of Agriculture", short: "Agriculture" },
  { id: "m-digital", name: "Ministry of Digital Economy", short: "Digital" },
]

type A = [string, string, string, number, string, string]
const ALLOCATIONS: A[] = [
  ["a-01", "m-health", "Capital", 4200 * M, "Upgrade of 18 primary health centres", "2026-01-12"],
  ["a-02", "m-health", "Recurrent", 1800 * M, "Essential drugs supply for district clinics", "2026-01-12"],
  ["a-03", "m-edu", "Capital", 5500 * M, "Classroom blocks in 40 public schools", "2026-01-14"],
  ["a-04", "m-edu", "Recurrent", 900 * M, "Teacher training programme", "2026-01-14"],
  ["a-05", "m-works", "Capital", 9600 * M, "Ring road rehabilitation, 46 km", "2026-01-16"],
  ["a-06", "m-works", "Capital", 2400 * M, "Eleven rural bridges", "2026-01-16"],
  ["a-07", "m-water", "Capital", 3100 * M, "Boreholes and water points, 60 villages", "2026-01-19"],
  ["a-08", "m-agri", "Capital", 3800 * M, "Irrigation scheme, phase two", "2026-01-21"],
  ["a-09", "m-agri", "Recurrent", 1500 * M, "Fertiliser subsidy for smallholders", "2026-01-21"],
  ["a-10", "m-digital", "Capital", 1200 * M, "Public Wi-Fi in 12 towns", "2026-01-23"],
  ["a-11", "m-digital", "Recurrent", 650 * M, "Land and civil records digitisation", "2026-01-23"],
]

type C = [string, string, string, string, string, string]
const CONTRACTORS: C[] = [
  ["c-01", "Adaeze Civil Works Ltd", "DEMO-RC-10421", "Roads and bridges", "Okene Ridge", "2026-01-26"],
  ["c-02", "Northbank Construction", "DEMO-RC-20877", "Buildings", "Port Alder", "2026-01-26"],
  ["c-03", "ClearSpring Drilling", "DEMO-RC-30152", "Water and sanitation", "Umeh Town", "2026-01-27"],
  ["c-04", "Harvest Irrigation Co.", "DEMO-RC-40396", "Agriculture works", "Eziala", "2026-01-27"],
  ["c-05", "Meridian Health Supplies", "DEMO-RC-51208", "Medical supply", "Port Alder", "2026-01-28"],
  ["c-06", "Lattice Networks", "DEMO-RC-62774", "ICT infrastructure", "Okene Ridge", "2026-01-28"],
]

type D = [string, string, string, string, string, number, string]
const DISBURSEMENTS: D[] = [
  ["d-01", "a-05", "c-01", "Ring road, section A", "Mobilisation and earthworks", 1900 * M, "2026-02-09"],
  ["d-02", "a-05", "c-01", "Ring road, section A", "Base course laid", 2300 * M, "2026-04-14"],
  ["d-03", "a-06", "c-01", "Rural bridges, batch one", "Foundations and piers", 780 * M, "2026-03-03"],
  ["d-04", "a-03", "c-02", "Classroom blocks, lot 1", "Foundations, 14 schools", 1250 * M, "2026-02-23"],
  ["d-05", "a-03", "c-02", "Classroom blocks, lot 1", "Walls and roofing, 14 schools", 1600 * M, "2026-05-18"],
  ["d-06", "a-01", "c-02", "Health centre upgrades, east", "Structural repairs", 940 * M, "2026-03-16"],
  ["d-07", "a-07", "c-03", "Boreholes, northern villages", "First 20 boreholes drilled", 880 * M, "2026-03-30"],
  ["d-08", "a-07", "c-03", "Boreholes, northern villages", "Pumps and solar fitted", 640 * M, "2026-06-08"],
  ["d-09", "a-08", "c-04", "Irrigation, phase two", "Canal excavation", 1450 * M, "2026-04-06"],
  ["d-10", "a-08", "c-04", "Irrigation, phase two", "Pumping station civil works", 1100 * M, "2026-07-13"],
  ["d-11", "a-02", "c-05", "District clinic drugs, quarter one", "Delivery to 31 clinics", 620 * M, "2026-02-16"],
  ["d-12", "a-02", "c-05", "District clinic drugs, quarter two", "Delivery to 31 clinics", 640 * M, "2026-05-04"],
  ["d-13", "a-10", "c-06", "Public Wi-Fi, towns 1 to 6", "Fibre backbone and masts", 520 * M, "2026-06-22"],
  ["d-14", "a-11", "c-06", "Records digitisation", "Scanning of 400,000 files", 210 * M, "2026-08-10"],
  ["d-15", "a-05", "c-01", "Ring road, section B", "Mobilisation and earthworks", 1500 * M, "2026-09-07"],
]

type R = [string, string, number, string, "approved" | "rejected" | "pending", string, string, string]
const REPORTS: R[] = [
  ["r-01", "d-01", 1860 * M, "Clearing, cut and fill complete over 12 km. Receipts and survey sheets filed.", "approved", "Matches site survey.", "2026-03-20", "2026-03-27"],
  ["r-02", "d-02", 2290 * M, "Base course laid over 12 km. Material tests passed.", "approved", "Tests attached and in range.", "2026-05-22", "2026-05-29"],
  ["r-03", "d-03", 770 * M, "Piers poured at all eleven sites.", "approved", "Inspector signed off.", "2026-04-10", "2026-04-15"],
  ["r-04", "d-04", 1250 * M, "Foundations complete in 14 schools.", "approved", "Verified by state engineer.", "2026-04-02", "2026-04-09"],
  ["r-05", "d-05", 1710 * M, "Walls up and roofed in 14 schools.", "rejected", "Spent figure is above the amount released. Resubmit with a breakdown.", "2026-06-25", "2026-07-02"],
  ["r-06", "d-07", 872 * M, "20 boreholes drilled and logged.", "approved", "Borehole logs match.", "2026-05-12", "2026-05-19"],
  ["r-07", "d-08", 640 * M, "Solar pumps fitted on all 20 boreholes.", "approved", "Photos and serial numbers checked.", "2026-07-15", "2026-07-21"],
  ["r-08", "d-09", 1430 * M, "Canal excavation finished over 9 km.", "approved", "Within budget.", "2026-06-03", "2026-06-10"],
  ["r-09", "d-11", 618 * M, "All 31 clinics signed for delivery.", "approved", "Delivery notes match.", "2026-03-24", "2026-03-30"],
  ["r-10", "d-12", 640 * M, "Second quarter delivery to 31 clinics.", "approved", "Delivery notes match.", "2026-06-15", "2026-06-20"],
  ["r-11", "d-06", 925 * M, "Roof and wall repairs at six centres.", "pending", "", "2026-10-02", ""],
  ["r-12", "d-13", 515 * M, "Backbone laid and 14 masts raised.", "pending", "", "2026-10-06", ""],
  ["r-13", "d-10", 1090 * M, "Pump house civil works at 80 percent.", "pending", "", "2026-10-21", ""],
]

const CERTS: [string, string, string][] = [
  ["x-01", "d-03", "2026-04-20"],
  ["x-02", "d-07", "2026-05-26"],
  ["x-03", "d-11", "2026-04-06"],
]

const at = (date: string, hour = 9) => `${date}T${String(hour).padStart(2, "0")}:00:00.000Z`

export async function buildSeed(): Promise<SeedData> {
  const ledger: Block[] = []
  const push = async (type: BlockType, actor: string, payload: Record<string, unknown>, timestamp: string) => {
    const b = await createBlock(ledger.at(-1) ?? null, { type, actor, payload, timestamp })
    ledger.push(b)
    return b.hash
  }

  await push("GENESIS", OFFICE, { note: `Demo ledger opened for ${STATE_NAME} (fictional)`, fiscalYear: 2026 }, at("2026-01-05"))

  const mById = new Map(MINISTRIES.map((m) => [m.id, m]))
  const steps: { date: string; run: () => Promise<void> }[] = []

  const allocations: Allocation[] = []
  for (const [id, ministryId, category, amount, purpose, date] of ALLOCATIONS) {
    steps.push({
      date,
      run: async () => {
        const a: Allocation = { id, ministryId, category, fiscalYear: 2026, amount, purpose, createdAt: at(date), txHash: "" }
        a.txHash = await push("ALLOCATION", OFFICE, allocationPayload(a, mById.get(ministryId)!), a.createdAt)
        allocations.push(a)
      },
    })
  }

  const contractors: Contractor[] = []
  for (const [id, name, registration, sector, city, date] of CONTRACTORS) {
    steps.push({
      date,
      run: async () => {
        const c: Contractor = { id, name, registration, sector, city, createdAt: at(date, 10), txHash: "" }
        c.txHash = await push("CONTRACTOR", OFFICE, contractorPayload(c), c.createdAt)
        contractors.push(c)
      },
    })
  }

  const disbursements: Disbursement[] = []
  for (const [id, allocationId, contractorId, project, milestone, amount, date] of DISBURSEMENTS) {
    steps.push({
      date,
      run: async () => {
        const d: Disbursement = { id, allocationId, contractorId, project, milestone, amount, createdAt: at(date, 11), txHash: "" }
        const a = allocations.find((x) => x.id === allocationId)!
        const c = contractors.find((x) => x.id === contractorId)!
        d.txHash = await push("DISBURSEMENT", OFFICE, disbursementPayload(d, a, c, mById.get(a.ministryId)!), d.createdAt)
        disbursements.push(d)
      },
    })
  }

  const reports: Report[] = []
  for (const [id, disbursementId, amountSpent, summary, status, note, submitted, reviewed] of REPORTS) {
    steps.push({
      date: submitted,
      run: async () => {
        const d = disbursements.find((x) => x.id === disbursementId)!
        const c = contractors.find((x) => x.id === d.contractorId)!
        const r: Report = {
          id,
          disbursementId,
          contractorId: c.id,
          amountSpent,
          summary,
          submittedAt: at(submitted, 14),
          status: "pending",
          reviewNote: "",
          txHash: "",
          reviewTxHash: null,
        }
        r.txHash = await push("REPORT", c.name, reportPayload(r, c, d), r.submittedAt)
        reports.push(r)
      },
    })
    if (status !== "pending") {
      steps.push({
        date: reviewed,
        run: async () => {
          const r = reports.find((x) => x.id === id)!
          r.status = status
          r.reviewNote = note
          r.reviewTxHash = await push("REVIEW", OFFICE, reviewPayload(r, status, note), at(reviewed, 15))
        },
      })
    }
  }

  const certificates: Certificate[] = []
  for (const [id, disbursementId, date] of CERTS) {
    steps.push({
      date,
      run: async () => {
        const d = disbursements.find((x) => x.id === disbursementId)!
        const c = contractors.find((x) => x.id === d.contractorId)!
        const cert: Certificate = { id, disbursementId, contractorId: c.id, project: d.project, issuedAt: at(date, 16), txHash: "" }
        cert.txHash = await push("CERTIFICATE", OFFICE, certificatePayload(cert, c), cert.issuedAt)
        certificates.push(cert)
      },
    })
  }

  // Stable by date, so a step never runs before the record it depends on.
  const ordered = steps.map((s, i) => ({ s, i })).sort((x, y) => (x.s.date === y.s.date ? x.i - y.i : x.s.date < y.s.date ? -1 : 1))
  for (const { s } of ordered) await s.run()

  return { ministries: MINISTRIES, allocations, contractors, disbursements, reports, certificates, ledger }
}
