// Headless role and flow checks against a running build.
//   npm run build && npx next start -p 3111   (in another terminal)
//   BASE=http://localhost:3111 npm run e2e
// Uses the Chrome already installed on the machine through playwright-core.
// Set SHOTS=<dir> to save screenshots at 390 and 1440, light and dark.
import { chromium } from "playwright-core"
import { mkdirSync } from "node:fs"

const BASE = process.env.BASE ?? "http://localhost:3111"
const SHOTS = process.env.SHOTS
if (SHOTS) mkdirSync(SHOTS, { recursive: true })

let failed = 0
const ok = (name) => console.log(`  ok    ${name}`)
const bad = (name, err) => {
  failed++
  console.log(`  FAIL  ${name}\n        ${String(err?.message ?? err).split("\n")[0]}`)
}
async function step(name, fn) {
  try {
    await fn()
    ok(name)
  } catch (e) {
    bad(name, e)
  }
}
const expectText = async (page, text, timeout = 8000) => {
  await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout })
}

const browser = await chromium.launch({ channel: "chrome", headless: true })

async function fresh(width = 1280, height = 900, colorScheme = "light") {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme })
  const page = await ctx.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
  return { ctx, page, errors }
}

console.log("Public: verify")
{
  const { ctx, page, errors } = await fresh()
  await step("home loads with seeded ledger", async () => {
    await page.goto(BASE + "/")
    await expectText(page, "See where every naira")
    await expectText(page, "Recomputed just now in your browser. It matches.")
  })
  await step("verify page: sample entry verifies", async () => {
    await page.goto(BASE + "/verify")
    await page.locator("ul a").first().click()
    await expectText(page, "Verified. This entry is exactly as it was recorded.")
  })
  await step("verify page: a link to a seeded hash works in a clean browser", async () => {
    const hash = await page.evaluate(() => new URLSearchParams(location.search).get("tx"))
    const second = await fresh()
    await second.page.goto(`${BASE}/verify?tx=${hash}`)
    await expectText(second.page, "Verified.")
    await second.page.goto(`${BASE}/verify?tx=${hash.slice(0, 10)}`)
    await expectText(second.page, "Verified.")
    await second.ctx.close()
  })
  await step("verify page: unknown hash is reported, not crashed", async () => {
    await page.goto(`${BASE}/verify?tx=${"ab".repeat(32)}`)
    await expectText(page, "No entry found for that hash.")
  })
  await step("spending page filters", async () => {
    await page.goto(BASE + "/spending")
    await expectText(page, "15 payments")
    await page.getByLabel("Search payments", { exact: true }).fill("borehole")
    await expectText(page, "2 payments")
  })
  await step("no console errors on public pages", async () => {
    if (errors.length) throw new Error(errors[0])
  })
  await ctx.close()
}

console.log("Budget office: allocate, pay, review, certify")
const shared = await fresh()
{
  const { page } = shared
  await step("admin area is gated until sign-in", async () => {
    await page.goto(BASE + "/admin/budget")
    await expectText(page, "This area needs a demo sign-in")
  })
  await step("sign in as the budget officer", async () => {
    await page.goto(BASE + "/login")
    await page.getByRole("button", { name: "Enter as the budget officer" }).click()
    await page.waitForURL("**/admin")
    await expectText(page, "Today at the budget office")
  })
  await step("allocate budget", async () => {
    await page.goto(BASE + "/admin/budget")
    await page.getByLabel("Ministry", { exact: true }).selectOption("m-water")
    await page.getByLabel("Amount (₦)", { exact: true }).fill("500000000")
    await page.getByLabel("What it is for", { exact: true }).fill("Town water tank, test run")
    await page.getByRole("button", { name: "Record the allocation" }).click()
    await expectText(page, "Recorded.")
    await expectText(page, "Town water tank, test run")
  })
  await step("overspending an allocation is refused", async () => {
    await page.goto(BASE + "/admin/disbursements")
    await page.getByLabel("Pay from this allocation", { exact: true }).selectOption({ label: "Water · Town water tank, test run" })
    await page.getByLabel("Contractor", { exact: true }).selectOption("c-01")
    await page.getByLabel("Project", { exact: true }).fill("Town water tank")
    await page.getByLabel("Milestone being paid", { exact: true }).fill("Tank and tower")
    await page.getByLabel("Amount (₦)", { exact: true }).fill("900000000")
    await page.getByRole("button", { name: "Record the payment" }).click()
    await expectText(page, "is left in this allocation")
  })
  await step("disburse to a contractor", async () => {
    await page.getByLabel("Amount (₦)", { exact: true }).fill("300000000")
    await page.getByRole("button", { name: "Record the payment" }).click()
    await expectText(page, "Recorded.")
  })
}

console.log("Contractor: report")
{
  const { page } = shared
  await step("sign in as Adaeze Civil Works and submit a report", async () => {
    await page.goto(BASE + "/login")
    await page.getByLabel("Sign in as", { exact: true }).selectOption("c-01")
    await page.getByRole("button", { name: "Enter as this contractor" }).click()
    await page.waitForURL("**/contractor")
    await page.getByLabel("Payment this report is for", { exact: true }).selectOption({ label: "Town water tank · Tank and tower" })
    await page.getByLabel("Amount actually spent (₦)", { exact: true }).fill("295000000")
    await page.getByLabel("What was done", { exact: true }).fill("Tank poured and tower erected at the market site.")
    await page.getByRole("button", { name: "Submit the report" }).click()
    await expectText(page, "Recorded.")
    await expectText(page, "Awaiting review")
  })
  await step("contractor cannot open the budget office", async () => {
    await page.goto(BASE + "/admin")
    await expectText(page, "This area needs a demo sign-in")
  })
}

console.log("Budget office: review and certify")
{
  const { page } = shared
  await step("approve the report", async () => {
    await page.goto(BASE + "/login")
    await page.getByRole("button", { name: "Enter as the budget officer" }).click()
    await page.waitForURL("**/admin")
    await page.goto(BASE + "/admin/disbursements")
    const card = page.locator("li.card", { hasText: "Town water tank" })
    await card.getByRole("button", { name: "Approve" }).click()
    await expectText(page, "Recorded.")
  })
  await step("issue the completion certificate and verify it publicly", async () => {
    await page.goto(BASE + "/admin/certificates")
    await page.locator("li", { hasText: "Town water tank" }).getByRole("button", { name: "Issue certificate" }).click()
    await expectText(page, "Recorded.")
    await page.getByRole("link", { name: "See the new ledger entry" }).click()
    await expectText(page, "Verified. This entry is exactly as it was recorded.")
    await expectText(page, "Completion certificate for Town water tank")
  })
}

console.log("Tamper check")
{
  const { page } = shared
  await step("edit a payment: tampering is found and flagged site-wide", async () => {
    await page.goto(BASE + "/ledger#tamper")
    await expectText(page, "All ")
    await page.getByRole("button", { name: "Change the stored amount" }).click()
    await expectText(page, "Tampering found at entry")
    await expectText(page, "no longer produce the fingerprint")
    await page.goto(BASE + "/spending")
    await expectText(page, "Tampering found at entry")
  })
  await step("a re-hashed edit breaks the next link instead", async () => {
    await page.goto(BASE + "/ledger#tamper")
    await page.getByRole("button", { name: "Undo the change" }).click()
    await expectText(page, "All ")
    await page.getByLabel("Also recalculate").check()
    await page.getByRole("button", { name: "Change the stored amount" }).click()
    await expectText(page, "points back to a fingerprint")
  })
  await step("the altered entry shows as altered on the verify page", async () => {
    await page.getByRole("link", { name: /Open entry \d+ on the verify page/ }).click()
    await expectText(page, "Altered. This entry no longer matches")
  })
  await step("undo restores a clean ledger", async () => {
    await page.goto(BASE + "/ledger#tamper")
    await page.getByRole("button", { name: "Undo the change" }).click()
    await expectText(page, "All ")
  })
  await step("data survives a reload", async () => {
    await page.reload()
    await expectText(page, "entries")
    await page.goto(BASE + "/admin/certificates")
    await expectText(page, "Town water tank")
  })
}

console.log("Layout at 390px and 1440px, light and dark")
const routes = ["/", "/spending", "/verify", "/ledger", "/login", "/admin", "/admin/budget", "/admin/disbursements", "/admin/contractors", "/admin/certificates", "/contractor"]
for (const [w, h, scheme] of [[390, 844, "light"], [390, 844, "dark"], [1440, 900, "light"], [1440, 900, "dark"]]) {
  const { ctx, page, errors } = await fresh(w, h, scheme)
  await page.goto(BASE + "/login")
  await page.getByRole("button", { name: "Enter as the budget officer" }).click()
  await page.waitForURL("**/admin")
  for (const r of routes) {
    await step(`${w} ${scheme} ${r}: no sideways scroll`, async () => {
      if (r === "/contractor") {
        await page.goto(BASE + "/login")
        await page.getByRole("button", { name: "Enter as this contractor" }).click()
        await page.waitForURL("**/contractor")
      } else {
        await page.goto(BASE + r)
      }
      await page.getByText("Opening the ledger").waitFor({ state: "detached", timeout: 8000 }).catch(() => {})
      await page.waitForTimeout(350)
      const over = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }))
      if (over.sw > over.iw) throw new Error(`scrollWidth ${over.sw} > ${over.iw}`)
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/${w}-${scheme}-${r.replace(/\//g, "_") || "_home"}.png`, fullPage: true })
    })
  }
  await step(`${w} ${scheme}: no console errors`, async () => {
    if (errors.length) throw new Error(errors[0])
  })
  await ctx.close()
}

await shared.ctx.close()
await browser.close()
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed")
process.exit(failed ? 1 : 0)
