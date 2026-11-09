import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Newsreader } from "next/font/google"
import { Providers } from "@/components/providers"
import { Shell } from "@/components/shell"
import "./globals.css"

const sans = Geist({ subsets: ["latin"], variable: "--f-sans", display: "swap" })
const mono = Geist_Mono({ subsets: ["latin"], variable: "--f-mono", display: "swap" })
const serif = Newsreader({ subsets: ["latin"], variable: "--f-serif", display: "swap", style: ["normal", "italic"] })

export const metadata: Metadata = {
  title: { default: "Ogbe Budget Ledger", template: "%s · Ogbe Budget Ledger" },
  description:
    "A portfolio demo of public budget tracking: allocations, payments to contractors and spending reports, recorded in a hash-chained ledger anyone can check in the browser. Fictional data, simulated ledger.",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1e8" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1613" },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
      <body>
        <a href="#main" className="skip">
          Skip to content
        </a>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  )
}
