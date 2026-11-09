const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 })
const full = new Intl.NumberFormat("en", { maximumFractionDigits: 0 })

export const naira = (n: number) => `₦${full.format(Math.round(n))}`
export const nairaShort = (n: number) => `₦${compact.format(n)}`

export const dateShort = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })

export const monthLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })
